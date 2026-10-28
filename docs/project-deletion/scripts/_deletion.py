"""Numbered deletion operations. Importing this module performs no I/O."""
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
from types import SimpleNamespace
from _state import (Error, ROOT, digest, encode, identity, load, locked, make_directory,
                    operation, parser, plan, read, sync_dir, unique, write)
from _shared import env_hash, load_context, private_file, read_state, require_consumer, require_private_location
import _github as github
import _dns as dns
from _completion import validate_completion


ARCHIVES = ('values.env', 'verification.json', 'progress.json', 'result.json')


def import_initialization(args):
    ctx = load_context(SimpleNamespace(env=args.initialization_env), require_verified=False)
    progress = read_state(ctx)
    archived = {}
    for name in ARCHIVES:
        source = private_file(ctx.env_path if name == 'values.env' else ctx.env_path.parent / name)
        archived[name] = source.read_bytes()
        if len(archived[name]) > 1024 * 1024:
            raise Error('Historical initialization file exceeds its bound.')
    observed_progress = json.loads(archived['progress.json'], object_pairs_hook=unique)
    if (observed_progress != progress
            or hashlib.sha256(archived['values.env']).hexdigest() != env_hash(ctx.env_path)):
        raise Error('Initialization inputs changed before deletion import; reconcile and retry.')
    verification = json.loads(archived['verification.json'], object_pairs_hook=unique)
    result = json.loads(archived['result.json'], object_pairs_hook=unique)
    validate_completion(result, ctx.values, progress, hashlib.sha256(archived['progress.json']).hexdigest())
    repo_id = progress.get('repository_id')
    if (verification.get('scope') != 'full' or verification.get('repository') != ctx.values['REPOSITORY']
            or verification.get('env_sha256') != env_hash(ctx.env_path)
            or verification.get('evidence', {}).get('github', {}).get('repository_id') != repo_id
            or result.get('repository') != ctx.values['REPOSITORY'] or result.get('env_sha256') != env_hash(ctx.env_path)
            or result.get('observations', {}).get('repository_id') != repo_id):
        raise Error('Historical full-scope initialization identity/receipts disagree. Expiry alone is allowed.')
    env_path = require_private_location(args.env)
    directory = make_directory(env_path.parent)
    with locked(directory):
        archive = make_directory(directory / 'initialization')
        hashes = {}
        for name in ARCHIVES:
            raw = archived[name]
            hashes[name] = hashlib.sha256(raw).hexdigest()
            target = archive / name
            if target.exists():
                if private_file(target).read_bytes() != raw:
                    raise Error('Historical snapshot already exists with different bytes; preserve both contexts.')
            else:
                descriptor = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
                with os.fdopen(descriptor, 'wb') as stream:
                    stream.write(raw)
                    stream.flush()
                    os.fsync(stream.fileno())
        sync_dir(archive)
        values = ctx.values
        access = progress.get('ci_app_access_verified', {})
        # Existing initialization owns the canonical App identifiers; do not invent new credentials.
        from _github_bootstrap import CI_APP_ID, CI_INSTALLATION_ID
        value = identity({'repository': values['REPOSITORY'], 'repository_id': repo_id,
            'slug': values['PROJECT_SLUG'], 'org': values['GH_ORG'], 'maintainer': values['MAINTAINER_LOGIN'],
            'operator_ssh': values['OPERATOR_SSH'], 'operator_ipv4': values['OPERATOR_IPV4'],
            'ci_source': values['CI_SOURCE'], 'source_sha': progress.get('source_sha'),
            'hostnames': {env: values[env.upper() + '_HOSTNAME'] for env in ('staging', 'production')},
            'ports': {env: {component: int(values[env.upper() + '_' + component.upper() + '_PORT'])
                            for component in ('frontend', 'backend')} for env in ('staging', 'production')},
            'dns_zone': values['DNS_ZONE'], 'dns_zone_id': values['DNS_ZONE_ID'], 'dns_project_id': values['DNS_PROJECT_ID'],
            'env_sha256': env_hash(ctx.env_path), 'archive_sha256': digest(hashes),
            'workflow_ids': {env: progress.get(env + '_workflow_id') for env in ('staging', 'production')},
            'app_installation_id': access.get('installation_id', CI_INSTALLATION_ID), 'app_id': access.get('app_id', CI_APP_ID)})
        snapshot = {'schema_version': 1, 'identity': value, 'archives': hashes, 'dns_token_file': values['DNS_TOKEN_FILE']}
        target = directory / 'snapshot.json'
        if target.exists() and read(target) != snapshot:
            raise Error('Existing deletion snapshot differs; identity is immutable.')
        write(target, snapshot)
        reference = 'STATE_DIRECTORY=' + str(directory) + '\nINITIALIZATION_SNAPSHOT=' + str(target) + '\n'
        if env_path.exists():
            if private_file(env_path).read_text() != reference:
                raise Error('Deletion reference file already exists with different contents.')
        else:
            descriptor = os.open(env_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
            with os.fdopen(descriptor, 'w') as stream:
                stream.write(reference)
                stream.flush()
                os.fsync(stream.fileno())
            sync_dir(directory)
    print('Archived historical initialization identity privately. Receipt expiry was not treated as changed ownership.')
    print('Next: python3 -B docs/project-deletion/scripts/2_1_inspect_and_plan.py --env ' + shlex.quote(str(env_path)))


def host(snapshot, action, selected=None, extras=None):
    value = snapshot['identity']
    argv = ['python3', '-B', value['ci_source'] + '/docs/project-deletion/scripts/_host.py', '--receive']
    remote = shlex.join(argv)
    envelope = {'schema_version': 1, 'action': action, 'identity': value,
                'extras': selected['extras'] if selected else extras or [], 'plan': selected}
    try:
        response = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
            '-o', 'ConnectTimeout=15', value['operator_ssh'], remote], input=encode(envelope).decode(),
            capture_output=True, text=True, timeout=3900 if action == 'unregister' else 600)
    except (OSError, subprocess.TimeoutExpired):
        raise Error('Operator response was lost/uncertain. Rerun the same journaled operation; do not reset state.') from None
    if response.returncode:
        # Only the fixed safe error line from reviewed code is eligible for display.
        safe = response.stderr.strip()
        if safe.startswith('Operator deletion stopped: ') and '\n' not in safe and len(safe) < 1000:
            raise Error(safe)
        raise Error('Operator deletion did not complete; inspect its protected journal before retrying.')
    try:
        if len(response.stdout) > 4 * 1024 * 1024:
            raise ValueError()
        result = json.loads(response.stdout, object_pairs_hook=unique)
        if not isinstance(result, dict):
            raise ValueError()
        return result
    except ValueError:
        raise Error('Operator response was malformed; no absence receipt recorded.') from None


