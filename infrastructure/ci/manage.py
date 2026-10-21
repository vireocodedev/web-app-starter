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
import shutil
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
TOKEN = Path('/etc/web-app-ci/github-app.pem')
LEGACY_TOKEN = Path('/etc/web-app-ci/github-token')
INSTALLED = Path('/usr/local/lib/web-app-ci')
SYSTEMD = Path('/etc/systemd/system')


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
    for index in range(config.get('worker_slots', 1)):
        worker = ctl.slot_config(config, index)
        with ctl.slot_context(index):
            if state_of(ctl.manager_unit(worker), 'ActiveState') not in ('inactive', 'failed'):
                raise ctl.BoundaryError('ci-manager-must-be-stopped')
            if ctl.remaining_processes(worker):
                raise ctl.BoundaryError('ci-processes-still-active')
            if ctl.STATE.exists() and json.loads(ctl.protected_file(ctl.STATE)) != {}:
                raise ctl.BoundaryError('job-state-not-empty')
            if (ctl.BASE / 'job.img').exists() or Path('/run/netns', ctl.NETNS).exists():
                raise ctl.BoundaryError('job-boundary-still-present')
            for entry in ctl.mount_entries():
                if entry['target'] == str(ctl.BASE) or entry['target'].startswith(str(ctl.BASE) + '/'):
                    raise ctl.BoundaryError('ci-mounts-still-active')
    if ctl.pool_state():
        raise ctl.BoundaryError('pool-reservations-not-empty')


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
        headers={'Authorization': 'Bearer ' + ctl.credential_token(token, repo), 'Accept': 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'web-app-ci-registration',
                 'Content-Type': 'application/json'})
    try:
        with ctl.app_module().https_opener(ctl.RejectRedirect()).open(request, timeout=30) as response:
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
    return ctl.app_credentials(TOKEN)


def prepare_app_auth(settings_path, expected_sha, expected_controller_sha):
    root_required()
    source_protected()
    with lifecycle_lock():
        expected_digest(expected_sha)
        config = ctl.load_config()
        require_idle(config)
        require_no_ledger()
        if config['projects'] or TOKEN.exists() or TOKEN.is_symlink() or LEGACY_TOKEN.exists() or LEGACY_TOKEN.is_symlink():
            raise ctl.BoundaryError('app-auth-preparation-requires-unregistered-credential-free-foundation')
        installed = INSTALLED
        metadata = installed.lstat()
        if not stat.S_ISDIR(metadata.st_mode) or metadata.st_uid != 0 or metadata.st_mode & 0o022:
            raise ctl.BoundaryError('untrusted-installed-controller-directory')
        controller = installed / 'controller.py'
        metadata = controller.lstat()
        if (not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != 0 or metadata.st_mode & 0o022
                or not re.fullmatch('[0-9a-f]{64}', expected_controller_sha)
                or hashlib.sha256(controller.read_bytes()).hexdigest() != expected_controller_sha):
            raise ctl.BoundaryError('installed-controller-changed')
        settings = json.loads(ctl.protected_file(Path(settings_path)), object_pairs_hook=ctl.unique_object)
        ctl.app_module().validate_settings(settings, ctl.BoundaryError)
        ctl.validate_repository(settings['owner'] + '/settings-check')
        if settings['app_id'] is None:
            raise ctl.BoundaryError('github-app-identifiers-required')
        destinations = (
            (installed / 'github_app.py', (SOURCE / 'github_app.py').read_bytes(), 0o755),
            (ctl.APP_SETTINGS, (json.dumps(settings, sort_keys=True, indent=2) + '\n').encode(), 0o600),
            (SYSTEMD / SERVICE, (SOURCE / SERVICE).read_bytes(), 0o644),
            (ctl.ROOTFS / 'usr/local/lib/web-app-ci/validate-job.py',
             (SOURCE / 'validate-job.py').read_bytes(), 0o755),
            (ctl.ROOTFS / 'usr/local/lib/web-app-ci/start-job.sh',
             (SOURCE / 'start-job.sh').read_bytes(), 0o755),
            (controller, (SOURCE / 'controller.py').read_bytes(), 0o755),
        )
        for destination, _, _ in destinations:
            for parent in (destination.parent, *destination.parent.parents):
                metadata = parent.lstat()
                if not stat.S_ISDIR(metadata.st_mode) or metadata.st_uid != 0 or metadata.st_mode & 0o022:
                    raise ctl.BoundaryError('untrusted-auth-adapter-parent')
        for destination, _, _ in destinations:
            if destination.exists() or destination.is_symlink():
                metadata = destination.lstat()
                if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != 0 or metadata.st_mode & 0o022:
                    raise ctl.BoundaryError('untrusted-auth-adapter-destination')
        receipt = ctl.BASE / 'validation.json'
        if receipt.exists():
            ctl.protected_path(receipt)
            receipt.unlink()
        for destination, content, mode in destinations:
            descriptor, name = tempfile.mkstemp(prefix='.app-auth-', dir=destination.parent)
            temporary = Path(name)
            try:
                with os.fdopen(descriptor, 'wb') as stream:
                    os.fchmod(stream.fileno(), mode)
                    stream.write(content)
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, destination)
                sync_directory(destination.parent)
            finally:
                temporary.unlink(missing_ok=True)
        ctl.command('systemctl', 'daemon-reload')
        return {'operation': 'prepare-app-auth', 'controller_enabled': False,
                'credential_introduced': False, 'full_validation_required': True}


