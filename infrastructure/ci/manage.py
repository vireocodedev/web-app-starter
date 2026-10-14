#!/usr/bin/env python3
"""Root-only lifecycle operations for the fixed shared CI foundation.

Installation requires a fresh host. Registration invalidates boundary
validation and never starts the controller.
"""
import argparse
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

SOURCE = Path(__file__).resolve().parent / 'ci-runner'
spec = importlib.util.spec_from_file_location('foundation_controller', SOURCE / 'controller.py')
ctl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ctl)
SERVICE = 'web-app-ci-controller.service'
LOCK_DIR = Path('/run/web-app-ci')
TOKEN = Path('/etc/web-app-ci/github-token')


def root_required():
    if os.geteuid() != 0:
        raise ctl.BoundaryError('root-lifecycle-required')


def source_protected():
    # Installer source is privileged code, so every ancestor and source entry
    # must be root-owned and non-writable by another account; symlinks fail.
    for path in [SOURCE, *SOURCE.parents, *SOURCE.iterdir(), Path(__file__)]:
        information = path.lstat()
        if information.st_uid != 0 or information.st_mode & 0o022 or not (
                stat.S_ISDIR(information.st_mode) or stat.S_ISREG(information.st_mode)):
            raise ctl.BoundaryError('untrusted-foundation-source')


def lifecycle_lock():
    LOCK_DIR.mkdir(mode=0o700, exist_ok=True)
    ctl.protected_path(LOCK_DIR, directory=True)
    descriptor = os.open(LOCK_DIR / 'controller.lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    information = os.fstat(descriptor)
    if not stat.S_ISREG(information.st_mode) or information.st_uid != 0 or information.st_mode & 0o077:
        os.close(descriptor)
        raise ctl.BoundaryError('unsafe-controller-lock')
    try:
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BaseException:
        os.close(descriptor)
        raise
    return os.fdopen(descriptor, 'r+')


def state_of(unit, property_name):
    return ctl.command('systemctl', 'show', unit, '-p', property_name, '--value').stdout.strip()


def require_idle(config):
    if state_of(SERVICE, 'ActiveState') not in ('inactive', 'failed') or state_of(SERVICE, 'UnitFileState') not in ('disabled', 'masked'):
        raise ctl.BoundaryError('controller-must-be-stopped-and-disabled')
    if state_of(ctl.manager_unit(config), 'ActiveState') not in ('inactive', 'failed'):
        raise ctl.BoundaryError('ci-manager-must-be-stopped')
    if ctl.remaining_processes(config):
        raise ctl.BoundaryError('ci-processes-still-active')
    if ctl.STATE.exists() and json.loads(ctl.protected_file(ctl.STATE)) != {}:
        raise ctl.BoundaryError('job-state-not-empty')
    if (ctl.BASE / 'job.img').exists() or Path('/run/netns/web-app-ci').exists():
        raise ctl.BoundaryError('job-boundary-still-present')
    for entry in ctl.mount_entries():
        if entry['target'] == str(ctl.BASE) or entry['target'].startswith(str(ctl.BASE) + '/'):
            raise ctl.BoundaryError('ci-mounts-still-active')


def expected_digest(value):
    if not re.fullmatch('[0-9a-f]{64}', value):
        raise ctl.BoundaryError('invalid-expected-configuration-sha256')
    actual = hashlib.sha256(ctl.protected_file(ctl.CONFIG).encode()).hexdigest()
    if value != actual:
        raise ctl.BoundaryError('configuration-changed')
    return actual


def project_input(path):
    data = json.loads(ctl.protected_file(Path(path)), object_pairs_hook=ctl.unique_object)
    if type(data) is not dict or set(data) != {'slug', 'repository'}:
        raise ctl.BoundaryError('invalid-registration-input')
    ctl.validate_projects({data['slug']: {'repository': data['repository']}})
    return data


def permission_request(token, repo, suffix='', method='GET', payload=None, missing_ok=False):
    # Every operation is scoped to one validated repository and a fixed endpoint.
    ctl.validate_repository(repo)
    runner = re.fullmatch(r'/actions/runners/[1-9][0-9]*', suffix)
    inventory = re.fullmatch(r'/actions/runners\?per_page=100&page=([1-9]|10)', suffix)
    if not ((suffix == '' and method == 'GET')
            or (suffix == '/actions/runners/generate-jitconfig' and method == 'POST')
            or (runner and method in ('GET', 'DELETE'))
            or (inventory and method == 'GET')):
        raise ctl.BoundaryError('permission-probe-path-or-method-rejected')
    request = urllib.request.Request('https://api.github.com/repos/' + repo + suffix,
        data=json.dumps(payload).encode() if payload is not None else None, method=method,
        headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'web-app-ci-registration',
                 'Content-Type': 'application/json'})
    try:
        with urllib.request.build_opener(ctl.RejectRedirect()).open(request, timeout=30) as response:
            data = response.read(8 * 1024 * 1024)
            result = json.loads(data) if data else None
            if method == 'GET' and type(result) is not dict:
                raise ctl.BoundaryError('repository-permission-proof-invalid-response')
            return result
    except urllib.error.HTTPError as error:
        if missing_ok and runner and method == 'GET' and error.code == 404:
            return None
        if method == 'POST' and error.code in ctl.REGISTRATION_REJECTIONS:
            raise ctl.BoundaryError('repository-permission-proof-rejected') from None
        raise ctl.BoundaryError('repository-permission-proof-failed') from None
    except (urllib.error.URLError, ValueError, TimeoutError):
        raise ctl.BoundaryError('repository-permission-proof-failed') from None


