#!/usr/bin/env python3
"""Record nonsecret observations without inferring unobserved setup acceptance."""
import hashlib
import json
import os
import tempfile
from pathlib import Path

from _shared import InitError, env_hash, load_context, parser, private_file, read_state, require_consumer
from _completion import build_completion, read_acceptance, unique, validate_completion


OBSERVATIONS = (
    'repository_id', 'staging_workflow_id', 'production_workflow_id',
    'source_sha', 'release_source_sha', 'staging_run_id', 'staging_run_attempt',
    'staging_source_sha', 'staging_pair', 'production_run_id',
    'production_run_attempt', 'production_source_sha', 'backup_remote_dump',
    'retrieved_backup_sha256', 'restored_backup_sha256', 'retrieved_copy_restored', 'backup_schedule',
)


def record(ctx, *, complete=False, acceptance_file=None):
    require_consumer(ctx)
    state = read_state(ctx)
    if bool(acceptance_file) != complete:
        raise InitError('Use --complete and --acceptance-file together; plain reporting remains partial.')
    progress_bytes = None
    if complete:
        progress_bytes = private_file(ctx.env_path.parent / 'progress.json').read_bytes()
        try:
            require_state = json.loads(progress_bytes, object_pairs_hook=unique)
        except (ValueError, UnicodeError):
            raise InitError('Invalid protected progress JSON.') from None
        if require_state != state:
            raise InitError('Progress changed while recording completion; reconcile and retry.')
    report = {
        'repository': ctx.values['REPOSITORY'],
        'env_sha256': env_hash(ctx.env_path),
        'scope': ctx.scope,
        'observations': {key: state[key] for key in OBSERVATIONS if key in state},
        'manual_acceptance': 'Record actual local/IDE/HTTPS/account/recovery observations and remaining limits in INIT_GUIDE.md.',
        'scheduled_backup': 'A future scheduled execution remains pending until observed.',
    }
    if complete:
        report['completion'] = build_completion(read_acceptance(acceptance_file), ctx.values, state,
                                                hashlib.sha256(progress_bytes).hexdigest())
        validate_completion(report, ctx.values, state, hashlib.sha256(progress_bytes).hexdigest())
        if private_file(ctx.env_path.parent / 'progress.json').read_bytes() != progress_bytes:
            raise InitError('Progress changed while recording completion; reconcile and retry.')
    target = ctx.env_path.parent / 'result.json'
    if target.is_symlink():
        raise InitError('Result path is a symlink; inspect it before continuing.')
    descriptor, temporary = tempfile.mkstemp(prefix='.result-', dir=target.parent)
    try:
        with os.fdopen(descriptor, 'w') as stream:
            json.dump(report, stream, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, target)
    finally:
        Path(temporary).unlink(missing_ok=True)
    print(f'Wrote private {"validated completion" if complete else "observations"} to {target}.')


if __name__ == '__main__':
    command = parser(__doc__)
    command.add_argument('--complete', action='store_true', help='Validate explicit full initialization acceptance.')
    command.add_argument('--acceptance-file', type=Path, help='Absolute protected nonsecret acceptance JSON.')
    args = command.parse_args()
    try:
        record(load_context(args), complete=args.complete, acceptance_file=args.acceptance_file)
    except (InitError, OSError, ValueError) as error:
        message = str(error) if isinstance(error, InitError) else 'Could not record private setup observations.'
        command.exit(1, message + '\n')