def repair_https_memory(expected_sha, expected_controller_sha, expected_app_sha):
    root_required()
    source_protected()
    with lifecycle_lock():
        expected_digest(expected_sha)
        config = ctl.load_config()
        require_idle(config)
        require_no_ledger()
        destinations = (
            (INSTALLED / 'github_app.py', SOURCE / 'github_app.py', expected_app_sha),
            (INSTALLED / 'controller.py', SOURCE / 'controller.py', expected_controller_sha),
        )
        unchanged = (
            (INSTALLED / 'validation.py', SOURCE / 'validation.py'),
            (ctl.ROOTFS / 'usr/local/lib/web-app-ci/start-job.sh', SOURCE / 'start-job.sh'),
            (ctl.ROOTFS / 'usr/local/lib/web-app-ci/validate-job.py', SOURCE / 'validate-job.py'),
            (SYSTEMD / SERVICE, SOURCE / SERVICE),
        )
        for destination, *_ in (*destinations, *unchanged):
            for parent in (destination.parent, *destination.parent.parents):
                info = parent.lstat()
                if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
                    raise ctl.BoundaryError('untrusted-https-repair-parent')
            info = destination.lstat()
            if (not stat.S_ISREG(info.st_mode) or info.st_uid != 0
                    or info.st_mode & 0o022 or info.st_size > 1024 * 1024):
                raise ctl.BoundaryError('untrusted-https-repair-destination')
        for destination, _, expected in destinations:
            if (not re.fullmatch('[0-9a-f]{64}', expected)
                    or hashlib.sha256(destination.read_bytes()).hexdigest() != expected):
                raise ctl.BoundaryError('installed-https-client-changed')
        for destination, source in unchanged:
            if destination.read_bytes() != source.read_bytes():
                raise ctl.BoundaryError('https-repair-source-incompatible')
        expected_digest(expected_sha)
        require_idle(config)
        receipt = ctl.BASE / 'validation.json'
        if receipt.exists():
            ctl.protected_path(receipt)
            receipt.unlink()
            sync_directory(ctl.BASE)
        for destination, source, _ in destinations:
            descriptor, name = tempfile.mkstemp(prefix='.https-repair-', dir=destination.parent)
            temporary = Path(name)
            try:
                with os.fdopen(descriptor, 'wb') as stream:
                    os.fchmod(stream.fileno(), 0o755)
                    stream.write(source.read_bytes())
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, destination)
                sync_directory(destination.parent)
            finally:
                temporary.unlink(missing_ok=True)
        return {'operation': 'repair-https-memory', 'controller_enabled': False,
                'credential_introduced': False, 'configuration_changed': False,
                'full_validation_required': True}


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