def ledger_path():
    return ctl.BASE / 'registration-proof.json'


def require_no_ledger():
    path = ledger_path()
    if path.exists() or path.is_symlink():
        raise ctl.BoundaryError('registration-recovery-required')


def sync_directory(directory):
    descriptor = os.open(directory, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def save_ledger(value):
    directory = ctl.protected_path(ctl.BASE, directory=True)
    path = ledger_path()
    if path.exists() or path.is_symlink():
        ctl.protected_path(path)
    descriptor, name = tempfile.mkstemp(prefix='.registration-proof-', dir=directory)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, 'w') as stream:
            os.fchmod(stream.fileno(), 0o600)
            json.dump(value, stream, sort_keys=True)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        sync_directory(directory)
    finally:
        temporary.unlink(missing_ok=True)


def load_ledger():
    value = json.loads(ctl.protected_file(ledger_path()), object_pairs_hook=ctl.unique_object)
    if type(value) is not dict or set(value) != {'schema_version', 'configuration_sha256', 'repo', 'proof_name', 'runner_id'}:
        raise ctl.BoundaryError('invalid-registration-cleanup-ledger')
    if type(value['schema_version']) is not int or value['schema_version'] != 1:
        raise ctl.BoundaryError('invalid-registration-cleanup-ledger')
    ctl.validate_repository(value['repo'])
    if not re.fullmatch('[0-9a-f]{64}', value['configuration_sha256']) or not re.fullmatch('web-app-ci-registration-proof-[0-9a-f]{32}', value['proof_name']):
        raise ctl.BoundaryError('invalid-registration-cleanup-ledger')
    if value['runner_id'] is not None and (type(value['runner_id']) is not int or value['runner_id'] <= 0):
        raise ctl.BoundaryError('invalid-registration-cleanup-ledger')
    return value


def clear_ledger():
    ctl.protected_path(ledger_path())
    ledger_path().unlink()
    sync_directory(ctl.BASE)


def resolve_proof_runner(token, ledger):
    runner = ctl.owned_runner(runner_request, token, ledger['repo'], ledger['proof_name'], None)
    ledger['runner_id'] = runner['id']
    save_ledger(ledger)
    return ledger


def runner_request(token, repo, suffix, method='GET'):
    return permission_request(token, repo, '/' + suffix, method)


def cleanup_proof(token, ledger):
    if ledger['runner_id'] is None:
        ledger = resolve_proof_runner(token, ledger)
    current = ctl.owned_runner(runner_request, token, ledger['repo'], ledger['proof_name'], ledger['runner_id'])
    if current is None:
        clear_ledger()
        return
    ctl.delete_owned_runner(runner_request, token, ledger['repo'], current)
    clear_ledger()


def verify_permissions(token, repositories):
    for repo in repositories:
        require_no_ledger()
        metadata = permission_request(token, repo)
        if type(metadata) is not dict or type(metadata.get('full_name')) is not str or metadata['full_name'].lower() != repo.lower() or metadata.get('private') is not True:
            raise ctl.BoundaryError('private-repository-identity-required')
        ledger = {'schema_version': 1, 'configuration_sha256': ctl.config_digest(), 'repo': repo,
                  'proof_name': 'web-app-ci-registration-proof-' + os.urandom(16).hex(), 'runner_id': None}
        save_ledger(ledger)  # Persist intent BEFORE a possibly successful POST.
        try:
            response = permission_request(token, repo, '/actions/runners/generate-jitconfig', 'POST',
                {'name': ledger['proof_name'], 'runner_group_id': 1,
                 'labels': sorted(ctl.LABELS), 'work_folder': '_work'})
            runner = response.get('runner') if type(response) is dict else None
            runner_id = runner.get('id') if type(runner) is dict else None
            if type(runner_id) is not int or runner_id <= 0:
                raise ctl.BoundaryError('invalid-permission-proof-runner')
            ledger['runner_id'] = runner_id
            save_ledger(ledger)  # Nonsecret ID survives deletion failure/crash.
        except ctl.BoundaryError as error:
            if str(error) == 'repository-permission-proof-rejected':
                # Explicit client rejection is distinct from an uncertain
                # transport/server failure: this request created no runner.
                clear_ledger()
                raise
            # No fresh POST retry. Explicit recover-registration reconciles the
            # durable unique-name intent using this same protected repository.
            raise ctl.BoundaryError('registration-recovery-required') from None
        cleanup_proof(token, ledger)


