"""Protected, immutable deletion identity and durable operation receipts."""
import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'docs/template-initialization/scripts'))
from _shared import InitError, private_file, read_values, require_private_location, load_context, read_state, env_hash
from types import SimpleNamespace
from _completion import validate_completion

Error = InitError
TEMPLATE = 'vireocodedev/web-app-starter'


def unique(items):
    result = {}
    for key, value in items:
        if key in result:
            raise Error('Duplicate JSON field.')
        result[key] = value
    return result


def encode(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode()


def digest(value):
    return hashlib.sha256(encode(value)).hexdigest()


def read(path):
    try:
        raw = private_file(path).read_bytes()
        if len(raw) > 4 * 1024 * 1024:
            raise ValueError()
        value = json.loads(raw, object_pairs_hook=unique)
        if not isinstance(value, dict):
            raise ValueError()
        return value
    except (OSError, ValueError):
        raise Error('Protected deletion state is missing or invalid.') from None


def sync_dir(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def write(path, value):
    path = require_private_location(path)
    if path.exists() or path.is_symlink():
        private_file(path)
    fd, temporary = tempfile.mkstemp(prefix='.' + path.name + '-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(encode(value) + b'\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        sync_dir(path.parent)
    finally:
        Path(temporary).unlink(missing_ok=True)


def make_directory(path):
    path = require_private_location(Path(path) / 'anchor.json').parent
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    info = path.lstat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700:
        raise Error('Deletion directory must be owned and mode 0700.')
    return path


def identity(value):
    required = {'repository', 'repository_id', 'slug', 'org', 'maintainer', 'operator_ssh',
                'operator_ipv4', 'ci_source', 'source_sha', 'hostnames', 'ports', 'dns_zone',
                'dns_zone_id', 'dns_project_id', 'env_sha256', 'archive_sha256', 'workflow_ids',
                'app_installation_id', 'app_id'}
    if not isinstance(value, dict) or set(value) != required:
        raise Error('Deletion identity fields differ.')
    repo, slug = value['repository'], value['slug']
    if (not isinstance(repo, str) or not re.fullmatch(r'[a-zA-Z0-9_.-]+/[a-z][a-z0-9-]{2,39}', repo)
            or repo.lower() == TEMPLATE or slug != repo.split('/')[1]
            or value['org'] != repo.split('/')[0]
            or type(value['repository_id']) is not int or value['repository_id'] <= 0):
        raise Error('Exact consumer repository identity required; template deletion forbidden.')
    if set(value['hostnames']) != {'staging', 'production'} or set(value['ports']) != {'staging', 'production'}:
        raise Error('Exactly two environment identities required.')
    if any(not re.fullmatch(r'[a-z0-9][a-z0-9.-]+', host) for host in value['hostnames'].values()):
        raise Error('Invalid environment hostname.')
    for ports in value['ports'].values():
        if set(ports) != {'frontend', 'backend'} or any(type(p) is not int or not 1024 <= p <= 65535 for p in ports.values()):
            raise Error('Invalid deployment port identity.')
    if not re.fullmatch(r'root@[0-9.]+', value['operator_ssh']):
        raise Error('Require the recorded root operator address.')
    if not re.fullmatch(r'/root/[A-Za-z0-9_.-]+', value['ci_source']):
        raise Error('Require the recorded canonical operator source.')
    if not re.fullmatch('[0-9a-f]{40}', value['source_sha'] or ''):
        raise Error('Require the recorded exact release source SHA.')
    if set(value['workflow_ids']) != {'staging', 'production'} or any(type(v) is not int or v <= 0 for v in value['workflow_ids'].values()):
        raise Error('Require recorded workflow numeric identities.')
    if any(type(value[key]) is not int or value[key] <= 0 for key in ('app_id', 'app_installation_id')):
        raise Error('Require recorded shared App numeric identities.')
    if value['operator_ssh'] != 'root@' + value['operator_ipv4']:
        raise Error('Operator address differs from its recorded IP.')
    if not str(value['dns_zone_id']).isdigit() or not str(value['dns_project_id']).isdigit():
        raise Error('Require numeric DNS zone/project identities.')
    for key in ('env_sha256', 'archive_sha256'):
        if not re.fullmatch('[0-9a-f]{64}', value[key]):
            raise Error('Invalid snapshot identity hash.')
    return value


def load(args):
    values = read_values(args.env, fields=frozenset({'STATE_DIRECTORY', 'INITIALIZATION_SNAPSHOT'}))
    directory = Path(values['STATE_DIRECTORY'])
    if Path(values['INITIALIZATION_SNAPSHOT']) != directory / 'snapshot.json':
        raise Error('Snapshot reference must be inside the selected protected state directory.')
    snapshot = read(directory / 'snapshot.json')
    if set(snapshot) != {'schema_version', 'identity', 'archives', 'dns_token_file'} or snapshot['schema_version'] != 1:
        raise Error('Unsupported deletion snapshot.')
    identity(snapshot['identity'])
    if digest(snapshot['archives']) != snapshot['identity']['archive_sha256']:
        raise Error('Initialization snapshot manifest changed.')
    if set(snapshot['archives']) != {'values.env', 'verification.json', 'progress.json', 'result.json'}:
        raise Error('Require exactly the four original initialization archive files.')
    archived = {}
    for name, expected in snapshot['archives'].items():
        if name not in {'values.env', 'verification.json', 'progress.json', 'result.json'}:
            raise Error('Unexpected initialization archive file.')
        archived[name] = private_file(directory / 'initialization' / name).read_bytes()
        if hashlib.sha256(archived[name]).hexdigest() != expected:
            raise Error('Historical initialization archive changed.')
    ctx = load_context(SimpleNamespace(env=directory / 'initialization/values.env'), require_verified=False)
    progress = json.loads(archived['progress.json'], object_pairs_hook=unique)
    if progress != read_state(ctx):
        raise Error('Historical progress changed while loading the deletion snapshot.')
    verification = json.loads(archived['verification.json'], object_pairs_hook=unique)
    historical_result = json.loads(archived['result.json'], object_pairs_hook=unique)
    validate_completion(historical_result, ctx.values, progress,
                        hashlib.sha256(archived['progress.json']).hexdigest())
    value = snapshot['identity']
    values = ctx.values
    expected = {
        'repository': values['REPOSITORY'], 'slug': values['PROJECT_SLUG'], 'org': values['GH_ORG'],
        'maintainer': values['MAINTAINER_LOGIN'], 'operator_ssh': values['OPERATOR_SSH'],
        'operator_ipv4': values['OPERATOR_IPV4'], 'ci_source': values['CI_SOURCE'],
        'dns_zone': values['DNS_ZONE'], 'dns_zone_id': values['DNS_ZONE_ID'], 'dns_project_id': values['DNS_PROJECT_ID'],
        'env_sha256': env_hash(ctx.env_path), 'repository_id': progress.get('repository_id'),
        'source_sha': progress.get('source_sha'),
        'hostnames': {env: values[env.upper() + '_HOSTNAME'] for env in ('staging', 'production')},
        'ports': {env: {component: int(values[env.upper() + '_' + component.upper() + '_PORT']) for component in ('frontend', 'backend')} for env in ('staging', 'production')},
        'workflow_ids': {env: progress.get(env + '_workflow_id') for env in ('staging', 'production')},
    }
    from _github_bootstrap import CI_APP_ID, CI_INSTALLATION_ID
    access = progress.get('ci_app_access_verified', {})
    expected.update(app_id=access.get('app_id', CI_APP_ID), app_installation_id=access.get('installation_id', CI_INSTALLATION_ID))
    if (any(value.get(key) != expected_value for key, expected_value in expected.items())
            or snapshot['dns_token_file'] != values['DNS_TOKEN_FILE']
            or verification.get('env_sha256') != value['env_sha256']
            or verification.get('repository') != value['repository'] or verification.get('scope') != 'full'
            or verification.get('evidence', {}).get('github', {}).get('repository_id') != value['repository_id']
            or historical_result.get('env_sha256') != value['env_sha256']
            or historical_result.get('repository') != value['repository']
            or historical_result.get('observations', {}).get('repository_id') != value['repository_id']):
        raise Error('Deletion identity differs from the original initialization snapshot.')
    return directory, snapshot


def plan(directory, expected):
    result = read(directory / 'plan.json')
    if (set(result) != {'schema_version', 'identity', 'host', 'github', 'dns', 'extras', 'policy', 'tool'}
            or result['schema_version'] != 1 or result['policy'] != 'purge-host-and-github-preserve-local'
            or not isinstance(expected, str) or not re.fullmatch('[0-9a-f]{64}', expected)
            or digest(result) != expected):
        raise Error('Require the exact immutable reviewed deletion plan SHA-256.')
    identity(result['identity'])
    return result


@contextmanager
def locked(directory):
    path = directory / 'operation.lock'
    if path.exists() or path.is_symlink():
        private_file(path)
    fd = os.open(path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    except BlockingIOError:
        raise Error('Another deletion operation holds this context lock.') from None
    finally:
        os.close(fd)


def operation(directory, selected, key, target, execute, verify):
    """Started records reconcile actual state; an absent resource is never re-created."""
    path = directory / 'journal.json'
    journal = read(path) if path.exists() else {'schema_version': 1, 'plan_sha256': digest(selected), 'operations': {}}
    if (set(journal) != {'schema_version', 'plan_sha256', 'operations'} or journal['schema_version'] != 1
            or journal['plan_sha256'] != digest(selected)):
        raise Error('Deletion journal belongs to another plan.')
    previous = journal['operations'].get(key)
    if previous is not None and (set(previous) != {'target', 'predecessor_sha256', 'phase', 'safe_outcome'} or previous.get('target') != target or previous.get('predecessor_sha256') != digest(target) or previous.get('phase') not in {'started', 'verified'}):
        raise Error('Deletion operation identity differs.')
    if previous is None:
        journal['operations'][key] = {'target': target, 'predecessor_sha256': digest(target), 'phase': 'started', 'safe_outcome': 'pending-readback'}
        write(path, journal)
    if not verify():
        if previous is not None and previous['phase'] == 'verified':
            raise Error('A previously deleted resource reappeared; do not adopt it.')
        execute()
        if not verify():
            raise Error('Deletion did not produce verified absence; operation remains started.')
    journal['operations'][key].update(phase='verified', safe_outcome='verified-readback')
    write(path, journal)


def parser(description):
    result = argparse.ArgumentParser(description=description)
    result.add_argument('--env', type=Path, default=ROOT / '.project-deletion/values.env', help='Protected deletion reference file, never the initialization env.')
    result.add_argument('--plan-sha256', help='Exact reviewed plan hash printed by step 2.1.')
    return result
