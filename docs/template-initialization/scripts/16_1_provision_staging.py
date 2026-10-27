#!/usr/bin/env python3
"""Provision the active staging digest, preserving one lock and durable intent."""
from _shared import InitError, load_context, parser


def provision(slug, environment):
    import os, re, sys, uuid
    from pathlib import Path
    if os.geteuid() != 0:
        raise SystemExit('Use the authorized root operator shell.')
    os.umask(0o077)
    if not re.fullmatch(r'[a-z][a-z0-9-]{2,39}', slug) or environment not in ('staging', 'production'):
        raise SystemExit('Invalid project/environment.')
    code = Path('/usr/local/lib/web-app-deploy') / slug
    for path in (code, *code.parents, *(code / name for name in
                  ('runtime.py', 'controller.py', 'protocol.py', 'github_app.py'))):
        info = path.lstat()
        if path.is_symlink() or info.st_uid != 0 or info.st_mode & 0o022:
            raise SystemExit('Installed source must be root-controlled.')
    sys.path.insert(0, str(code))
    from runtime import validate, locked, backup, verify_running
    from controller import protected, write_json
    from protocol import decode, command
    config = validate(decode(protected(f'/etc/web-app-deploy/{slug}/runtime.json').read_bytes()))
    with locked(config, environment) as root:
        for previous in root.glob('provision-*.json'):
            if decode(protected(previous).read_bytes()).get('state') != 'success':
                raise SystemExit('Inspect previous provisioning intent before retrying.')
        active = decode(protected(root / 'active.json').read_bytes())
        if active['state'] != 'success':
            raise SystemExit('Require a successful active deployment.')
        transaction = decode(protected(root / 'transaction.json').read_bytes())
        if transaction['state'] != 'success':
            raise SystemExit('Reconcile the unfinished deployment transaction first.')
        verify_running(config, environment, Path(active['snapshot']), active['pair'])
        if environment == 'production':
            backup(config, environment, root)  # Already holding the one environment lock.
        credentials = Path(config['settings']) / environment
        for name in ('database.env', 'provision-user.env'):
            protected(credentials / name)
        identifier = uuid.uuid4().hex[:12]
        intent = root / f'provision-{identifier}.json'
        record = {'state': 'started', 'backend': active['pair']['backend'],
                  'containers': [f'{slug}-{environment}-provision-{identifier}-{n}' for n in (1, 2)],
                  'label': f'{slug}-{environment}-{identifier}'}
        write_json(intent, record)
        try:
            for name in record['containers']:
                command('docker', 'create', '--name', name,
                        '--label', 'hr.vireocode.initialization=' + record['label'],
                        '--network', f'{slug}-{environment}-db', '--read-only',
                        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
                        '--memory', '512m', '--pids-limit', '256',
                        '--tmpfs', '/tmp:rw,size=64m,mode=1777',
                        '--env-file', str(credentials / 'database.env'),
                        '--env-file', str(credentials / 'provision-user.env'),
                        active['pair']['backend'], '--provision-user')
                command('docker', 'start', '--attach', name, timeout=180)
                observed = decode(command('docker', 'inspect', '--format',
                    '{"running":{{json .State.Running}},"exit":{{json .State.ExitCode}},'
                    '"label":{{json (index .Config.Labels "hr.vireocode.initialization")}}}', name))
                if observed != {'running': False, 'exit': 0, 'label': record['label']}:
                    raise RuntimeError('Outcome/ownership needs inspection.')
                command('docker', 'rm', name)
            verify_running(config, environment, Path(active['snapshot']), active['pair'])
            record['state'] = 'success'
            write_json(intent, record)
        except Exception:
            raise SystemExit('Stopped. Preserve intent; inspect exact owned containers before retrying.')
    print('Provisioning and matching repeat passed; verify HTTPS login next.')


def main():
    arguments = parser('Provision staging from its active deployed backend digest.')
    args = arguments.parse_args()
    context = load_context(args, operator=True)
    if context.scope != 'full':
        raise InitError('Account provisioning requires verified full initialization scope.')
    provision(context.values['PROJECT_SLUG'], 'staging')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        raise SystemExit(str(error)) from None