POOL_PREDECESSOR = 'bef4b3169896c259c5bcf841a2a51755d14a7160fb51ee98e5916eb14195492f'
POOL_MIGRATION = 'serial-to-slots-v1'
POOL_PREDECESSOR_PROBE = 'afce2ec9cde27440259a07fdf0fd97edd5bb11ef07fb741ab33b9e826dd4e44e'
POSTGRES_READINESS_PROBE = '135f72e42b52296bcd285bee160121042570392b4e83f983755905a42f045855'
# Exact serial foundation at 9750814; this repair does not upgrade its modules.
POSTGRES_LEGACY_COMPONENT_SHA256 = {
    'controller.py': 'bef4b3169896c259c5bcf841a2a51755d14a7160fb51ee98e5916eb14195492f',
    'validation.py': '2b40e7b4e014a500e585a1054946414b9d63fbc452dea4571e104d0332ab1d0c',
    'github_app.py': '9e308019dca0561ccd1486690f186141ccbfa22740c307a36f30015aa0f06430',
    'start-job.sh': '34b58e84b3d23e85c7315a6adc8c93476c8eed0c92071d136b1b44be4ba2eecb',
    'service': '1ffbf352a7152a63d1f4ebd7062db965fe4a21cfd116726bf61eea9effb74a69',
}


def supported_predecessor_probes():
    return {POOL_PREDECESSOR_PROBE, POSTGRES_READINESS_PROBE}


def serial_readiness_components():
    return {'controller.py': INSTALLED / 'controller.py',
            'validation.py': INSTALLED / 'validation.py',
            'github_app.py': INSTALLED / 'github_app.py',
            'start-job.sh': ctl.ROOTFS / 'usr/local/lib/web-app-ci/start-job.sh',
            'service': SYSTEMD / SERVICE}


def require_serial_readiness_components():
    for name, path in serial_readiness_components().items():
        trusted_executable(path)
        if hashlib.sha256(path.read_bytes()).hexdigest() != POSTGRES_LEGACY_COMPONENT_SHA256[name]:
            raise ctl.BoundaryError('postgres-repair-legacy-component-changed')


def readiness_repair_ledger(config, configuration_sha):
    directory = pool_migration_directory()
    if not directory.exists() and not directory.is_symlink():
        return None
    ledger = read_pool_migration()
    if ledger['phase'] != 'rolled-back':
        raise ctl.BoundaryError('postgres-repair-requires-completed-rollback')
    if ledger['old_config'] != config or ledger['backups']['config'] != configuration_sha:
        raise ctl.BoundaryError('postgres-repair-rollback-configuration-mismatch')
    # A retained audit ledger is allowed only after exact predecessor restore.
    # The probe is the sole deliberate exception: an earlier repair may have
    # already replaced it with the other explicitly supported serial variant.
    for name, path in migration_destinations(config).items():
        if name == 'validate-job.py':
            continue
        if path == ctl.CONFIG:
            ctl.protected_path(path)
        else:
            trusted_executable(path)
        if hashlib.sha256(path.read_bytes()).hexdigest() != ledger['backups'][name]:
            raise ctl.BoundaryError('postgres-repair-rollback-components-changed')
    for name, (source, _destination) in migration_candidates().items():
        if hashlib.sha256(source.read_bytes()).hexdigest() != ledger['candidate'][name]:
            raise ctl.BoundaryError('postgres-repair-rollback-candidate-changed')
    # Also prove that no former slot still has a manager/process/mount/intent.
    require_idle(ledger['new_config'])
    path = directory / 'ledger.json'
    ctl.protected_file(path)
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_readiness_boundary(config, expected_boundary_sha):
    if type(expected_boundary_sha) is not str or not re.fullmatch('[0-9a-f]{64}', expected_boundary_sha):
        raise ctl.BoundaryError('invalid-expected-boundary-sha256')
    path = serial_readiness_components()['controller.py']
    # Hash/metadata checks occur before this exact installed legacy code executes.
    spec = importlib.util.spec_from_file_location('verified_postgres_serial_controller', path)
    legacy = importlib.util.module_from_spec(spec)
    content = path.read_bytes()
    if hashlib.sha256(content).hexdigest() != POSTGRES_LEGACY_COMPONENT_SHA256['controller.py']:
        raise ctl.BoundaryError('postgres-repair-legacy-component-changed')
    # Execute the exact pinned file without creating an installed __pycache__
    # directory; the probe is the only component this repair may replace.
    exec(compile(content, str(path), 'exec'), legacy.__dict__)
    try:
        actual = legacy.boundary_digest(config)
    except Exception:
        raise ctl.BoundaryError('postgres-repair-current-boundary-unavailable') from None
    if actual != expected_boundary_sha:
        raise ctl.BoundaryError('postgres-repair-boundary-changed')


