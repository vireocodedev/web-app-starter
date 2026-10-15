"""Exercise release images without application credentials or persistent data."""
import argparse
import http.client
import json
from pathlib import Path
import secrets
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

POSTGRES = 'postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c'

class RejectRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        raise RuntimeError('Container HTTP redirect rejected.')


def docker(*arguments):
    result = subprocess.run(['docker', *arguments], capture_output=True, text=True, timeout=180)
    if result.returncode:
        raise RuntimeError('Container smoke operation failed: ' + arguments[0])
    return result.stdout.strip()


def probe(url, expected, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with urllib.request.build_opener(RejectRedirect()).open(url, timeout=3) as response:
                status, body = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, body = error.code, error.read()
        except (urllib.error.URLError, TimeoutError, ConnectionResetError, http.client.RemoteDisconnected):
            time.sleep(1)
            continue
        if status == expected:
            return body
        time.sleep(1)
    raise RuntimeError('Container HTTP probe did not reach expected status: ' + str(expected))


def image_identity(image, source):
    value = json.loads(docker('image', 'inspect', '--format',
                              '{"user":{{json .Config.User}},"labels":{{json .Config.Labels}}}', image))
    if value['user'].split(':', 1)[0] in ('', '0', 'root'):
        raise RuntimeError('Release image must select a non-root user.')
    if value.get('labels', {}).get('org.opencontainers.image.revision') != source:
        raise RuntimeError('Release image source label mismatch.')


def port(container):
    value = json.loads(docker('inspect', '--format', '{{json .NetworkSettings.Ports}}', container))
    return value['8080/tcp'][0]['HostPort']


def healthy(container, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        status = docker('inspect', '--format', '{{.State.Health.Status}}', container)
        if status == 'healthy':
            return
        if status != 'starting':
            raise RuntimeError('Container healthcheck failed: ' + status)
        time.sleep(1)
    raise RuntimeError('Container healthcheck timed out.')


def smoke(frontend, backend, source):
    prefix = 'vireo-smoke-' + secrets.token_hex(8)
    containers = []
    network_created = False
    try:
        network_created = True
        docker('network', 'create', prefix)
        with tempfile.TemporaryDirectory(prefix='vireo-image-smoke-') as directory:
            root = Path(directory)
            if backend:
                image_identity(backend, source)
                password = secrets.token_hex(24)
                postgres_env = root / 'postgres.env'
                postgres_env.write_text('POSTGRES_USER=smoke\nPOSTGRES_DB=smoke\nPOSTGRES_PASSWORD=' + password + '\n')
                postgres_env.chmod(0o600)
                database = prefix + '-postgres'
                containers.append(database)
                docker('run', '--detach', '--name', database, '--network', prefix, '--network-alias', 'postgres',
                       '--read-only', '--user', '999:999', '--cap-drop', 'ALL',
                       '--security-opt', 'no-new-privileges', '--memory', '256m', '--pids-limit', '256',
                       '--tmpfs', '/var/lib/postgresql:rw,size=256m,uid=999,gid=999,mode=0700',
                       '--tmpfs', '/var/run/postgresql:rw,size=16m,uid=999,gid=999,mode=0700',
                       '--tmpfs', '/tmp:rw,size=32m', '--env-file', str(postgres_env), POSTGRES)
                deadline = time.monotonic() + 60
                while time.monotonic() < deadline:
                    result = subprocess.run(['docker', 'exec', database, 'pg_isready', '-U', 'smoke', '-d', 'smoke'],
                                            capture_output=True, timeout=5)
                    if result.returncode == 0:
                        break
                    if docker('inspect', '--format', '{{.State.Status}}', database) in ('exited', 'dead'):
                        diagnostic = subprocess.run(
                            ['docker', 'logs', '--tail', '20', database], capture_output=True, text=True, timeout=10)
                        logs = (diagnostic.stdout + diagnostic.stderr).replace(password, '[redacted]')
                        raise RuntimeError('Disposable database exited: ' + logs)
                    time.sleep(1)
                else:
                    raise RuntimeError('Disposable database did not become ready.')
                backend_env = root / 'backend.env'
                backend_env.write_text('DATABASE_URL=jdbc:postgresql://postgres:5432/smoke\n'
                                       'DATABASE_USERNAME=smoke\nDATABASE_PASSWORD=' + password + '\n')
                backend_env.chmod(0o600)
                app = prefix + '-backend'
                containers.append(app)
                docker('run', '--detach', '--name', app, '--network', prefix, '--read-only',
                       '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--memory', '512m',
                       '--pids-limit', '256', '--tmpfs', '/tmp:rw,size=64m,mode=1777',
                       '--publish', '127.0.0.1::8080', '--env-file', str(backend_env), backend)
                base = 'http://127.0.0.1:' + port(app)
                health = json.loads(probe(base + '/api/actuator/health', 200))
                if health.get('status') != 'UP':
                    raise RuntimeError('Backend health body was not UP.')
                probe(base + '/api/auth/session', 401)
                csrf = json.loads(probe(base + '/api/auth/csrf', 200))
                if csrf.get('headerName') != 'X-CSRF-TOKEN' or not csrf.get('token'):
                    raise RuntimeError('Backend CSRF contract mismatch.')
                healthy(app)
                print('Backend image: non-root restricted startup, fresh PostgreSQL/Flyway, health, session and CSRF passed.')
            if frontend:
                image_identity(frontend, source)
                app = prefix + '-frontend'
                containers.append(app)
                docker('run', '--detach', '--name', app, '--network', prefix, '--read-only',
                       '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--memory', '128m',
                       '--pids-limit', '128', '--tmpfs', '/tmp:rw,size=32m,mode=1777',
                       '--publish', '127.0.0.1::8080', frontend)
                base = 'http://127.0.0.1:' + port(app)
                probe(base + '/healthz', 200, timeout=20)
                page = probe(base + '/login', 200, timeout=10).decode()
                if '<div id="root">' not in page or '/assets/' not in page:
                    raise RuntimeError('Frontend did not serve the built SPA.')
                probe(base + '/api/not-an-endpoint', 404, timeout=5)
                probe(base + '/assets/does-not-exist.js', 404, timeout=5)
                healthy(app, timeout=30)
                print('Frontend image: non-root restricted startup, SPA fallback and API/asset 404 handling passed.')
    finally:
        failures = []
        for container in reversed(containers):
            inventory = subprocess.run(['docker', 'ps', '--all', '--quiet', '--filter', 'name=^' + container + '$'],
                                       capture_output=True, timeout=30)
            if inventory.returncode:
                failures.append(container)
                continue
            if not inventory.stdout.strip():
                continue
            result = subprocess.run(['docker', 'rm', '--force', container], capture_output=True, timeout=30)
            if result.returncode:
                failures.append(container)
        if network_created:
            inventory = subprocess.run(['docker', 'network', 'ls', '--quiet', '--filter', 'name=^' + prefix + '$'],
                                       capture_output=True, timeout=30)
            if inventory.returncode:
                failures.append(prefix)
            elif inventory.stdout.strip():
                result = subprocess.run(['docker', 'network', 'rm', prefix], capture_output=True, timeout=30)
                if result.returncode:
                    failures.append(prefix)
        if failures:
            raise RuntimeError('Smoke cleanup needs inspection: ' + ', '.join(failures))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--frontend')
    parser.add_argument('--backend')
    parser.add_argument('--source-sha', required=True)
    arguments = parser.parse_args()
    if not arguments.frontend and not arguments.backend:
        parser.error('At least one release image is required.')
    smoke(arguments.frontend, arguments.backend, arguments.source_sha)