def registration_token():
    token = ctl.protected_file(TOKEN).strip()
    if not token or '\n' in token or '\r' in token:
        raise ctl.BoundaryError('invalid-registration-credential')
    return token


def recover_registration(expected_sha):
    root_required()
    with lifecycle_lock():
        actual = expected_digest(expected_sha)
        config = ctl.load_config()
        require_idle(config)
        ledger = load_ledger()
        if ledger['configuration_sha256'] != actual:
            raise ctl.BoundaryError('registration-ledger-configuration-mismatch')
        cleanup_proof(registration_token(), ledger)
        return {'operation': 'recover-registration', 'proof_registration_removed': True,
                'configuration_changed': False, 'controller_enabled': False}


def atomic_config(config):
    directory = ctl.protected_path(ctl.CONFIG.parent, directory=True)
    temporary = None
    try:
        descriptor, name = tempfile.mkstemp(prefix='.registration-', dir=directory)
        temporary = Path(name)
        with os.fdopen(descriptor, 'w') as stream:
            os.fchmod(stream.fileno(), 0o600)
            json.dump(config, stream, sort_keys=True, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, ctl.CONFIG)
        directory_fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def register(project_path, expected_sha):
    root_required()
    with lifecycle_lock():
        expected_digest(expected_sha)
        config = ctl.load_config()
        require_idle(config)
        require_no_ledger()
        project = project_input(project_path)
        if project['slug'] in config['projects']:
            raise ctl.BoundaryError('project-already-registered')
        config['projects'][project['slug']] = {'repository': project['repository']}
        ctl.validate_config(config)
        token = registration_token()
        verify_permissions(token, config['projects'][project['slug']].values())
        # Re-check immediately before committing; root registration shares the
        # controller's lock and refuses unexpected concurrent config edits.
        expected_digest(expected_sha)
        require_idle(config)
        receipt = ctl.BASE / 'validation.json'
        if receipt.exists():
            ctl.protected_path(receipt)
            receipt.unlink()
        atomic_config(config)
        return {'operation': 'register', 'registered': project['slug'],
                'configuration_sha256': ctl.config_digest(), 'controller_enabled': False,
                'full_validation_required': True}


def inspect():
    result = {'operation': 'inspect', 'installed': ctl.CONFIG.exists(), 'supported_migration': False}
    if result['installed']:
        config = ctl.load_config()
        result.update(configuration_sha256=ctl.config_digest(), projects=config['projects'],
                      controller_active_state=state_of(SERVICE, 'ActiveState'),
                      controller_unit_file_state=state_of(SERVICE, 'UnitFileState'),
                      validation_receipt_present=(ctl.BASE / 'validation.json').exists(),
                      registration_recovery_required=ledger_path().exists() or ledger_path().is_symlink())
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    operations = parser.add_subparsers(dest='operation', required=True)
    operations.add_parser('inspect')
    installer = operations.add_parser('install')
    installer.add_argument('--config', required=True)
    registration = operations.add_parser('register')
    registration.add_argument('--project', required=True)
    registration.add_argument('--expected-config-sha256', required=True)
    recovery = operations.add_parser('recover-registration')
    recovery.add_argument('--expected-config-sha256', required=True)
    upgrade = operations.add_parser('upgrade')
    upgrade.add_argument('--expected-config-sha256', required=True)
    args = parser.parse_args(argv)
    root_required()
    if args.operation == 'inspect':
        result = inspect()
    elif args.operation == 'register':
        result = register(args.project, args.expected_config_sha256)
    elif args.operation == 'recover-registration':
        result = recover_registration(args.expected_config_sha256)
    elif args.operation == 'install':
        source_protected()
        config = ctl.validate_config(json.loads(ctl.protected_file(Path(args.config)), object_pairs_hook=ctl.unique_object))
        if config['projects']:
            raise ctl.BoundaryError('fresh-install-project-map-must-be-empty')
        with lifecycle_lock():
            process = subprocess.run(['/usr/bin/bash', str(SOURCE / 'install.sh'), args.config],
                                     env={'PATH': '/usr/sbin:/usr/bin:/sbin:/bin'}, check=False)
            if process.returncode:
                raise ctl.BoundaryError('fresh-install-failed-no-automatic-retry')
        result = {'operation': 'install', 'controller_enabled': False, 'full_validation_required': True}
    else:
        expected_digest(args.expected_config_sha256)
        result = {'operation': 'upgrade', 'mutation_performed': False,
                  'supported': False, 'reason': 'No verified upgrade or legacy migration exists in v0.1.',
                  'next_step': 'Review a future versioned migration and validate it on a disposable server.'}
        print(json.dumps(result, sort_keys=True))
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ctl.BoundaryError, OSError, ValueError, TypeError, KeyError):
        # Never print credential data, API bodies, input JSON, argv or tracebacks.
        print('foundation-operation-rejected; no controller activation performed', file=sys.stderr)
        sys.exit(1)