def repair_postgres_readiness(expected_sha, expected_boundary_sha):
    root_required()
    source_protected()
    with lifecycle_lock():
        expected_digest(expected_sha)
        configuration_sha = ctl.config_digest()
        if configuration_sha != expected_sha:
            raise ctl.BoundaryError('configuration-changed')
        config = ctl.load_config()
        if config.get('worker_slots', 1) != 1:
            raise ctl.BoundaryError('postgres-repair-requires-serial-installation')
        require_idle(config)
        require_no_ledger()
        require_serial_readiness_components()
        helper = INSTALLED / 'provision_slots.py'
        slots = ctl.POOL_BASE / 'slots'
        if helper.exists() or helper.is_symlink() or slots.is_symlink() or (slots.exists() and any(slots.iterdir())):
            raise ctl.BoundaryError('postgres-repair-requires-serial-installation')
        probe = migration_destinations(config)['validate-job.py']
        trusted_executable(probe)
        probe_sha = hashlib.sha256(probe.read_bytes()).hexdigest()
        if probe_sha not in supported_predecessor_probes():
            raise ctl.BoundaryError('postgres-repair-unknown-probe')
        replacement = (SOURCE / 'validate-job.py').read_bytes()
        if hashlib.sha256(replacement).hexdigest() != POSTGRES_READINESS_PROBE:
            raise ctl.BoundaryError('postgres-repair-source-probe-changed')
        ledger_sha = readiness_repair_ledger(config, configuration_sha)
        # No previous passing receipt is required: the known readiness race can
        # prevent one. Actual pinned legacy code must still prove the complete
        # current boundary against the operator's explicit expected hash.
        expected_digest(expected_sha)
        if ctl.config_digest() != configuration_sha:
            raise ctl.BoundaryError('configuration-changed')
        require_idle(config)
        require_serial_readiness_components()
        trusted_executable(probe)
        probe_sha = hashlib.sha256(probe.read_bytes()).hexdigest()
        if probe_sha not in supported_predecessor_probes():
            raise ctl.BoundaryError('postgres-repair-unknown-probe')
        require_readiness_boundary(config, expected_boundary_sha)
        result = {'operation': 'repair-postgres-readiness-v1', 'controller_enabled': False,
                  'credential_introduced': False, 'configuration_changed': False,
                  'configuration_sha256': configuration_sha, 'probe_sha256': POSTGRES_READINESS_PROBE,
                  'full_validation_required': True, 'mutation_performed': False}
        if probe_sha == POSTGRES_READINESS_PROBE:
            # Literal no-write idempotence; this does not certify validation.
            return result
        invalidate_pool_receipts(config)
        atomic_file(probe, replacement, 0o755)
        if ledger_sha is not None:
            ledger_path = pool_migration_directory() / 'ledger.json'
            ctl.protected_file(ledger_path)
            current = hashlib.sha256(ledger_path.read_bytes()).hexdigest()
            if current != ledger_sha:
                raise ctl.BoundaryError('postgres-repair-rollback-ledger-changed')
        result['mutation_performed'] = True
        return result


