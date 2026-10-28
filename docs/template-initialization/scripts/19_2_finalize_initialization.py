#!/usr/bin/env python3
"""Validate explicit full initialization acceptance and record strict completion."""
import importlib.util
import json
import os
from pathlib import Path

from _shared import InitError, load_context, parser, private_file, read_state, require_consumer
from _completion import digest, image_pair, positive


def prepare_acceptance(ctx):
    """Create only an exclusive private template, with no success assertions."""
    require_consumer(ctx)
    private_file(ctx.env_path)
    if ctx.scope != 'full':
        raise InitError('Full initialization scope is required for acceptance preparation.')
    progress = read_state(ctx)
    required = ('source_sha', 'staging_pair', 'staging_run_id', 'staging_run_attempt',
                'production_run_id', 'production_run_attempt')
    if (any(key not in progress for key in required)
            or not isinstance(progress['staging_pair'], dict) or 'backend' not in progress['staging_pair']):
        raise InitError('Reconcile final release observations before preparing acceptance.')
    if (not digest(progress['source_sha'], 40)
            or any(not positive(progress[key]) for key in required if '_run_' in key)):
        raise InitError('Require exact release source and observed positive run identities.')
    image_pair(progress['staging_pair'], ctx.values['REPOSITORY'], progress['source_sha'])
    acceptance = {
        'schema_version': 1,
        'source_sha': progress['source_sha'],
        'environments': {},
        'manual': {
            name: {'status': 'pending', 'evidence': ''}
            for name in ('local_application', 'ide', 'artwork')
        },
    }
    for environment in ('staging', 'production'):
        acceptance['environments'][environment] = {
            'deployment_receipt': {
                'state': 'unverified', 'environment': environment,
                'run_id': progress[environment + '_run_id'],
                'run_attempt': progress[environment + '_run_attempt'],
                'pair': progress['staging_pair'],
            },
            'provisioning_receipt': {
                'state': 'unverified', 'backend': progress['staging_pair']['backend'],
            },
            'https': {
                'origin': 'https://' + ctx.values[environment.upper() + '_HOSTNAME'],
                'run_id': progress[environment + '_run_id'],
                'run_attempt': progress[environment + '_run_attempt'],
                'observed_at': 'REPLACE_WITH_ACTUAL_ISO8601_TIME_WITH_TIMEZONE',
                'checks': {name: False for name in (
                    'login', 'session_persistence', 'logout',
                    'secure_cookie', 'http_only_cookie', 'fresh_csrf')},
            },
        }
    path = ctx.env_path.parent / 'acceptance.json'
    descriptor = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
        json.dump(acceptance, stream, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())
    directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)
    print(path)


def main():
    arguments = parser(__doc__)
    mode = arguments.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare-acceptance', action='store_true',
                      help='Create an exclusive private unverified acceptance template.')
    mode.add_argument('--acceptance-file', type=Path,
                      help='Absolute protected nonsecret acceptance JSON to finalize.')
    args = arguments.parse_args()
    context = load_context(args)
    if args.prepare_acceptance:
        prepare_acceptance(context)
        return
    path = Path(__file__).with_name('19_1_record_result.py')
    spec = importlib.util.spec_from_file_location('initialization_record_result', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.record(context, complete=True, acceptance_file=args.acceptance_file)


if __name__ == '__main__':
    try:
        main()
    except (InitError, OSError, ValueError) as error:
        message = str(error) if isinstance(error, InitError) else 'Could not record private setup completion.'
        raise SystemExit(message) from None
