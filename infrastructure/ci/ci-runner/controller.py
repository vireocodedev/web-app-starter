#!/usr/bin/env python3
"""Root controller. Fixed commands; repository access comes from protected config."""
import argparse
import errno
import fcntl
import hashlib
import ipaddress
import importlib.util
import json
import os
import re
from pathlib import Path
import shutil
import signal
import stat
import subprocess
import sys
import time
import urllib.error
import urllib.request

BASE = Path('/var/lib/web-app-ci')
CONFIG = Path('/etc/web-app-ci/config.json')
APP_SETTINGS = Path('/etc/web-app-ci/github-app.json')
STATE = BASE / 'controller.json'
WITNESS_STATE = BASE / 'witness-mounts.json'
HOME = BASE / 'job/home'
ROOTFS = BASE / 'rootfs'
LABELS = {'self-hosted', 'Linux', 'X64', 'web-app-ci'}
REGISTRATION_REJECTIONS = {400, 401, 403, 404, 405, 409, 422}
NETNS = 'web-app-ci'
VETH = 'webcih'
PEER = 'webcic'
SUBNET = '10.203.241.0/30'
CLIENT = '10.203.241.2'
STOP = False


class BoundaryError(Exception):
    """Messages are fixed codes, never API bodies, argv or job output."""


class RejectRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise BoundaryError('github-api-redirect-rejected')


def command(*args, check=True, timeout=120, input_text=None):
    result = subprocess.run(args, input=input_text, text=True, capture_output=True,
                            timeout=timeout, env={'PATH': '/usr/sbin:/usr/bin:/sbin:/bin'})
    if check and result.returncode:
        raise BoundaryError('fixed-local-command-failed')
    return result


def protected_path(path, directory=False):
    path = Path(path)
    if not path.is_absolute() or '..' in path.parts:
        raise BoundaryError('protected-absolute-path-required')
    for parent in reversed(path.parents):
        information = parent.lstat()
        if not stat.S_ISDIR(information.st_mode) or information.st_uid != 0 or information.st_mode & 0o022:
            raise BoundaryError('unsafe-protected-parent')
    information = path.lstat()
    required = stat.S_ISDIR if directory else stat.S_ISREG
    if not required(information.st_mode) or information.st_uid != 0 or information.st_mode & 0o077:
        raise BoundaryError('root-only-file-required')
    return path


def protected_file(path):
    path = protected_path(path)
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor) as stream:
        information = os.fstat(stream.fileno())
        if not stat.S_ISREG(information.st_mode) or information.st_uid != 0 or information.st_mode & 0o077:
            raise BoundaryError('root-only-file-required')
        if information.st_size > 1024 * 1024:
            raise BoundaryError('protected-file-too-large')
        return stream.read()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise BoundaryError('duplicate-configuration-key')
        result[key] = value
    return result


def validate_repository(repository):
    if type(repository) is not str or not re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?/[A-Za-z0-9_.-]{1,100}', repository):
        raise BoundaryError('invalid-project-repository')
    if repository.split('/')[1] in ('.', '..'):
        raise BoundaryError('invalid-project-repository')
    return repository


def validate_projects(projects):
    if type(projects) is not dict or len(projects) > 128:
        raise BoundaryError('invalid-project-map')
    repositories = set()
    for slug, project in projects.items():
        if type(slug) is not str or not re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug) or len(slug) > 63:
            raise BoundaryError('invalid-project-slug')
        if type(project) is not dict or set(project) != {'repository'}:
            raise BoundaryError('invalid-project-fields')
        for repository in project.values():
            validate_repository(repository)
            if repository.lower() in repositories:
                raise BoundaryError('duplicate-project-repository')
            repositories.add(repository.lower())
    return projects


def repositories(config):
    validate_projects(config['projects'])
    return tuple(repository for project in config['projects'].values() for repository in project.values())


def validate_config(config):
    if type(config) is not dict:
        raise BoundaryError('invalid-configuration-object')
    bounds = {'uid': (60000, 65000), 'subuid_start': (1000000, 2000000000),
              'memory_high_mib': (1024, 8192), 'memory_max_mib': (2048, 8192),
              'swap_max_mib': (0, 1024), 'cpu_quota_percent': (25, 400),
              'tasks_max': (256, 2048), 'job_disk_gib': (8, 24),
              'host_reserve_mib': (2048, 65536),
              'job_timeout_seconds': (600, 7200), 'poll_seconds': (15, 120)}
    if set(config) != set(bounds) | {'host_public_ipv4', 'projects'}:
        raise BoundaryError('invalid-configuration-keys')
    for key, (low, high) in bounds.items():
        value = config[key]
        if type(value) is not int or not low <= value <= high:
            raise BoundaryError('invalid-configuration-value')
    if config['memory_high_mib'] > config['memory_max_mib']:
        raise BoundaryError('invalid-memory-bounds')
    addresses = config['host_public_ipv4']
    if not isinstance(addresses, list) or not addresses:
        raise BoundaryError('host-public-ipv4-required')
    for address in addresses:
        if str(ipaddress.IPv4Address(address)) != address:
            raise BoundaryError('invalid-host-address')
    validate_projects(config['projects'])
    return config