def pool_migration_directory():
    return ctl.POOL_BASE / 'migration-v1'


def atomic_file(path, content, mode):
    descriptor, name = tempfile.mkstemp(prefix='.pool-migration-', dir=path.parent)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, 'wb') as stream:
            os.fchmod(stream.fileno(), mode)
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        sync_directory(path.parent)
    finally:
        temporary.unlink(missing_ok=True)


def migration_destinations(config):
    uid = config['uid']
    return {'controller.py': INSTALLED / 'controller.py',
            'validation.py': INSTALLED / 'validation.py',
            'validate-job.py': ctl.ROOTFS / 'usr/local/lib/web-app-ci/validate-job.py',
            'service': SYSTEMD / SERVICE,
            'manager': SYSTEMD / f'user@{uid}.service.d/web-app-ci.conf',
            'slice': SYSTEMD / f'user-{uid}.slice.d/web-app-ci.conf',
            'config': ctl.CONFIG}


def migration_candidates():
    # Explicit reviewed source/destination map: the user-side probe belongs in
    # the trusted rootfs, never beside the root controller's installed modules.
    return {'controller.py': (SOURCE / 'controller.py', INSTALLED / 'controller.py'),
            'validation.py': (SOURCE / 'validation.py', INSTALLED / 'validation.py'),
            'provision_slots.py': (SOURCE / 'provision_slots.py', INSTALLED / 'provision_slots.py'),
            'validate-job.py': (SOURCE / 'validate-job.py', ctl.ROOTFS / 'usr/local/lib/web-app-ci/validate-job.py')}


def invalidate_pool_receipts(config):
    for index in range(config.get('worker_slots', 1)):
        with ctl.slot_context(index):
            for name in ('validation.json', 'validation-failure.json'):
                path = ctl.BASE / name
                if path.exists():
                    ctl.protected_path(path)
                    path.unlink()
                    sync_directory(path.parent)
    path = ctl.POOL_BASE / 'pool-validation.json'
    if path.exists():
        ctl.protected_path(path)
        path.unlink()
        sync_directory(path.parent)


def read_pool_migration():
    directory = ctl.protected_path(pool_migration_directory(), directory=True)
    ledger = json.loads(ctl.protected_file(directory / 'ledger.json'), object_pairs_hook=ctl.unique_object)
    if (type(ledger) is not dict or set(ledger) != {'migration', 'phase', 'old_config', 'new_config', 'backups', 'candidate'}
            or ledger['migration'] != POOL_MIGRATION
            or ledger['phase'] not in ('prepared', 'applying', 'applied', 'rolling-back', 'rolled-back')):
        raise ctl.BoundaryError('invalid-pool-migration-ledger')
    ctl.validate_config(ledger['old_config'])
    ctl.validate_config(ledger['new_config'])
    if (type(ledger['backups']) is not dict or type(ledger['candidate']) is not dict
            or ledger['old_config'].get('worker_slots', 1) != 1
            or set(ledger['backups']) != set(migration_destinations(ledger['old_config']))
            or set(ledger['candidate']) != set(migration_candidates())):
        raise ctl.BoundaryError('invalid-pool-migration-ledger')
    if ledger['backups']['validate-job.py'] not in supported_predecessor_probes():
        raise ctl.BoundaryError('pool-migration-predecessor-probe-backup-mismatch')
    if any(type(digest) is not str or not re.fullmatch('[0-9a-f]{64}', digest)
           for digest in ledger['candidate'].values()):
        raise ctl.BoundaryError('invalid-pool-migration-candidate-hash')
    if ledger['candidate']['validate-job.py'] != POSTGRES_READINESS_PROBE:
        raise ctl.BoundaryError('pool-migration-candidate-probe-mismatch')
    for name, digest in ledger['backups'].items():
        if type(digest) is not str or not re.fullmatch('[0-9a-f]{64}', digest) or hashlib.sha256(ctl.protected_file(directory / name).encode()).hexdigest() != digest:
            raise ctl.BoundaryError('pool-migration-backup-changed')
    return ledger