def inspect_and_plan(args):
    directory, snapshot = load(args)
    with locked(directory):
        target = directory / 'plan.json'
        if target.exists():
            selected = read(target)
            if selected['identity'] != snapshot['identity']:
                raise Error('Existing plan identity differs from the snapshot.')
            print('Existing immutable plan: ' + str(target))
            print('Plan SHA-256: ' + digest(selected))
            return
        extras = []
        if args.extra_manifest:
            manifest = read(args.extra_manifest)
            if set(manifest) != {'schema_version', 'resources'} or manifest['schema_version'] != 1:
                raise Error('Unsupported exact extra-resource manifest.')
            extras = manifest['resources']
        observed_host = host(snapshot, 'inspect', extras=extras)
        selected = {'schema_version': 1, 'identity': snapshot['identity'], 'host': observed_host,
                    'github': github.inspect(snapshot['identity']), 'dns': dns.inspect(snapshot), 'extras': extras,
                    'policy': 'purge-host-and-github-preserve-local', 'tool': observed_host['tool']}
        write(target, selected)
    print('Inspect protected plan: ' + str(target))
    print('Plan SHA-256: ' + digest(selected))
    print('This plan purges project databases, host backups, credentials, dedicated TLS, GitHub packages and repository.')
    print('Local worktree, notes and retrieved recovery archives remain. Shared infrastructure remains.')
    for script in ('3_1_quiesce.py', '4_1_remove_host_resources.py', '5_1_unregister_ci.py',
                   '6_1_remove_provider_resources.py', '7_1_delete_repository.py', '8_1_verify_deletion.py', '8_2_remove_host_context.py'):
        print('python3 -B docs/project-deletion/scripts/' + script + ' --env ' + shlex.quote(str(args.env.resolve())) + ' --plan-sha256 ' + digest(selected))


