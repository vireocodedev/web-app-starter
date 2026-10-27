#!/usr/bin/env python3
"""Record nonsecret observations without inferring unobserved setup acceptance."""
import json
import os
import tempfile
from pathlib import Path

from _shared import InitError, env_hash, load_context, parser, read_state, require_consumer


OBSERVATIONS = (
    'repository_id', 'staging_workflow_id', 'production_workflow_id',
    'source_sha', 'release_source_sha', 'staging_run_id', 'staging_run_attempt',
    'staging_source_sha', 'staging_pair', 'production_run_id',
    'production_run_attempt', 'production_source_sha', 'backup_remote_dump',
    'retrieved_backup_sha256', 'restored_backup_sha256', 'retrieved_copy_restored',
)


def record(ctx):
    require_consumer(ctx)
    state = read_state(ctx)
    report = {
        'repository': ctx.values['REPOSITORY'],
        'env_sha256': env_hash(ctx.env_path),
        'scope': ctx.scope,
        'observations': {key: state[key] for key in OBSERVATIONS if key in state},
        'manual_acceptance': 'Record actual local/IDE/HTTPS/account/recovery observations and remaining limits in INIT_GUIDE.md.',
        'scheduled_backup': 'A future scheduled execution remains pending until observed.',
    }
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
    print(f'Wrote private observations to {target}. Complete the guide checklist using actual evidence.')


if __name__ == '__main__':
    command = parser(__doc__)
    args = command.parse_args()
    try:
        record(load_context(args))
    except (InitError, OSError, ValueError) as error:
        message = str(error) if isinstance(error, InitError) else 'Could not record private setup observations.'
        command.exit(1, message + '\n')
