#!/usr/bin/env python3
"""Explicit operator install; never called by a workflow or the controller."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import sys

from controller import TRUSTED, protected, write_json
from protocol import ReleaseError, command, repository
from runtime import POSTGRES, validate


def install(args):
    if os.geteuid() != 0:
        raise ReleaseError('root-required')
    os.umask(0o077)
    repo = repository(args.repository)
    source = Path(__file__).resolve().parents[2]
    # A protected, clean committed checkout is the installation source.
    for ancestor in (source, *source.parents):
        info = ancestor.lstat()
        if info.st_uid != 0 or info.st_mode & 0o022:
            raise ReleaseError('installation-source-not-root-controlled')
    sha = command('git', '-C', str(source), 'rev-parse', 'HEAD').decode().strip()
    if command('git', '-C', str(source), 'status', '--porcelain').strip():
        raise ReleaseError('installation-source-dirty')
    base = Path('/etc/web-app-deploy')
    state_base = Path('/var/lib/web-app-deploy')
    code_base = Path('/usr/local/lib/web-app-deploy')
    for path in (base, state_base, code_base):
        if path.exists():
            protected(path, directory=True)
        else:
            path.mkdir(mode=0o700)
    settings = base / args.slug
    state = state_base / args.slug
    code = code_base / args.slug
    if any(path.exists() for path in (settings, state, code)):
        raise ReleaseError('existing-installation-requires-explicit-migration')
    for path in (settings, state, code):
        path.mkdir(mode=0o700)
    for name in ('requests', 'receipts'):
        (state / name).mkdir(mode=0o700)
    runtime = {'slug': args.slug, 'repository': repo, 'state': str(state), 'settings': str(settings),
               'environments': {
                   'staging': {'hostname': args.staging_hostname, 'frontend_port': args.staging_frontend_port,
                               'backend_port': args.staging_backend_port},
                   'production': {'hostname': args.production_hostname, 'frontend_port': args.production_frontend_port,
                                  'backend_port': args.production_backend_port}}}
    validate(runtime)
    protected(args.app_settings)
    protected(args.app_key)
    runtime_path = settings / 'runtime.json'
    write_json(runtime_path, runtime)
    private_key = settings / 'controller.key'
    certificate = settings / 'controller.crt'
    command('openssl', 'req', '-x509', '-newkey', 'rsa:4096', '-sha256', '-nodes', '-days', '825',
            '-subj', '/CN=web-app-deploy-' + args.slug, '-keyout', str(private_key), '-out', str(certificate))
    for filename in ('controller.py', 'runtime.py', 'protocol.py'):
        shutil.copyfile(source / 'infrastructure/release' / filename, code / filename)
    shutil.copyfile(source / 'infrastructure/ci/ci-runner/github_app.py', code / 'github_app.py')
    config = {'repository': repo, 'repository_id': args.repository_id, 'actors': args.actor,
              'workflow_ids': {'staging': args.staging_workflow_id, 'production': args.production_workflow_id},
              'trusted_sha256': {name: hashlib.sha256((source / name).read_bytes()).hexdigest() for name in TRUSTED},
              'state': str(state), 'cms_key': str(private_key), 'app_settings': args.app_settings,
              'app_key': args.app_key, 'runtime_config': str(runtime_path)}
    write_json(settings / 'controller.json', config)
    write_json(settings / 'installation.json', {'source_sha': sha, 'files': {
        path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in code.iterdir()}})
    for environment in ('staging', 'production'):
        (settings / environment).mkdir(mode=0o700)
        (state / environment).mkdir(mode=0o700)
        (state / environment / 'releases').mkdir(mode=0o700)
        if environment == 'production':
            (state / environment / 'backups').mkdir(mode=0o700)
        password = secrets.token_hex(32)
        (settings / environment / 'database.env').write_text(
            'POSTGRES_USER=app\nPOSTGRES_DB=app\nPOSTGRES_PASSWORD=' + password + '\n'
            'DATABASE_USERNAME=app\nDATABASE_PASSWORD=' + password + '\n'
            'DATABASE_URL=jdbc:postgresql://postgres:5432/app\n')
        (settings / environment / 'provision-user.env').write_text(
            'PROVISION_USER_USERNAME=' + args.username + '\nPROVISION_USER_DISPLAY_NAME=' + args.display_name
            + '\nPROVISION_USER_EMAIL=' + args.email + '\nPROVISION_USER_PASSWORD=' + secrets.token_hex(24) + '\n')
        network = args.slug + '-' + environment + '-db'
        volume = args.slug + '-' + environment + '-postgres'
        compose = {'services': {'postgres': {
            'image': POSTGRES, 'container_name': volume, 'user': '999:999', 'read_only': True,
            'cap_drop': ['ALL'], 'security_opt': ['no-new-privileges:true'], 'restart': 'unless-stopped',
            'mem_limit': '512m', 'pids_limit': 256,
            'env_file': [str(settings / environment / 'database.env')],
            'tmpfs': ['/tmp:rw,size=32m,mode=1777', '/var/run/postgresql:rw,size=16m,uid=999,gid=999,mode=0700'],
            'volumes': [volume + ':/var/lib/postgresql'], 'networks': {'default': {'aliases': ['postgres']}},
            'healthcheck': {'test': ['CMD', 'pg_isready', '-U', 'app', '-d', 'app'], 'interval': '5s',
                            'timeout': '3s', 'retries': 12, 'start_period': '30s'}}},
            'volumes': {volume: {'external': True, 'name': volume}},
            'networks': {'default': {'external': True, 'name': network}}}
        write_json(settings / environment / 'database.compose.json', compose)
    unit = (
        '[Unit]\nDescription=Validated whole-app deployment controller\nAfter=network-online.target docker.service\n'
        'Wants=network-online.target\nRequires=docker.service\n\n[Service]\nType=simple\nUser=root\nUMask=0077\n'
        f'ExecStart=/usr/bin/python3 -B {code}/controller.py --config {settings}/controller.json\n'
        'Restart=on-failure\nRestartSec=15\nNoNewPrivileges=true\nPrivateTmp=true\n'
        'ProtectSystem=strict\nProtectHome=true\n'
        f'ReadWritePaths={state}\nMemoryMax=256M\nTasksMax=128\n\n[Install]\nWantedBy=multi-user.target\n')
    Path(f'/etc/systemd/system/web-app-deploy-{args.slug}.service').write_text(unit)
    backup_unit = ('[Unit]\nDescription=Verified production PostgreSQL backup\nRequires=docker.service\n'
                   'After=docker.service\n\n[Service]\nType=oneshot\nUser=root\nUMask=0077\n'
                   f'ExecStart=/usr/bin/python3 -B {code}/runtime.py backup --config {runtime_path}\n'
                   'NoNewPrivileges=true\nPrivateTmp=true\nProtectSystem=strict\nProtectHome=true\n'
                   f'ReadWritePaths={state}\nMemoryMax=256M\nTasksMax=128\n')
    Path(f'/etc/systemd/system/web-app-backup-{args.slug}.service').write_text(backup_unit)
    Path(f'/etc/systemd/system/web-app-backup-{args.slug}.timer').write_text(
        '[Unit]\nDescription=Daily production backup, 03:00 Europe/Zagreb\n\n[Timer]\n'
        f'OnCalendar=*-*-* 03:00:00 Europe/Zagreb\nPersistent=true\nUnit=web-app-backup-{args.slug}.service\n\n'
        '[Install]\nWantedBy=timers.target\n')
    # Units are installed disabled. No Docker, proxy, timer, or controller activation here.
    command('systemctl', 'daemon-reload')
    print('Installed disabled deployment source ' + sha)
    print('Publish only the public certificate from ' + str(certificate) + ' as DEPLOY_CONTROLLER_CERT.')
    print('Provision database resources and Caddy routes, review/validate, then explicitly activate.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repository', required=True)
    parser.add_argument('--repository-id', type=int, required=True)
    parser.add_argument('--slug', required=True)
    parser.add_argument('--actor', action='append', required=True)
    parser.add_argument('--staging-workflow-id', type=int, required=True)
    parser.add_argument('--production-workflow-id', type=int, required=True)
    parser.add_argument('--staging-hostname', required=True)
    parser.add_argument('--production-hostname', required=True)
    parser.add_argument('--staging-frontend-port', type=int, required=True)
    parser.add_argument('--staging-backend-port', type=int, required=True)
    parser.add_argument('--production-frontend-port', type=int, required=True)
    parser.add_argument('--production-backend-port', type=int, required=True)
    parser.add_argument('--app-settings', default='/etc/web-app-ci/github-app.json')
    parser.add_argument('--app-key', default='/etc/web-app-ci/github-app.pem')
    parser.add_argument('--username', required=True)
    parser.add_argument('--display-name', required=True)
    parser.add_argument('--email', required=True)
    args = parser.parse_args()
    try:
        if (not re.fullmatch('[a-z][a-z0-9-]{2,39}', args.slug)
                or not re.fullmatch('[a-zA-Z0-9_.-]{1,100}', args.username)
                or any('\n' in value or '\r' in value or not value.strip()
                       for value in (args.display_name, args.email))
                or not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', args.email)):
            raise ReleaseError('installation-identity-invalid')
        install(args)
    except ReleaseError as error:
        print('Install stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
