"""Fixed host Docker operations; no application-supplied Compose or shell."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

from controller import protected, write_json
from protocol import ReleaseError, command, decode, pair, private_packages, repository

POSTGRES = 'postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c'


def validate(config):
    if type(config) is not dict or set(config) != {'slug', 'repository', 'state', 'settings', 'environments'}:
        raise ReleaseError('runtime-config-fields')
    if not re.fullmatch('[a-z][a-z0-9-]{2,39}', config['slug']):
        raise ReleaseError('runtime-slug-invalid')
    repository(config['repository'])
    if config['state'] != '/var/lib/web-app-deploy/' + config['slug']:
        raise ReleaseError('runtime-state-path-invalid')
    if config['settings'] != '/etc/web-app-deploy/' + config['slug']:
        raise ReleaseError('runtime-settings-path-invalid')
    if set(config['environments']) != {'staging', 'production'}:
        raise ReleaseError('runtime-environments-invalid')
    ports = []
    hosts = []
    for environment in config['environments'].values():
        if type(environment) is not dict or set(environment) != {'hostname', 'frontend_port', 'backend_port'}:
            raise ReleaseError('runtime-environment-fields')
        hostname = environment['hostname']
        if not isinstance(hostname, str) or not re.fullmatch(
                r'(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', hostname) or '..' in hostname:
            raise ReleaseError('runtime-hostname-invalid')
        hosts.append(hostname)
        for key in ('frontend_port', 'backend_port'):
            value = environment[key]
            if type(value) is not int or not 1024 <= value <= 65535:
                raise ReleaseError('runtime-port-invalid')
            ports.append(value)
    if len(set(ports)) != 4 or len(set(hosts)) != 2:
        raise ReleaseError('runtime-environments-overlap')
    protected(config['state'], directory=True)
    protected(config['settings'], directory=True)
    return config


@contextmanager
def locked(config, environment):
    if environment not in ('staging', 'production'):
        raise ReleaseError('runtime-environment-invalid')
    root = protected(Path(config['state']) / environment, directory=True)
    with (root / 'environment.lock').open('a') as lock:
        deadline = time.monotonic() + 60
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if time.monotonic() >= deadline:
                    raise ReleaseError('environment-lock-timeout') from None
                time.sleep(1)
        yield root


def compose(config, environment, snapshot, *args):
    project = config['slug'] + '-' + environment + '-app'
    return command('docker', 'compose', '--project-name', project, '--file', str(snapshot), *args,
                   timeout=240)


def app_compose(config, environment, release):
    settings = config['environments'][environment]
    common = {'read_only': True, 'cap_drop': ['ALL'], 'security_opt': ['no-new-privileges:true'],
              'restart': 'unless-stopped', 'pids_limit': 256}
    return {
        'services': {
            'frontend': dict(common, image=release['frontend'], mem_limit='128m',
                             tmpfs=['/tmp:rw,size=32m,mode=1777'],
                             ports=[f"127.0.0.1:{settings['frontend_port']}:8080"]),
            'backend': dict(common, image=release['backend'], mem_limit='512m',
                            tmpfs=['/tmp:rw,size=64m,mode=1777'],
                            env_file=[config['settings'] + '/' + environment + '/database.env'],
                            environment={'SERVER_FORWARD_HEADERS_STRATEGY': 'framework',
                                         'SPRINGDOC_APIDOCS_ENABLED': str(environment == 'staging').lower(),
                                         'SPRINGDOC_SWAGGERUI_ENABLED': str(environment == 'staging').lower()},
                            ports=[f"127.0.0.1:{settings['backend_port']}:8080"], networks=['database']),
        },
        'networks': {'database': {'external': True, 'name': config['slug'] + '-' + environment + '-db'}},
    }


def db_name(config, environment):
    return config['slug'] + '-' + environment + '-postgres'


def scalar(config, environment, query):
    return command('docker', 'exec', db_name(config, environment), 'psql', '-U', 'app', '-d', 'app',
                   '--no-psqlrc', '--set', 'ON_ERROR_STOP=1', '-tA', '-c', query).decode().strip()


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def backup(config, environment, root):
    if environment != 'production':
        raise ReleaseError('staging-backups-disabled')
    directory = protected(root / 'backups', directory=True)
    name = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + secrets.token_hex(4) + '.dump'
    destination = directory / name
    pending = directory / (name + '.partial')
    try:
        with pending.open('xb') as stream:
            result = subprocess.run(
                ['docker', 'exec', db_name(config, environment), 'pg_dump', '-U', 'app', '-d', 'app', '-Fc'],
                stdout=stream, stderr=subprocess.PIPE, timeout=180)
            stream.flush()
            os.fsync(stream.fileno())
        if result.returncode or pending.stat().st_size < 512:
            raise ReleaseError('production-backup-dump-failed')
        with pending.open('rb') as stream:
            check = subprocess.run(['docker', 'exec', '-i', db_name(config, environment), 'pg_restore', '--list'],
                                   stdin=stream, capture_output=True, timeout=60)
        if check.returncode or b'TOC Entries' not in check.stdout:
            raise ReleaseError('production-backup-archive-invalid')
        exists = scalar(config, environment, "SELECT to_regclass('public.app_user') IS NOT NULL") == 't'
        users = int(scalar(config, environment, 'SELECT count(*) FROM app_user')) if exists else 0
        digest = sha256_file(pending)
        metadata = {'sha256': digest, 'bytes': pending.stat().st_size, 'users': users,
                    'initialized': exists, 'created_at': datetime.now(timezone.utc).isoformat()}
        write_json(destination.with_suffix('.dump.json'), metadata)
        os.replace(pending, destination)
        descriptor = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        # Read the persisted destination, not just the bytes emitted by pg_dump.
        if sha256_file(destination) != metadata['sha256']:
            raise ReleaseError('production-backup-destination-mismatch')
        prune_backups(directory)
        return destination
    except (OSError, subprocess.TimeoutExpired):
        raise ReleaseError('production-backup-storage-or-timeout') from None
    finally:
        try:
            pending.unlink(missing_ok=True)
        except OSError:
            raise ReleaseError('production-backup-partial-cleanup-failed') from None


def prune_backups(directory):
    for candidate in directory.iterdir():
        if not re.fullmatch(r'\d{8}T\d{6}Z-[0-9a-f]{8}\.dump', candidate.name):
            continue
        protected(candidate)
        if time.time() - candidate.stat().st_mtime <= 30 * 86400:
            continue
        # Dump-first pruning also recovers legacy failed dumps without metadata.
        candidate.unlink()
        companion = candidate.with_suffix('.dump.json')
        if companion.exists():
            protected(companion).unlink()
    for candidate in directory.iterdir():
        if not re.fullmatch(r'\d{8}T\d{6}Z-[0-9a-f]{8}\.dump\.(?:json|partial)', candidate.name):
            continue
        protected(candidate)
        if time.time() - candidate.stat().st_mtime <= 30 * 86400:
            continue
        if candidate.suffix == '.partial' or not candidate.with_suffix('').exists():
            candidate.unlink()


def inspect_image(image, release, component):
    info = decode(command('docker', 'image', 'inspect', '--format',
                          '{"id":{{json .Id}},"user":{{json .Config.User}},"labels":{{json .Config.Labels}}}', image))
    if (info['user'] != ('101:101' if component == 'frontend' else '10001:10001')
            or info['labels'].get('org.opencontainers.image.revision') != release['source_sha']
            or info['labels'].get('org.opencontainers.image.source') != 'https://github.com/' + release['repository']):
        raise ReleaseError('pulled-image-provenance-or-user-mismatch')
    return info['id']


def public_probe(url, expected, environment):
    from protocol import NoRedirect, https_opener
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        try:
            with https_opener(NoRedirect()).open(url, timeout=5) as response:
                code, headers, body = response.status, response.headers, response.read(1024 * 1024)
        except urllib.error.HTTPError as error:
            code, headers, body = error.code, error.headers, error.read(1024 * 1024)
        except (urllib.error.URLError, TimeoutError, ConnectionResetError):
            time.sleep(1)
            continue
        if code == expected and headers.get('X-Vireo-Environment') == environment:
            return body
        time.sleep(1)
    raise ReleaseError('public-route-status-or-environment-mismatch')


def verify_running(config, environment, snapshot, release):
    for component in ('frontend', 'backend'):
        identifier = compose(config, environment, snapshot, 'ps', '--quiet', component).decode().strip()
        if not re.fullmatch('[0-9a-f]{64}', identifier):
            raise ReleaseError('running-container-identity-missing')
        actual = decode(command('docker', 'inspect', '--format',
                                '{"image":{{json .Image}},"health":{{json .State.Health.Status}}}', identifier))
        if actual['image'] != inspect_image(release[component], release, component) or actual['health'] != 'healthy':
            raise ReleaseError('running-image-or-health-mismatch')
    base = 'https://' + config['environments'][environment]['hostname']
    if decode(public_probe(base + '/api/actuator/health', 200, environment)).get('status') != 'UP':
        raise ReleaseError('public-backend-not-up')
    public_probe(base + '/api/auth/session', 401, environment)
    csrf = decode(public_probe(base + '/api/auth/csrf', 200, environment))
    if csrf.get('headerName') != 'X-CSRF-TOKEN' or not csrf.get('token'):
        raise ReleaseError('public-csrf-contract-mismatch')
    if b'<div id="root">' not in public_probe(base + '/login', 200, environment):
        raise ReleaseError('public-frontend-not-spa')
    public_probe(base + '/assets/missing-release-asset.js', 404, environment)


def deploy(config, ticket, api, registry_user):
    validate(config)
    environment = ticket['environment']
    release = pair(ticket['pair'], config['repository'], ticket['pair']['source_sha'])
    private_packages(api, config['repository'])
    with locked(config, environment) as root:
        active_path = root / 'active.json'
        transaction = root / 'transaction.json'
        if transaction.exists() and decode(protected(transaction).read_bytes())['state'] not in ('success', 'backup-failed'):
            raise ReleaseError('prior-transaction-needs-operator-reconciliation')
        previous = decode(protected(active_path).read_bytes()) if active_path.exists() else None
        if previous:
            verify_running(config, environment, Path(previous['snapshot']), previous['pair'])
        if scalar(config, environment, 'SELECT 1') != '1':
            raise ReleaseError('database-not-ready')
        with tempfile.TemporaryDirectory(prefix='vireo-pull-', dir=root) as temporary:
            docker_env = dict(os.environ, DOCKER_CONFIG=temporary)
            command('docker', 'login', 'ghcr.io', '--username', registry_user, '--password-stdin',
                    input_bytes=api.token.encode(), env=docker_env)
            for component in ('frontend', 'backend'):
                command('docker', 'pull', '--platform', 'linux/amd64', release[component],
                        env=docker_env, timeout=600)
                inspect_image(release[component], release, component)
        identifier = str(ticket['run_id']) + '-' + str(ticket['run_attempt'])
        directory = root / 'releases' / identifier
        directory.mkdir(mode=0o700)
        snapshot = directory / 'compose.json'
        write_json(snapshot, app_compose(config, environment, release))
        record = {'pair': release, 'snapshot': str(snapshot), 'previous': previous, 'state': 'prepared',
                  'run_id': ticket['run_id'], 'run_attempt': ticket['run_attempt']}
        write_json(transaction, record)
        if environment == 'production':
            if previous:
                compose(config, environment, Path(previous['snapshot']), 'stop', '--timeout', '30', 'backend')
            try:
                record['backup'] = str(backup(config, environment, root))
            except ReleaseError:
                if previous:
                    compose(config, environment, Path(previous['snapshot']), 'start', 'backend')
                record['state'] = 'backup-failed'
                write_json(transaction, record)
                raise
        record['state'] = 'replacing'
        write_json(transaction, record)
        compose(config, environment, snapshot, 'up', '--detach', '--no-deps', '--wait',
                '--wait-timeout', '120', 'backend', 'frontend')
        verify_running(config, environment, snapshot, release)
        record['state'] = 'success'
        write_json(active_path, record)
        write_json(transaction, record)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=('backup',))
    parser.add_argument('--config', required=True)
    args = parser.parse_args()
    try:
        if os.geteuid() != 0:
            raise ReleaseError('root-required')
        os.umask(0o077)
        config = validate(decode(protected(args.config).read_bytes()))
        with locked(config, 'production') as root:
            result = backup(config, 'production', root)
        print('Verified production backup: ' + str(result))
    except ReleaseError as error:
        print('Runtime failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
