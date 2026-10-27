#!/usr/bin/env python3
"""Restore only the verified retrieved copy into a bounded isolated scratch database."""
from pathlib import Path
from _shared import InitError, load_context, parser, read_state, update_state


def restore(recovery_directory):
    import hashlib, json, os, secrets, stat, subprocess, sys, time, uuid
    from pathlib import Path
    if os.geteuid() != 0:
        raise SystemExit('Use the authorized root shell on the recovery host.')
    os.umask(0o077)
    root = Path(recovery_directory)
    for path in (root, root / 'production.dump', root / 'production.dump.json'):
        info = path.lstat()
        if path.is_symlink() or info.st_uid != 0 or stat.S_IMODE(info.st_mode) & 0o077:
            raise SystemExit('Require root-only recovery files/directory.')
    archive = root / 'production.dump'
    meta = json.loads((root / 'production.dump.json').read_text())
    with archive.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if not (meta['initialized'] is True and meta['users'] > 0
            and archive.stat().st_size == meta['bytes'] and digest == meta['sha256']):
        raise SystemExit('Retrieved initialized backup validation failed.')
    name = 'restore-' + uuid.uuid4().hex[:16]
    label = 'hr.vireocode.recovery=' + name
    env, intent = root / (name + '.env'), root / (name + '.json')
    with env.open('x') as stream:
        stream.write('POSTGRES_USER=restore\nPOSTGRES_DB=restore\nPOSTGRES_PASSWORD=' + secrets.token_hex(24) + '\n')
    with intent.open('x') as stream:
        json.dump({'name': name, 'label': label, 'state': 'started', 'backup_sha256': digest}, stream)
    def run(*args, input_file=None, timeout=120):
        result = subprocess.run(args, stdin=input_file, capture_output=True, timeout=timeout)
        if result.returncode:
            raise RuntimeError('Recovery command failed; inspect exact task privately.')
        return result.stdout.decode().strip()
    try:
        run('docker', 'create', '--name', name, '--label', label,
            '--network', 'none', '--user', '999:999', '--read-only',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
            '--memory', '512m', '--pids-limit', '256', '--env-file', str(env),
            '--tmpfs', '/var/lib/postgresql:rw,size=256m,uid=999,gid=999,mode=0700',
            '--tmpfs', '/var/run/postgresql:rw,size=16m,uid=999,gid=999,mode=0700',
            '--tmpfs', '/tmp:rw,size=32m,mode=1777',
            'postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c')
        run('docker', 'start', name)
        for attempt in range(60):
            probe = subprocess.run(['docker', 'exec', name, 'pg_isready', '-U', 'restore', '-d', 'restore'],
                                   capture_output=True, timeout=5)
            if probe.returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError('Scratch readiness timed out.')
        with archive.open('rb') as stream:
            run('docker', 'exec', '-i', name, 'pg_restore', '-U', 'restore', '-d', 'restore',
                '--exit-on-error', '--no-owner', '--no-privileges', input_file=stream)
        def scalar(query):
            return run('docker', 'exec', name, 'psql', '-U', 'restore', '-d', 'restore',
                       '--no-psqlrc', '--set', 'ON_ERROR_STOP=1', '-tA', '-c', query)
        if int(scalar('SELECT count(*) FROM app_user')) != meta['users']:
            raise RuntimeError('Restored user count mismatch.')
        if int(scalar("SELECT count(*) FROM app_user WHERE enabled AND password_hash LIKE '$2%' AND length(password_hash) = 60")) < 1:
            raise RuntimeError('Expected enabled BCrypt account missing.')
        if int(scalar('SELECT count(*) FROM flyway_schema_history WHERE success')) < 2:
            raise RuntimeError('Expected successful migrations missing.')
        if scalar('SELECT count(*) FROM flyway_schema_history WHERE NOT success') != '0':
            raise RuntimeError('Failed migration present.')
        scalar('SELECT count(*) FROM spring_session')
        scalar('SELECT count(*) FROM spring_session_attributes')
        observed = run('docker', 'inspect', '--format',
                       '{{index .Config.Labels "hr.vireocode.recovery"}}', name)
        if observed != name:
            raise RuntimeError('Scratch ownership mismatch.')
        run('docker', 'rm', '--force', name)
        env.unlink()
        intent.write_text(json.dumps({'name': name, 'state': 'success', 'backup_sha256': digest,
                                     'users': meta['users'], 'retrieved_copy_restored': True}))
    except Exception:
        raise SystemExit('Stopped. Preserve intent; inspect exact labeled scratch container before cleanup/retry.')
    print('Retrieved-copy restore passed: users, BCrypt account, migrations and session tables.')
    return digest


def main():
    arguments = parser('Rehearse the retrieved initialized backup on the supported recovery host.')
    arguments.add_argument('--recovery-directory', type=Path,
                           help='New root-only directory holding the retrieved dump and metadata.')
    args = arguments.parse_args()
    context = load_context(args, operator=True)
    if context.scope != 'full':
        raise InitError('Recovery acceptance requires verified full initialization scope.')
    directory = args.recovery_directory or Path('/root/recovery-' + context.values['PROJECT_SLUG'] + '-initial')
    from _operations import verify_backup
    if verify_backup(directory) != read_state(context).get('retrieved_backup_sha256'):
        raise InitError('Require the exact retrieved-copy checksum recorded on the workstation.')
    digest = restore(directory)
    update_state(context, restored_backup_sha256=digest, retrieved_copy_restored=True)


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        raise SystemExit(str(error)) from None
