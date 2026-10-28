"""Bounded initialization-state transport; never copies referenced credentials."""
import base64
import binascii
import json
import os
from pathlib import Path
import shlex
import stat
import sys
import tempfile
from types import SimpleNamespace

from _operations import ci_source, context, execute, observed_sha, positive, ssh_arguments
from _github_bootstrap import ensure_ci_app_access
from _shared import InitError, load_context, parser, private_file, read_state, require_private_location

FILES = {'values.env': 65536, 'verification.json': 65536, 'progress.json': 262144}
MAX_ENVELOPE = 600000
HOST_ROOT = Path('/root')


class ProgressConflict(InitError):
    def __init__(self, fields):
        self.fields = sorted({key if safe_field(key) else '<nonstandard field>' for key in fields})
        if len(self.fields) > 64:
            raise InitError('Too many conflicting progress fields; inspect both protected copies.')
        super().__init__('Progress conflicts in fields: ' + ', '.join(self.fields)
                         + '. Preserve both copies and reconcile them.')


def safe_field(value):
    return isinstance(value, str) and len(value) <= 64 and value.isascii() and value.isidentifier()


def read_private(path, limit):
    path = private_file(path)
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(descriptor, 'rb') as stream:
        before = os.fstat(stream.fileno())
        if (not stat.S_ISREG(before.st_mode) or before.st_uid != os.getuid()
                or stat.S_IMODE(before.st_mode) != 0o600):
            raise InitError('Initialization state changed or lost its protected permissions.')
        data = stream.read(limit + 1)
        after = os.fstat(stream.fileno())
    stable = ('st_dev', 'st_ino', 'st_mode', 'st_uid', 'st_size', 'st_mtime_ns', 'st_ctime_ns')
    if len(data) > limit or any(getattr(before, key) != getattr(after, key) for key in stable):
        raise InitError('Initialization state is oversized or changed during reading.')
    return data


def snapshot(env_path):
    return {name: read_private(env_path if name == 'values.env' else env_path.parent / name, limit)
            for name, limit in FILES.items()}


def exclusive_write(path, data):
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        os.fchmod(stream.fileno(), 0o600)
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())


def validate_bundle(bundle, *, operator=False):
    """Validate the exact received bytes with the existing receipt/state contract."""
    if set(bundle) != set(FILES) or any(not isinstance(data, bytes) or len(data) > FILES[name]
                                      for name, data in bundle.items()):
        raise InitError('Require exactly the three bounded initialization state files.')
    with tempfile.TemporaryDirectory(prefix='initialization-handoff-') as directory:
        stage = Path(directory)
        stage.chmod(0o700)
        for name, data in bundle.items():
            exclusive_write(stage / name, data)
        ctx = load_context(SimpleNamespace(env=stage / 'values.env'), operator=operator)
        if ctx.scope != 'full':
            raise InitError('State transfer requires current full-scope values verification.')
        state = read_state(ctx)
        identity = positive(state.get('repository_id'), 'verified repository ID from step 2.4')
        receipt = json.loads(bundle['verification.json'])
        evidence = receipt.get('evidence')
        github = evidence.get('github') if isinstance(evidence, dict) else None
        if not isinstance(github, dict) or positive(github.get('repository_id'), 'receipt repository ID') != identity:
            raise InitError('Progress repository ID differs from the full verification evidence.')
        return ctx, state


def encode(bundle):
    return json.dumps({'schema': 1, 'files': {
        name: base64.b64encode(data).decode('ascii') for name, data in bundle.items()}})