def migrate_pool(config_path, expected_sha, expected_controller_sha):
    root_required()
    source_protected()
    with lifecycle_lock():
        expected_digest(expected_sha)
        old = ctl.load_config()
        require_idle(old)
        require_no_ledger()
        if old.get('worker_slots', 1) != 1 or pool_migration_directory().exists():
            raise ctl.BoundaryError('pool-migration-already-started-or-not-serial')
        if expected_controller_sha != POOL_PREDECESSOR:
            raise ctl.BoundaryError('unsupported-pool-predecessor')
        previous_path = INSTALLED / 'controller.py'
        trusted_executable(previous_path)
        if hashlib.sha256(previous_path.read_bytes()).hexdigest() != POOL_PREDECESSOR:
            raise ctl.BoundaryError('installed-pool-predecessor-changed')
        probe_path = migration_destinations(old)['validate-job.py']
        trusted_executable(probe_path)
        if hashlib.sha256(probe_path.read_bytes()).hexdigest() not in supported_predecessor_probes():
            raise ctl.BoundaryError('installed-pool-predecessor-probe-changed')
        proposed = ctl.validate_config(json.loads(ctl.protected_file(Path(config_path)), object_pairs_hook=ctl.unique_object))
        # A pool migration changes capacity only; repository authorization,
        # identity roots, host denylist and timeout/storage contracts stay fixed.
        capacity = {'worker_slots', 'ci_cpu_budget_percent', 'ci_memory_budget_mib', 'host_reserve_mib',
                    'memory_high_mib', 'memory_max_mib', 'swap_max_mib', 'cpu_quota_percent', 'poll_seconds'}
        if {key: value for key, value in old.items() if key not in capacity} != {key: value for key, value in proposed.items() if key not in capacity}:
            raise ctl.BoundaryError('pool-migration-unrelated-configuration-change')
        if proposed.get('worker_slots', 1) < 2:
            raise ctl.BoundaryError('pool-migration-needs-multiple-slots')
        # Verify the predecessor's full source/config/boot-bound receipt before
        # replacing anything; stale receipts never authorize migration.
        spec = importlib.util.spec_from_file_location('verified_pool_predecessor', previous_path)
        predecessor = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(predecessor)
        receipt = json.loads(ctl.protected_file(ctl.POOL_BASE / 'validation.json'))
        if (receipt.get('passed') is not True or receipt.get('configuration_sha256') != expected_sha
                or receipt.get('boundary_sha256') != predecessor.boundary_digest(old)
                or receipt.get('boot_id') != Path('/proc/sys/kernel/random/boot_id').read_text().strip()):
            raise ctl.BoundaryError('pool-predecessor-validation-required')
        module = load_slot_provisioner()
        module.preflight(proposed)
        for path in migration_destinations(old).values():
            trusted_executable(path) if path != ctl.CONFIG else ctl.protected_path(path)
        if (INSTALLED / 'provision_slots.py').exists():
            raise ctl.BoundaryError('unexpected-installed-pool-provisioner')
        candidate_paths = migration_candidates()
        candidate_contents = {name: source.read_bytes() for name, (source, _destination) in candidate_paths.items()}
        if hashlib.sha256(candidate_contents['validate-job.py']).hexdigest() != POSTGRES_READINESS_PROBE:
            raise ctl.BoundaryError('pool-migration-source-probe-changed')
        directory = pool_migration_directory()
        # Publish the complete backup+ledger directory atomically. A power loss
        # before publication leaves only an unreferenced staging directory,
        # never a final migration directory without a recoverable ledger.
        staging = Path(tempfile.mkdtemp(prefix='.migration-v1-', dir=ctl.POOL_BASE))
        try:
            backups = {}
            for name, destination in migration_destinations(old).items():
                content = destination.read_bytes()
                digest = hashlib.sha256(content).hexdigest()
                if name == 'validate-job.py' and digest not in supported_predecessor_probes():
                    raise ctl.BoundaryError('installed-pool-predecessor-probe-changed')
                atomic_file(staging / name, content, 0o600)
                backups[name] = digest
            candidate = {name: hashlib.sha256(content).hexdigest() for name, content in candidate_contents.items()}
            ledger = {'migration': POOL_MIGRATION, 'phase': 'prepared', 'old_config': old,
                      'new_config': proposed, 'backups': backups, 'candidate': candidate}
            ctl.atomic_json(staging / 'ledger.json', ledger)
            sync_directory(staging)
            os.rename(staging, directory)
            sync_directory(ctl.POOL_BASE)
        finally:
            if staging.exists():
                shutil.rmtree(staging)
        expected_digest(expected_sha)
        require_idle(old)
        invalidate_pool_receipts(old)
        ledger['phase'] = 'applying'
        ctl.atomic_json(directory / 'ledger.json', ledger)
        # Replace the trusted baseline probe before cloning any new rootfs. A
        # crash here or mid-provision retains exact predecessor probe backup and
        # applying ledger; receipts are invalid and the controller stays disabled.
        atomic_file(candidate_paths['validate-job.py'][1], candidate_contents['validate-job.py'], 0o755)
        module.provision(proposed, SOURCE)
        for name, (_source, destination) in candidate_paths.items():
            if name != 'validate-job.py':
                atomic_file(destination, candidate_contents[name], 0o755)
        atomic_config(proposed)
        ledger['phase'] = 'applied'
        ctl.atomic_json(directory / 'ledger.json', ledger)
        return {'operation': 'migrate-pool', 'migration': POOL_MIGRATION,
                'worker_slots': proposed['worker_slots'], 'controller_enabled': False,
                'configuration_sha256': ctl.config_digest(), 'full_validation_required': True}