def load_config():
    return validate_config(json.loads(protected_file(CONFIG), object_pairs_hook=unique_object))


def config_digest():
    return hashlib.sha256(CONFIG.read_bytes()).hexdigest()


def app_module():
    spec = importlib.util.spec_from_file_location('web_app_github_credentials', Path(__file__).with_name('github_app.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def app_credentials(key_path):
    settings = json.loads(protected_file(APP_SETTINGS), object_pairs_hook=unique_object)
    return app_module().GitHubAppCredentials(settings, key_path, protected_file, validate_repository, BoundaryError)


def credential_token(credentials, repository):
    return credentials if type(credentials) is str else credentials.token_for(repository)


def mapping_helpers():
    metadata = []
    for name, capability in (('newuidmap', 'cap_setuid=ep'), ('newgidmap', 'cap_setgid=ep')):
        path = ROOTFS / 'usr/bin' / name
        information = path.lstat()
        if not stat.S_ISREG(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
                or stat.S_IMODE(information.st_mode) != 0o755:
            raise BoundaryError('mapping-helper-ownership-or-mode-mismatch')
        if command('getcap', str(path)).stdout.strip() != f'{path} {capability}':
            raise BoundaryError('mapping-helper-capability-mismatch')
        metadata.append((str(path), information.st_uid, information.st_gid,
                         stat.S_IMODE(information.st_mode),
                         os.getxattr(path, 'security.capability').hex()))
    return metadata


def minimal_devices():
    root = BASE / 'minimal-dev'
    for parent in (Path('/var'), Path('/var/lib'), BASE):
        information = parent.lstat()
        if not stat.S_ISDIR(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
                or information.st_mode & 0o022:
            raise BoundaryError('minimal-device-parent-metadata-mismatch')
    directories = ('.', 'net', 'shm', 'mqueue')
    files = ('null', 'zero', 'full', 'random', 'urandom', 'tty', 'net/tun')
    links = {'fd': '/proc/self/fd', 'stdin': '/proc/self/fd/0',
             'stdout': '/proc/self/fd/1', 'stderr': '/proc/self/fd/2'}
    expected = {'': {'net', 'shm', 'mqueue', 'null', 'zero', 'full', 'random', 'urandom', 'tty', *links},
                'net': {'tun'}, 'shm': set(), 'mqueue': set()}
    metadata = []
    for relative in directories + files:
        path = root / relative
        information = path.lstat()
        directory = relative in directories
        if information.st_uid != 0 or information.st_gid != 0 \
                or stat.S_IMODE(information.st_mode) != (0o755 if directory else 0o644) \
                or not (stat.S_ISDIR(information.st_mode) if directory else stat.S_ISREG(information.st_mode)):
            raise BoundaryError('minimal-device-baseline-metadata-mismatch')
        if directory:
            if {entry.name for entry in path.iterdir()} != expected['' if relative == '.' else relative]:
                raise BoundaryError('minimal-device-baseline-shape-mismatch')
        elif information.st_size != 0:
            raise BoundaryError('minimal-device-placeholder-not-empty')
        metadata.append((relative, information.st_uid, information.st_gid,
                         stat.S_IMODE(information.st_mode), information.st_dev, information.st_ino))
    for relative, target in links.items():
        path = root / relative
        information = path.lstat()
        if not stat.S_ISLNK(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
                or str(path.readlink()) != target:
            raise BoundaryError('minimal-device-symlink-mismatch')
        metadata.append((relative, information.st_uid, information.st_gid,
                         stat.S_IMODE(information.st_mode), information.st_dev, information.st_ino, target))
    return metadata


def boundary_digest(config):
    paths = [CONFIG, APP_SETTINGS, Path(__file__), Path(__file__).with_name('validation.py'),
             Path(__file__).with_name('github_app.py'),
             ROOTFS / 'usr/local/lib/web-app-ci/start-job.sh',
             ROOTFS / 'usr/local/lib/web-app-ci/validate-job.py',
             ROOTFS / 'etc/systemd/user/docker.service',
             ROOTFS / 'etc/systemd/user/web-app-job.service',
             ROOTFS / 'etc/systemd/user/web-app-validation.service',
             Path(f"/etc/systemd/system/user@{config['uid']}.service.d/web-app-ci.conf"),
             Path(f"/etc/systemd/system/user-{config['uid']}.slice.d/web-app-ci.conf"),
             Path('/etc/apparmor.d/web-app-ci'), BASE / 'baseline-packages.tsv',
             ROOTFS / 'usr/bin/newuidmap', ROOTFS / 'usr/bin/newgidmap',
             ROOTFS / 'usr/local/lib/web-app-ci/runtime-bin/busctl', ROOTFS / 'usr/bin/busctl']
    digest = hashlib.sha256()
    for path in paths:
        digest.update(str(path).encode())
        digest.update(path.read_bytes())
    digest.update(json.dumps(mapping_helpers(), separators=(',', ':')).encode())
    digest.update(json.dumps(minimal_devices(), separators=(',', ':')).encode())
    digest.update(json.dumps(runtime_adapter(), separators=(',', ':')).encode())
    digest.update(json.dumps(witness_metadata(), separators=(',', ':')).encode())
    return digest.hexdigest()


def runtime_adapter():
    directory = ROOTFS / 'usr/local/lib/web-app-ci/runtime-bin'
    for parent in (ROOTFS, ROOTFS / 'usr', ROOTFS / 'usr/local', ROOTFS / 'usr/local/lib',
                   directory.parent, directory):
        information = parent.lstat()
        if not stat.S_ISDIR(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
                or information.st_mode & 0o022:
            raise BoundaryError('runtime-adapter-parent-metadata-mismatch')
    if {path.name for path in directory.iterdir()} != {'busctl'}:
        raise BoundaryError('runtime-adapter-directory-shape-mismatch')
    metadata = []
    for path in (directory / 'busctl', ROOTFS / 'usr/bin/busctl'):
        information = path.lstat()
        if not stat.S_ISREG(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
                or stat.S_IMODE(information.st_mode) != 0o755:
            raise BoundaryError('runtime-adapter-executable-metadata-mismatch')
        try:
            os.getxattr(path, 'security.capability')
        except OSError as error:
            if error.errno != errno.ENODATA:
                raise
        else:
            raise BoundaryError('runtime-adapter-unexpected-capabilities')
        metadata.append((str(path), information.st_uid, information.st_gid, stat.S_IMODE(information.st_mode)))
    return metadata


def witness_metadata():
    # Called while sources are unmounted; never hash or traverse dynamic procfs.
    sources = (BASE / 'proc-witness', BASE / 'sys-witness')
    if any(entry['target'] == str(source) or entry['target'].startswith(str(source) + '/')
           for entry in mount_entries() for source in sources):
        raise BoundaryError('api-witness-placeholder-still-mounted')
    parents = (Path('/var'), Path('/var/lib'), BASE, ROOTFS, ROOTFS / 'usr',
               ROOTFS / 'usr/local', ROOTFS / 'usr/local/lib', ROOTFS / 'usr/local/lib/web-app-ci')
    for path in parents:
        information = path.lstat()
        if not stat.S_ISDIR(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
                or information.st_mode & 0o022 or (path == BASE and stat.S_IMODE(information.st_mode) != 0o700):
            raise BoundaryError('api-witness-parent-not-protected')
    entries = ((BASE / 'proc-witness', 0o755), (BASE / 'sys-witness', 0o755),
               (ROOTFS / 'usr/local/lib/web-app-ci/proc-witness', 0o755),
               (ROOTFS / 'usr/local/lib/web-app-ci/sys-anchor', 0o700),
               (ROOTFS / 'usr/local/lib/web-app-ci/sys-anchor/sysfs', 0o755))
    metadata = []
    for path, mode in entries:
        information = path.lstat()
        if not stat.S_ISDIR(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
                or stat.S_IMODE(information.st_mode) != mode:
            raise BoundaryError('api-witness-placeholder-metadata-mismatch')
        expected = {'sysfs'} if path.name == 'sys-anchor' else set()
        if {child.name for child in path.iterdir()} != expected:
            raise BoundaryError('api-witness-placeholder-shape-mismatch')
        metadata.append((str(path), information.st_uid, information.st_gid, mode,
                         information.st_dev, information.st_ino))
    return metadata


def mount_entries(path='/proc/self/mountinfo'):
    entries = []
    for line in Path(path).read_text().splitlines():
        fields = line.split()
        separator = fields.index('-')
        entries.append({'id': fields[0], 'device': fields[2], 'root': fields[3], 'target': fields[4],
                        'type': fields[separator + 1], 'options': fields[5].split(','),
                        'super_options': fields[separator + 3].split(',')})
    return entries


def witness_mount(entries, target, kind):
    matches = [entry for entry in entries if entry['target'] == str(target)]
    if len(matches) != 1 or any(entry['target'].startswith(str(target) + '/') for entry in entries):
        raise BoundaryError('api-witness-mount-missing-duplicate-or-submounted')
    entry = matches[0]
    required = {'nosuid', 'nodev', 'noexec', 'relatime', 'rw' if kind == 'proc' else 'ro'}
    if entry['root'] != '/' or entry['type'] != kind or not required <= set(entry['options']):
        raise BoundaryError('api-witness-mount-type-root-or-flags-mismatch')
    if kind == 'proc' and ('subset=pid' not in entry['super_options']
                           or not {'hidepid=2', 'hidepid=invisible'} & set(entry['super_options'])):
        raise BoundaryError('api-witness-proc-visibility-mismatch')
    return entry


def save_witness_state(value):
    temporary = BASE / 'witness-mounts.tmp'
    with temporary.open('w') as stream:
        os.chmod(temporary, 0o600)
        json.dump(value, stream)
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(WITNESS_STATE)


def witnesses_start():
    if WITNESS_STATE.exists():
        raise BoundaryError('stale-api-witness-state')
    witness_metadata()
    records = {}
    for name, kind in (('proc-witness', 'proc'), ('sys-witness', 'sysfs')):
        target = BASE / name
        if any(entry['target'] == str(target) or entry['target'].startswith(str(target) + '/')
               for entry in mount_entries()):
            raise BoundaryError('api-witness-source-already-mounted')
        if kind == 'proc':
            command('mount', '-t', 'proc', '-o',
                    'rw,nosuid,nodev,noexec,relatime,hidepid=invisible,subset=pid', 'proc', str(target))
        else:
            # Only NET entry: retain the HOST mount namespace and fixed source.
            command('nsenter', '--net=/run/netns/web-app-ci', 'mount', '-t', 'sysfs', '-o',
                    'ro,nosuid,nodev,noexec,relatime', 'sysfs', str(target))
        records[name] = witness_mount(mount_entries(), target, kind)
        save_witness_state(records)


def witnesses_verify(config, manager=True):
    records = json.loads(protected_file(WITNESS_STATE))
    if not isinstance(records, dict) or set(records) != {'proc-witness', 'sys-witness'}:
        raise BoundaryError('api-witness-state-incomplete')
    entries = mount_entries()
    for name, kind in (('proc-witness', 'proc'), ('sys-witness', 'sysfs')):
        if witness_mount(entries, BASE / name, kind) != records[name]:
            raise BoundaryError('api-witness-source-identity-changed')
    sysfs = BASE / 'sys-witness'
    if sysfs.stat().st_dev == Path('/sys').stat().st_dev:
        raise BoundaryError('api-witness-host-sysfs-superblock-reused')
    if {path.name for path in (sysfs / 'class/net').iterdir()} != {'lo', PEER}:
        raise BoundaryError('api-witness-sysfs-network-view-not-ci')
    for relative in ('fs/cgroup', 'kernel/debug', 'kernel/security', 'firmware/efi/efivars'):
        path = sysfs / relative
        if path.exists() and any(path.iterdir()):
            raise BoundaryError('api-witness-host-control-filesystem-exposed')
    if manager:
        pid = manager_pid(config)
        entries = mount_entries(f'/proc/{pid}/mountinfo')
        for name, kind, destination in (
                ('proc-witness', 'proc', '/usr/local/lib/web-app-ci/proc-witness'),
                ('sys-witness', 'sysfs', '/usr/local/lib/web-app-ci/sys-anchor/sysfs')):
            witness_mount(entries, destination, kind)
            source = (BASE / name).stat()
            mounted = Path(f'/proc/{pid}/root{destination}').stat()
            if (source.st_dev, source.st_ino) != (mounted.st_dev, mounted.st_ino):
                raise BoundaryError('api-witness-manager-bind-identity-mismatch')


def witnesses_stop():
    records = json.loads(protected_file(WITNESS_STATE)) if WITNESS_STATE.exists() else {}
    if not isinstance(records, dict) or not set(records) <= {'proc-witness', 'sys-witness'}:
        raise BoundaryError('api-witness-cleanup-state-invalid')
    for name, kind in (('sys-witness', 'sysfs'), ('proc-witness', 'proc')):
        target = BASE / name
        entries = mount_entries()
        present = any(entry['target'] == str(target) or entry['target'].startswith(str(target) + '/') for entry in entries)
        if present:
            if name not in records or witness_mount(entries, target, kind) != records[name]:
                raise BoundaryError('api-witness-cleanup-foreign-mount')
            command('umount', str(target))
            if any(entry['target'] == str(target) or entry['target'].startswith(str(target) + '/')
                   for entry in mount_entries()):
                raise BoundaryError('api-witness-unmount-incomplete')
    witness_metadata()
    WITNESS_STATE.unlink(missing_ok=True)


def save_state(value):
    temporary = BASE / 'controller.json.tmp'
    with temporary.open('w') as stream:
        os.chmod(temporary, 0o600)
        json.dump(value, stream)
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(STATE)
    directory = os.open(BASE, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def api(token, repo, suffix, method='GET', payload=None, missing_ok=False):
    if repo not in repositories(load_config()) or not suffix.startswith('actions/') or '..' in suffix:
        raise BoundaryError('repository-or-api-path-rejected')
    req = urllib.request.Request(f'https://api.github.com/repos/{repo}/{suffix}',
        data=json.dumps(payload).encode() if payload is not None else None, method=method,
        headers={'Authorization': 'Bearer ' + credential_token(token, repo), 'Accept': 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'web-app-ci-controller',
                 'Content-Type': 'application/json'})
    try:
        with urllib.request.build_opener(RejectRedirect()).open(req, timeout=30) as response:
            data = response.read(8 * 1024 * 1024)
            return json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        if (method == 'POST' and suffix == 'actions/runners/generate-jitconfig'
                and error.code in REGISTRATION_REJECTIONS):
            raise BoundaryError('runner-registration-rejected') from None
        if missing_ok and error.code == 404:
            return None
        raise BoundaryError(f'github-api-http-{error.code}') from None
    except (urllib.error.URLError, ValueError, TimeoutError):
        raise BoundaryError('github-api-unavailable') from None


def runner_inventory(request, token, repo):
    runners = []
    seen = set()
    expected_count = None
    for page in range(1, 11):
        data = request(token, repo, f'actions/runners?per_page=100&page={page}')
        if (type(data) is not dict or type(data.get('total_count')) is not int
                or not 0 <= data['total_count'] <= 1000 or type(data.get('runners')) is not list
                or len(data['runners']) > 100):
            raise BoundaryError('registration-inventory-invalid-or-too-large')
        if expected_count is None:
            expected_count = data['total_count']
        elif data['total_count'] != expected_count:
            raise BoundaryError('registration-inventory-changed')
        for runner in data['runners']:
            if (type(runner) is not dict or type(runner.get('id')) is not int
                    or runner['id'] <= 0 or type(runner.get('name')) is not str
                    or runner['id'] in seen):
                raise BoundaryError('registration-inventory-invalid-or-too-large')
            seen.add(runner['id'])
            runners.append(runner)
        if len(runners) > data['total_count']:
            raise BoundaryError('registration-inventory-invalid-or-too-large')
        if len(runners) == data['total_count']:
            return runners
        if len(data['runners']) < 100:
            raise BoundaryError('registration-inventory-invalid-or-too-large')
    raise BoundaryError('registration-inventory-invalid-or-too-large')


def owned_runner(request, token, repo, name, runner_id):
    runners = runner_inventory(request, token, repo)
    names = [runner for runner in runners if runner['name'] == name]
    if runner_id is None:
        # An empty inventory cannot resolve a POST whose outcome is unknown.
        if len(names) != 1:
            raise BoundaryError('registration-create-outcome-unresolved')
        return names[0]
    matches = [runner for runner in runners if runner['id'] == runner_id]
    if (matches and matches[0]['name'] != name) or any(runner['id'] != runner_id for runner in names):
        raise BoundaryError('runner-registration-identity-mismatch')
    return matches[0] if matches else None


def delete_owned_runner(request, token, repo, runner):
    try:
        request(token, repo, f"actions/runners/{runner['id']}", 'DELETE')
    except BoundaryError:
        # A DELETE can race ephemeral auto-removal or complete after a timeout.
        # Only an accessible inventory may prove that the registration is gone.
        if owned_runner(request, token, repo, runner['name'], runner['id']) is not None:
            raise BoundaryError('runner-registration-cleanup-required') from None
        return
    if owned_runner(request, token, repo, runner['name'], runner['id']) is not None:
        raise BoundaryError('runner-registration-cleanup-required')


def find_job(token):
    candidates = []
    for repo in repositories(load_config()):
        # An in-progress multi-job workflow may still have queued later jobs.
        for status in ('queued', 'in_progress'):
            for page in range(1, 6):
                runs = api(token, repo, f'actions/runs?status={status}&per_page=100&page={page}')['workflow_runs']
                for run in runs:
                    if run['event'] not in ('pull_request', 'push', 'schedule', 'workflow_dispatch'):
                        continue
                    for job_page in range(1, 6):
                        jobs = api(token, repo, f"actions/runs/{int(run['id'])}/jobs?filter=latest&per_page=100&page={job_page}")['jobs']
                        for job in jobs:
                            labels = set(job.get('labels', []))
                            if job['status'] == 'queued' and 'web-app-ci' in labels and labels <= LABELS:
                                candidates.append((job['created_at'], repo, int(job['id'])))
                        if len(jobs) < 100:
                            break
                if len(runs) < 100:
                    break
    return min(candidates)[1:] if candidates else None


def manager_unit(config):
    return f"user@{config['uid']}.service"


def manager_pid(config):
    text = command('systemctl', 'show', '-p', 'MainPID', '--value', manager_unit(config)).stdout.strip()
    if not text.isdigit() or int(text) <= 1:
        raise BoundaryError('manager-not-running')
    return int(text)


def inside(config, *args, timeout=120, check=True):
    # nsenter opens the trusted manager's root before switching mount namespace.
    # Join its real cgroup too: namespace entry alone leaves helpers outside the
    # immutable UID resource bounds. The root controller itself stays outside.
    # runuser drops UID, GID and supplementary groups before any user-bus call.
    return command('nsenter', '--target', str(manager_pid(config)), '--mount', '--net',
                   '--cgroup', '--join-cgroup', '--root', '--wd=/', '/usr/sbin/runuser', '-u', 'web-app-ci', '--',
                   '/usr/bin/env', f"XDG_RUNTIME_DIR=/run/user/{config['uid']}",
                   f"DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/{config['uid']}/bus",
                   'JAVA_HOME=/opt/jdk', 'PATH=/opt/node/bin:/opt/jdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                   f"DOCKER_HOST=unix:///run/user/{config['uid']}/docker.sock", *args,
                   timeout=timeout, check=check)


def forward_rules():
    return [('-i', VETH, '-m', 'comment', '--comment', 'web-app-ci-egress', '-j', 'ACCEPT'),
            ('-o', VETH, '-m', 'conntrack', '--ctstate', 'ESTABLISHED,RELATED',
             '-m', 'comment', '--comment', 'web-app-ci-return', '-j', 'ACCEPT')]


def network_start(config):
    if Path('/proc/sys/net/ipv4/ip_forward').read_text().strip() != '1':
        raise BoundaryError('host-forwarding-required')
    routes = json.loads(command('ip', '-j', '-4', 'route', 'show', 'table', 'all').stdout)
    network = ipaddress.IPv4Network(SUBNET)
    for route in routes:
        destination = route.get('dst', 'default')
        if destination != 'default' and network.overlaps(ipaddress.IPv4Network(destination)):
            raise BoundaryError('ci-subnet-conflicts-with-host-route')
    if command('nft', 'list', 'table', 'inet', 'web_app_ci', check=False).returncode == 0:
        raise BoundaryError('ci-firewall-table-already-exists')
    # Drop rules are installed before the interface exists or any job starts.
    blocked = ['0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8',
               '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/24', '192.0.2.0/24',
               '192.168.0.0/16', '198.18.0.0/15', '198.51.100.0/24',
               '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4'] + config['host_public_ipv4']
    rules = f'''table inet web_app_ci {{
      set forbidden4 {{ type ipv4_addr; flags interval; auto-merge; elements = {{ {', '.join(blocked)} }} }}
      chain ingress {{ type filter hook prerouting priority -310; policy accept;
        iifname "{VETH}" meta nfproto ipv6 drop
        iifname "{VETH}" ip saddr != {CLIENT} drop
        iifname "{VETH}" fib daddr type local drop
        iifname "{VETH}" ip daddr @forbidden4 drop
        iifname "{VETH}" ip daddr {{ 1.1.1.1, 8.8.8.8 }} udp dport 53 accept
        iifname "{VETH}" ip daddr {{ 1.1.1.1, 8.8.8.8 }} tcp dport 53 accept
        iifname "{VETH}" tcp dport {{ 80, 443 }} accept
        iifname "{VETH}" drop
      }}
      chain outbound {{ type filter hook forward priority -310; policy accept;
        oifname "{VETH}" ct state established,related accept
        oifname "{VETH}" drop
      }}
    }}
    table ip web_app_ci_nat {{
      chain postrouting {{ type nat hook postrouting priority srcnat; policy accept;
        ip saddr {CLIENT} masquerade
      }}
    }}'''
    command('nft', '-f', '-', input_text=rules)
    command('ip', 'netns', 'add', NETNS)
    command('ip', 'link', 'add', VETH, 'type', 'veth', 'peer', 'name', PEER)
    command('ip', 'link', 'set', PEER, 'netns', NETNS)
    command('sysctl', '-q', '-w', f'net.ipv6.conf.{VETH}.disable_ipv6=1')
    command('ip', 'address', 'add', '10.203.241.1/30', 'dev', VETH)
    command('ip', 'link', 'set', VETH, 'up')
    command('ip', 'netns', 'exec', NETNS, 'sysctl', '-q', '-w',
            'net.ipv6.conf.all.disable_ipv6=1', 'net.ipv6.conf.default.disable_ipv6=1')
    command('ip', '-n', NETNS, 'address', 'add', f'{CLIENT}/30', 'dev', PEER)
    command('ip', '-n', NETNS, 'link', 'set', PEER, 'up')
    command('ip', '-n', NETNS, 'link', 'set', 'lo', 'up')
    command('ip', '-n', NETNS, 'route', 'add', 'default', 'via', '10.203.241.1')
    for rule in forward_rules():
        command('iptables', '-w', '10', '-I', 'FORWARD', '1', *rule)


def network_stop():
    # Remove the live interface first. Never open egress by removing its filter first.
    if command('ip', 'link', 'show', VETH, check=False).returncode == 0:
        command('ip', 'link', 'delete', VETH)
    for rule in forward_rules():
        while command('iptables', '-w', '10', '-C', 'FORWARD', *rule, check=False).returncode == 0:
            command('iptables', '-w', '10', '-D', 'FORWARD', *rule)
    namespaces = command('ip', 'netns', 'list').stdout.splitlines()
    if any(line.split()[0] == NETNS for line in namespaces if line.split()):
        command('ip', 'netns', 'delete', NETNS)
    for family, table in [('inet', 'web_app_ci'), ('ip', 'web_app_ci_nat')]:
        if command('nft', 'list', 'table', family, table, check=False).returncode == 0:
            command('nft', 'delete', 'table', family, table)


def remaining_processes(config):
    owned = {config['uid'], *range(config['subuid_start'], config['subuid_start'] + 65536)}
    result = []
    for entry in Path('/proc').iterdir():
        if entry.name.isdigit():
            try:
                status = (entry / 'status').read_text()
                line = next(item for item in status.splitlines() if item.startswith('Uid:'))
                if any(int(value) in owned for value in line.split()[1:]):
                    result.append(int(entry.name))
            except (FileNotFoundError, ProcessLookupError):
                pass
    return result


def cleanup(config, token=None):
    previous = json.loads(protected_file(STATE), object_pairs_hook=unique_object) if STATE.exists() else {}
    if type(previous) is not dict:
        raise BoundaryError('invalid-job-recovery-state')
    if previous:
        if (set(previous) != {'repo', 'runner_id', 'runner_name', 'job_id'}
                or previous['repo'] not in repositories(config)
                or type(previous['job_id']) is not int or previous['job_id'] <= 0
                or type(previous['runner_name']) is not str
                or not re.fullmatch('web-app-ci-job-[0-9a-f]{32}', previous['runner_name'])
                or (previous['runner_id'] is not None
                    and (type(previous['runner_id']) is not int or previous['runner_id'] <= 0))):
            raise BoundaryError('invalid-job-recovery-state')
    command('systemctl', 'stop', manager_unit(config))
    for pid in remaining_processes(config):
        try:
            # pidfd avoids killing an unrelated process if a numeric PID is reused.
            descriptor = os.pidfd_open(pid)
            try:
                status = Path(f'/proc/{pid}/status').read_text()
                owner = int(next(line for line in status.splitlines() if line.startswith('Uid:')).split()[1])
                if owner == config['uid'] or config['subuid_start'] <= owner < config['subuid_start'] + 65536:
                    signal.pidfd_send_signal(descriptor, signal.SIGKILL)
            finally:
                os.close(descriptor)
        except (ProcessLookupError, FileNotFoundError):
            pass
    deadline = time.monotonic() + 15
    while remaining_processes(config) and time.monotonic() < deadline:
        time.sleep(0.2)
    if remaining_processes(config):
        raise BoundaryError('uid-process-cleanup-failed')
    command('systemctl', 'stop', f"user-runtime-dir@{config['uid']}.service")
    witnesses_stop()
    network_stop()
    job = BASE / 'job'
    if command('mountpoint', '-q', str(job), check=False).returncode == 0:
        # No lazy/forced unmount: a surviving namespace is a fail-closed error.
        command('umount', str(job))
    if job.exists() and any(job.iterdir()):
        raise BoundaryError('job-mount-cleanup-incomplete')
    (BASE / 'job.img').unlink(missing_ok=True)
    if previous:
        if token is None:
            raise BoundaryError('stale-runner-registration-needs-controller-token')
        runner = owned_runner(api, token, previous['repo'], previous['runner_name'], previous['runner_id'])
        if runner is not None:
            previous['runner_id'] = runner['id']
            save_state(previous)
            delete_owned_runner(api, token, previous['repo'], runner)
    save_state({})


def prepare(config):
    mapping_helpers()
    minimal_devices()
    runtime_adapter()
    witness_metadata()
    if remaining_processes(config):
        raise BoundaryError('fixed-uid-has-existing-processes')
    available = next(int(line.split()[1]) // 1024 for line in Path('/proc/meminfo').read_text().splitlines()
                     if line.startswith('MemAvailable:'))
    if available < config['memory_max_mib'] + 512:
        raise BoundaryError('insufficient-current-memory-headroom')
    free_bytes = shutil.disk_usage(BASE).free
    disk_bytes = config['job_disk_gib'] * 1024 ** 3
    if free_bytes < disk_bytes + 8 * 1024 ** 3:
        raise BoundaryError('insufficient-disk-headroom')
    if (BASE / 'job.img').exists():
        raise BoundaryError('stale-job-image')
    (BASE / 'job').mkdir(exist_ok=True, mode=0o700)
    command('fallocate', '-l', str(disk_bytes), str(BASE / 'job.img'))
    os.chmod(BASE / 'job.img', 0o600)
    command('mkfs.ext4', '-q', '-F', '-m', '0', str(BASE / 'job.img'))
    command('mount', '-o', 'loop,nodev,nosuid', str(BASE / 'job.img'), str(BASE / 'job'))
    HOME.mkdir(mode=0o700)
    command('cp', '-a', '--', str(ROOTFS / 'opt/runner'), str(HOME / 'runner'))
    # Only trusted baseline files are traversed while root assigns ownership.
    command('chown', '-R', f"{config['uid']}:{config['uid']}", str(HOME))
    network_start(config)
    witnesses_start()
    command('systemctl', 'reset-failed', manager_unit(config), check=False)
    command('systemctl', 'start', manager_unit(config))
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        try:
            if inside(config, 'systemctl', '--user', 'is-active', 'default.target', check=False).returncode == 0:
                break
        except BoundaryError:
            pass
        time.sleep(1)
    else:
        raise BoundaryError('user-manager-start-timeout')
    uid_status = Path(f'/proc/{manager_pid(config)}/status').read_text()
    if 'NoNewPrivs:\t0' not in uid_status:
        raise BoundaryError('mapping-helpers-blocked-by-no-new-privileges')
    witnesses_verify(config)


def run_one(config, token, repo, job_id):
    prepare(config)
    name = 'web-app-ci-job-' + os.urandom(16).hex()
    state = {'repo': repo, 'runner_id': None, 'runner_name': name, 'job_id': job_id}
    save_state(state)
    try:
        response = api(token, repo, 'actions/runners/generate-jitconfig', 'POST',
                       {'name': name, 'runner_group_id': 1, 'labels': sorted(LABELS), 'work_folder': '_work'})
    except BoundaryError as error:
        if str(error) == 'runner-registration-rejected':
            save_state({})
        raise
    runner = response.get('runner') if type(response) is dict else None
    if (type(runner) is not dict or type(runner.get('id')) is not int or runner['id'] <= 0
            or runner.get('name') != name or type(response.get('encoded_jit_config')) is not str
            or not response['encoded_jit_config']):
        raise BoundaryError('invalid-job-jit-registration')
    state['runner_id'] = runner['id']
    save_state(state)
    jit_path = HOME / 'jit-config'
    with jit_path.open('x') as stream:
        stream.write(response['encoded_jit_config'])
    os.chmod(jit_path, 0o600)
    os.chown(jit_path, config['uid'], config['uid'])
    del response
    inside(config, 'systemctl', '--user', 'start', 'web-app-job.service')
    print(f'job-started repo={repo} observed-job={job_id}', flush=True)
    deadline = time.monotonic() + config['job_timeout_seconds']
    while not STOP and time.monotonic() < deadline:
        active = inside(config, 'systemctl', '--user', 'is-active', 'web-app-job.service', check=False)
        if active.stdout.strip() not in ('active', 'activating'):
            return
        time.sleep(5)
    raise BoundaryError('job-runtime-bound-exceeded-or-controller-stopped')


def serve(config):
    if not repositories(config):
        raise BoundaryError('registered-project-required')
    credentials_dir = os.environ.get('CREDENTIALS_DIRECTORY')
    if not credentials_dir:
        raise BoundaryError('systemd-controller-credential-required')
    token = app_credentials(Path(credentials_dir) / 'github-app-key')
    cleanup(config, token)
    receipt = json.loads(protected_file(BASE / 'validation.json'))
    if (receipt.get('configuration_sha256') != config_digest() or receipt.get('passed') is not True
            or receipt.get('boundary_sha256') != boundary_digest(config)
            or receipt.get('boot_id') != Path('/proc/sys/kernel/random/boot_id').read_text().strip()):
        raise BoundaryError('current-configuration-not-validated')
    while not STOP:
        try:
            candidate = find_job(token)
            if candidate:
                try:
                    run_one(config, token, *candidate)
                finally:
                    cleanup(config, token)
            else:
                time.sleep(config['poll_seconds'])
        except BoundaryError as error:
            print(f'controller-stopped reason={error}', flush=True)
            raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=['serve', 'validate', 'cleanup', 'check-config'])
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise BoundaryError('root-controller-required')
    config = load_config()
    if args.operation == 'check-config':
        print('configuration-valid')
        return
    Path('/run/web-app-ci').mkdir(mode=0o700, exist_ok=True)
    with Path('/run/web-app-ci/controller.lock').open('w') as lock:
        os.chmod(lock.name, 0o600)
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args.operation == 'serve':
            serve(config)
        elif args.operation == 'cleanup':
            cleanup(config)
        else:
            from validation import validate
            validate(config)


def stop_requested(_signal, _frame):
    global STOP
    STOP = True


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, stop_requested)
    signal.signal(signal.SIGINT, stop_requested)
    try:
        main()
    except (BoundaryError, OSError, ValueError, KeyError, subprocess.TimeoutExpired):
        # Never render API data, process arguments or an untrusted exception.
        print('controller-operation-failed; inspect root-only state and fixed-code journal', file=sys.stderr)
        sys.exit(1)