def receipt(directory, selected, name):
    value = read(directory / (name + '.json'))
    if value.get('plan_sha256') != digest(selected) or value.get('verified') is not True:
        raise Error('Required predecessor receipt missing: ' + name)
    return value


def perform(args, action):
    directory, snapshot = load(args)
    selected = plan(directory, args.plan_sha256)
    if selected['identity'] != snapshot['identity']:
        raise Error('Selected plan differs from the historical immutable identity.')
    with locked(directory):
        if action == 'quiesce':
            github.quiesce(directory, selected)
            result = host(snapshot, 'quiesce', selected)
        elif action == 'purge':
            receipt(directory, selected, 'quiesce')
            result = host(snapshot, 'purge', selected)
        elif action == 'unregister':
            receipt(directory, selected, 'purge')
            result = host(snapshot, 'unregister', selected)
        elif action == 'providers':
            receipt(directory, selected, 'unregister')
            host(snapshot, 'verify', selected)
            dns.remove(directory, selected, snapshot)
            github.remove_resources(directory, selected)
            result = {'verified': True}
        elif action == 'repository':
            receipt(directory, selected, 'providers')
            host(snapshot, 'verify', selected)
            dns.verify(selected, snapshot)
            github.verify_resources_absent(selected)
            github.remove_repository(directory, selected)
            result = {'verified': True}
        elif action == 'verify':
            receipt(directory, selected, 'repository')
            github.verify(selected)
            dns.verify(selected, snapshot)
            result = host(snapshot, 'verify', selected)
            write(directory / 'final-receipt.json', {'schema_version': 1, 'plan_sha256': digest(selected),
                'repository_id': selected['identity']['repository_id'], 'verified': True,
                'host_identity': selected['host']['identity'], 'scope': selected['policy'],
                'extra_evidence': selected['extras'],
                'retained': ['local worktree and notes', 'local initialization/recovery/deletion archives',
                             'shared infrastructure', 'provider and GitHub retention/audit history'],
                'host_context_cleanup': 'pending'})
        elif action == 'cleanup-context':
            receipt(directory, selected, 'verify')
            github.verify(selected)
            dns.verify(selected, snapshot)
            result = host(snapshot, 'cleanup-context', selected)
            if result.get('context_absent') is not True:
                raise Error('Operator deletion context remains; final cleanup incomplete.')
            final = read(directory / 'final-receipt.json')
            final['host_context_cleanup'] = 'verified absent'
            write(directory / 'final-receipt.json', final)
        else:
            raise Error('Unknown deletion stage.')
        if result.get('verified') is not True and action != 'cleanup-context':
            raise Error('Stage did not return a verified outcome.')
        write(directory / (action + '.json'), dict(result, plan_sha256=digest(selected), verified=True))
    print('Verified deletion stage: ' + action + '. Protected receipts: ' + str(directory))


def cli(action):
    arguments = parser('Explicit project deletion step: ' + action.replace('-', ' ') + '.')
    if action == 'import':
        arguments.add_argument('--initialization-env', type=Path, required=True, help='Existing protected initialization values.env; read as historical identity, without expiry.')
    if action == 'inspect':
        arguments.add_argument('--extra-manifest', type=Path, help='Protected exact paths and reviewed provenance for unusual project-only assets.')
    args = arguments.parse_args()
    try:
        if action == 'import':
            import_initialization(args)
        elif action == 'inspect':
            inspect_and_plan(args)
        else:
            perform(args, action)
    except (Error, OSError, ValueError, KeyError, TypeError) as error:
        message = str(error) if isinstance(error, Error) else 'Private deletion state or resource response is invalid; preserve state and reconcile.'
        arguments.exit(1, 'Deletion stopped: ' + message + '\n')