def _unique(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise InitError('Duplicate initialization transfer fields are forbidden.')
        result[key] = value
    return result


def decode(text):
    try:
        if len(text) > MAX_ENVELOPE:
            raise ValueError()
        envelope = json.loads(text, object_pairs_hook=_unique)
        if (not isinstance(envelope, dict) or set(envelope) != {'schema', 'files'}
                or type(envelope['schema']) is not int or envelope['schema'] != 1
                or not isinstance(envelope['files'], dict) or set(envelope['files']) != set(FILES)):
            raise ValueError()
        bundle = {name: base64.b64decode(data, validate=True)
                  for name, data in envelope['files'].items()}
        if any(len(data) > FILES[name] for name, data in bundle.items()):
            raise ValueError()
        return bundle
    except (ValueError, TypeError, binascii.Error):
        raise InitError('Invalid or oversized initialization transfer envelope.') from None


def destination(ctx):
    path = HOST_ROOT / (ctx.values['PROJECT_SLUG'] + '-initialization')
    require_private_location(path / 'values.env')
    for ancestor in path.parents:
        info = ancestor.lstat()
        if ancestor.is_symlink() or info.st_uid != 0 or info.st_mode & 0o022:
            raise InitError('Initialization destination ancestors must remain root-controlled.')
    return path


def receive(bundle):
    ctx, _ = validate_bundle(bundle, operator=True)
    ci_source(ctx)
    path = destination(ctx)
    if path.exists() or path.is_symlink():
        # Never repair modes, adopt partial state, or replace earlier observations.
        if snapshot(path / 'values.env') != bundle:
            raise InitError('Host initialization state differs; preserve and reconcile it before retrying.')
        return path
    path.mkdir(mode=0o700)
    path.chmod(0o700)
    try:
        for name, data in bundle.items():
            exclusive_write(path / name, data)
    except OSError:
        raise InitError('Upload was incomplete; preserve the new host directory and reconcile before retrying.') from None
    return path


def return_bundle(expected):
    ctx, state = validate_bundle(expected, operator=True)
    ci_source(ctx)
    actual = snapshot(destination(ctx) / 'values.env')
    _, observed = validate_bundle(actual, operator=True)
    check_return(expected, state, actual, observed)
    return actual


def check_return(expected, state, actual, observed):
    if any(actual[name] != expected[name] for name in ('values.env', 'verification.json')):
        raise InitError('Host values or verification differ; local progress was not changed.')
    if any(key not in observed or json.dumps(observed[key], sort_keys=True) != json.dumps(value, sort_keys=True)
           for key, value in state.items()):
        raise InitError('Host progress conflicts with workstation observations; reconcile both copies.')


def release_state(ctx, state):
    """Require the exact workstation observations consumed by release setup."""
    sha = observed_sha(state.get('source_sha'))
    if state.get('release_branch') != ctx.values['RELEASE_BRANCH']:
        raise InitError('Release branch observation must match verified RELEASE_BRANCH; complete step 12.3.')
    for environment in ('staging', 'production'):
        positive(state.get(environment + '_workflow_id'), environment + ' workflow ID from step 14.1')
    return sha


def equal_json(left, right):
    # JSON's bool/int distinction must survive Python's True == 1 behavior.
    return json.dumps(left, sort_keys=True, allow_nan=False) == json.dumps(right, sort_keys=True, allow_nan=False)


def merge_progress(expected, state, actual, observed):
    if any(actual[name] != expected[name] for name in ('values.env', 'verification.json')):
        raise InitError('Host values or verification differ; preserve both copies and reconcile them.')
    conflicts = sorted(key for key in state.keys() & observed.keys()
                       if not equal_json(state[key], observed[key]))
    if conflicts:
        # Only field names are diagnostics: private observations may hold secrets.
        raise ProgressConflict(conflicts)
    merged = {**observed, **state}
    result = dict(actual)
    if not equal_json(merged, observed):
        result['progress.json'] = (json.dumps(merged, indent=2, sort_keys=True, allow_nan=False) + '\n').encode()
    return result


def sync_private_directory(path):
    descriptor = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        info = os.fstat(descriptor)
        if (not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid()
                or stat.S_IMODE(info.st_mode) != 0o700):
            raise InitError('Backup directories must remain owned and private (0700).')
        os.fsync(descriptor)
    finally:
        os.close(descriptor)

def replace_progress(env_path, original, actual, *, backup=False):
    """Replace only progress, after durable private backups and a final snapshot CAS."""
    if snapshot(env_path) != original:
        raise InitError('Initialization state changed during transfer; progress was not replaced.')
    if original['progress.json'] == actual['progress.json']:
        # Also finish durability after a previous replacement lost its acknowledgement.
        sync_private_directory(env_path.parent)
        return
    if backup:
        directory = Path(tempfile.mkdtemp(prefix='.release-context-backup-', dir=env_path.parent))
        directory.chmod(0o700)
        for name, data in original.items():
            exclusive_write(directory / name, data)
        # Retain both the backup's entries and its link before replacing evidence.
        sync_private_directory(directory)
        sync_private_directory(env_path.parent)
    target = env_path.parent / 'progress.json'
    descriptor, temporary = tempfile.mkstemp(prefix='.progress.json.', dir=target.parent)
    try:
        with os.fdopen(descriptor, 'wb') as stream:
            os.fchmod(stream.fileno(), 0o600)
            stream.write(actual['progress.json'])
            stream.flush()
            os.fsync(stream.fileno())
        private_file(target)
        if snapshot(env_path) != original:
            raise InitError('Initialization state changed during transfer; progress was not replaced.')
        os.replace(temporary, target)
        try:
            sync_private_directory(target.parent)
        except (OSError, InitError):
            raise InitError('Progress was replaced but its directory durability is uncertain; '
                            'preserve both copies and rerun the transfer to reconcile.') from None
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def reconcile_release(expected):
    """Canonical receiver: retain all compatible observations from both contexts."""
    ctx, state = validate_bundle(expected, operator=True)
    release_state(ctx, state)
    ci_source(ctx)
    env_path = destination(ctx) / 'values.env'
    original = snapshot(env_path)
    _, observed = validate_bundle(original, operator=True)
    actual = merge_progress(expected, state, original, observed)
    merged_ctx, merged = validate_bundle(actual, operator=True)
    release_state(merged_ctx, merged)
    replace_progress(env_path, original, actual, backup=True)
    return actual


def remote_main(action):
    """Called only through canonical root-controlled host code, with captured I/O."""
    try:
        if action not in ('upload', 'return', 'reconcile-release'):
            raise InitError('Unknown initialization transfer action.')
        bundle = decode(sys.stdin.read(MAX_ENVELOPE + 1))
        if action == 'upload':
            receive(bundle)
            print('Initialization state accepted.')
        elif action == 'return':
            print(encode(return_bundle(bundle)))
        else:
            print(encode(reconcile_release(bundle)))
    except ProgressConflict as error:
        if action == 'reconcile-release':
            print(json.dumps({'schema': 1, 'error': 'progress_conflict', 'fields': error.fields}))
        else:
            raise SystemExit(1) from None
    except Exception:
        # No raw exception, input, path contents, or subprocess diagnostics to SSH.
        print('Initialization state transfer rejected; preserve both copies and inspect protected inputs and canonical source.', file=sys.stderr)
        raise SystemExit(1) from None


def remote_arguments(ctx, action):
    # Run reviewed code from CI_SOURCE, never a receiver supplied in the bundle.
    # Admission checks precede imports because source itself executes as root.
    bootstrap = '''import os, stat, sys
from pathlib import Path
source = Path(sys.argv[1])
scripts = source / 'docs/template-initialization/scripts'
try:
    paths = [source, *source.parents, scripts, *scripts.parents,
             *(scripts / name for name in ('_handoff.py', '_shared.py', '_operations.py'))]
    for path in paths:
        info = path.lstat()
        if path.is_symlink() or info.st_uid != 0 or info.st_mode & 0o022:
            raise ValueError()
    sys.path.insert(0, str(scripts))
    from _handoff import remote_main
except Exception:
    sys.stderr.write('Require the latest reviewed root-controlled canonical initialization source.\\n')
    raise SystemExit(1) from None
remote_main(sys.argv[2])
'''
    return ssh_arguments(ctx, ['python3', '-I', '-B', '-c', bootstrap, ctx.values['CI_SOURCE'], action])


def release_response(text):
    """Admit only bounded conflict field names; never forward host diagnostics."""
    if len(text) > MAX_ENVELOPE:
        raise InitError('Invalid or oversized initialization transfer envelope.')
    try:
        response = json.loads(text, object_pairs_hook=_unique)
    except (ValueError, TypeError):
        raise InitError('Invalid initialization release response.') from None
    if isinstance(response, dict) and 'error' in response:
        fields = response.get('fields')
        if (set(response) != {'schema', 'error', 'fields'}
                or type(response['schema']) is not int or response['schema'] != 1
                or response['error'] != 'progress_conflict'
                or not isinstance(fields, list) or not 1 <= len(fields) <= 64
                or any(not safe_field(field) and field != '<nonstandard field>' for field in fields)):
            raise InitError('Invalid initialization release conflict response.')
        raise ProgressConflict(fields)
    return decode(text)


def transfer(args):
    ctx = context(args, consumer=True)
    original = snapshot(ctx.env_path)
    snapshot_ctx, state = validate_bundle(original)
    if snapshot_ctx.values != ctx.values:
        raise InitError('Workstation values changed during validation; state was not transferred.')
    release_context = getattr(args, 'release_context', False)
    if release_context:
        release_state(ctx, state)
    if not args.return_progress and not release_context:
        ensure_ci_app_access(ctx)
        original = snapshot(ctx.env_path)
        snapshot_ctx, state = validate_bundle(original)
        if snapshot_ctx.values != ctx.values:
            raise InitError('Workstation values changed during App verification; state was not transferred.')
    if args.return_progress or release_context:
        action = 'reconcile-release' if release_context else 'return'
        response = execute(remote_arguments(ctx, action), input=encode(original))
        actual = release_response(response) if release_context else decode(response)
        actual_ctx, observed = validate_bundle(actual)
        check_return(original, state, actual, observed)
        if release_context:
            sha = release_state(actual_ctx, observed)
        replace_progress(ctx.env_path, original, actual, backup=release_context)
        if release_context:
            print('Reconciled release observations on both contexts; original changed copies have private backups.')
            print('On the operator host, run:')
            script = Path(ctx.values['CI_SOURCE']) / 'docs/template-initialization/scripts/14_2_prepare_release_source.py'
            path = '/root/' + ctx.values['PROJECT_SLUG'] + '-initialization/values.env'
            print(shlex.join(['python3', '-B', str(script), '--env', path, '--source-sha', sha]))
        else:
            print('Returned host progress to the workstation; values and verification bytes are unchanged.')
    else:
        execute(remote_arguments(ctx, 'upload'), input=encode(original))
        path = '/root/' + ctx.values['PROJECT_SLUG'] + '-initialization/values.env'
        print('Uploaded the three protected initialization files. On the operator host, run:')
        scripts = Path(ctx.values['CI_SOURCE']) / 'docs/template-initialization/scripts'
        commands = (
            ('11_2_prepare_registration.py', []),
            ('11_3_stop_and_inspect_ci.py', []),
            ('11_4_register_and_validate_ci.py', []),
            ('11_5_activate_ci.py', ['--reviewed']),
        )
        print('Run one guide step at a time; step 11.3 records the configuration hash used automatically by step 11.4.')
        for name, extra in commands:
            print(shlex.join(['python3', '-B', str(scripts / name), '--env', path, *extra]))


def cli():
    arguments = parser('Transfer this consumer initialization state to the operator host, or return its updated progress.')
    modes = arguments.add_mutually_exclusive_group()
    modes.add_argument('--release-context', action='store_true',
                       help='Reconcile release observations for step 14.A, preserving private backups and both contexts.')
    modes.add_argument('--return-progress', action='store_true',
                       help='Return only updated progress after section 11; preserve local values and verification.')
    args = arguments.parse_args()
    try:
        transfer(args)
    except Exception as error:
        message = str(error) if isinstance(error, InitError) else 'State transfer failed; preserve both copies and inspect before retrying.'
        print('Initialization stopped: ' + message, file=sys.stderr)
        raise SystemExit(1) from None