def trusted_executable(path):
    # Unlike secret files these installed source/unit files are world-readable.
    for parent in (path.parent, *path.parent.parents):
        info = parent.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ctl.BoundaryError('untrusted-pool-migration-parent')
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
        raise ctl.BoundaryError('untrusted-pool-migration-destination')


def load_slot_provisioner():
    spec = importlib.util.spec_from_file_location('pool_provisioner', SOURCE / 'provision_slots.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ctl = ctl
    return module


def rollback_pool(expected_sha):
    root_required()
    source_protected()
    with lifecycle_lock():
        expected_digest(expected_sha)
        ledger = read_pool_migration()
        if ledger['phase'] == 'rolled-back':
            raise ctl.BoundaryError('pool-already-rolled-back')
        old, proposed = ledger['old_config'], ledger['new_config']
        current = ctl.load_config()
        if current not in (old, proposed):
            raise ctl.BoundaryError('pool-rollback-configuration-changed')
        require_idle(proposed)
        require_no_ledger()
        # Never roll back over an unknown later source revision.
        for name, digest in ledger['candidate'].items():
            path = migration_candidates()[name][1]
            if name == 'validate-job.py' and not path.exists():
                raise ctl.BoundaryError('pool-rollback-installed-probe-missing')
            if path.exists():
                trusted_executable(path)
                actual = hashlib.sha256(path.read_bytes()).hexdigest()
                if actual not in {digest, ledger['backups'].get(name)}:
                    raise ctl.BoundaryError('pool-rollback-installed-source-changed')
        invalidate_pool_receipts(proposed)
        ledger['phase'] = 'rolling-back'
        ctl.atomic_json(pool_migration_directory() / 'ledger.json', ledger)
        # Slots only contain trusted baselines now: require_idle proved there are
        # no mounts/processes/registrations. Remove only exact derived resources.
        provisioner = load_slot_provisioner()
        provisioner.remove_extra_slots(proposed, SYSTEMD, atomic_file, trusted_executable)
        for name, destination in migration_destinations(old).items():
            content = ctl.protected_file(pool_migration_directory() / name).encode()
            atomic_file(destination, content, 0o600 if name == 'config' else 0o755 if name.endswith('.py') else 0o644)
        (INSTALLED / 'provision_slots.py').unlink(missing_ok=True)
        ctl.command('systemctl', 'daemon-reload')
        ledger['phase'] = 'rolled-back'
        ctl.atomic_json(pool_migration_directory() / 'ledger.json', ledger)
        return {'operation': 'rollback-pool', 'controller_enabled': False,
                'configuration_sha256': ctl.config_digest(), 'full_validation_required': True}


def inspect():
    result = {'operation': 'inspect', 'installed': ctl.CONFIG.exists(), 'supported_migration': POOL_MIGRATION}
    if result['installed']:
        config = ctl.load_config()
        result.update(configuration_sha256=ctl.config_digest(), projects=config['projects'],
                      worker_slots=config.get('worker_slots', 1),
                      migration_ledger_present=pool_migration_directory().exists(),
                      controller_active_state=state_of(SERVICE, 'ActiveState'),
                      controller_unit_file_state=state_of(SERVICE, 'UnitFileState'),
                      validation_receipt_present=(ctl.BASE / 'validation.json').exists(),
                      registration_recovery_required=ledger_path().exists() or ledger_path().is_symlink())
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    operations = parser.add_subparsers(dest='operation', required=True)
    operations.add_parser('inspect')
    postgres = operations.add_parser('repair-postgres-readiness-v1')
    postgres.add_argument('--expected-config-sha256', required=True)
    postgres.add_argument('--expected-boundary-sha256', required=True)
    pool = operations.add_parser('migrate-pool')
    pool.add_argument('--config', required=True)
    pool.add_argument('--expected-config-sha256', required=True)
    pool.add_argument('--expected-controller-sha256', required=True)
    rollback = operations.add_parser('rollback-pool')
    rollback.add_argument('--expected-config-sha256', required=True)
    installer = operations.add_parser('install')
    installer.add_argument('--config', required=True)
    registration = operations.add_parser('register')
    registration.add_argument('--project', required=True)
    registration.add_argument('--expected-config-sha256', required=True)
    auth = operations.add_parser('prepare-app-auth')
    auth.add_argument('--settings', required=True)
    auth.add_argument('--expected-config-sha256', required=True)
    auth.add_argument('--expected-controller-sha256', required=True)
    https = operations.add_parser('repair-https-memory')
    https.add_argument('--expected-config-sha256', required=True)
    https.add_argument('--expected-controller-sha256', required=True)
    https.add_argument('--expected-github-app-sha256', required=True)
    recovery = operations.add_parser('recover-registration')
    recovery.add_argument('--expected-config-sha256', required=True)
    upgrade = operations.add_parser('upgrade')
    upgrade.add_argument('--expected-config-sha256', required=True)
    args = parser.parse_args(argv)
    root_required()
    if args.operation == 'inspect':
        result = inspect()
    elif args.operation == 'repair-postgres-readiness-v1':
        result = repair_postgres_readiness(args.expected_config_sha256, args.expected_boundary_sha256)
    elif args.operation == 'migrate-pool':
        result = migrate_pool(args.config, args.expected_config_sha256, args.expected_controller_sha256)
    elif args.operation == 'rollback-pool':
        result = rollback_pool(args.expected_config_sha256)
    elif args.operation == 'register':
        result = register(args.project, args.expected_config_sha256)
    elif args.operation == 'prepare-app-auth':
        result = prepare_app_auth(args.settings, args.expected_config_sha256, args.expected_controller_sha256)
    elif args.operation == 'repair-https-memory':
        result = repair_https_memory(args.expected_config_sha256, args.expected_controller_sha256,
                                     args.expected_github_app_sha256)
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
