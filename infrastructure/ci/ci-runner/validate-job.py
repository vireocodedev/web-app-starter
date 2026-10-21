#!/usr/bin/env python3
"""Runs as the disposable UID without GitHub or deployment credentials."""
from contextlib import contextmanager
import ctypes
import errno
import fcntl
import json
import os
from pathlib import Path
import re
import select
import signal
import socket
import stat
import subprocess
import struct
import time
from urllib.parse import urlencode

PG = 'postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c'
RYUK = 'testcontainers/ryuk:0.14.0@sha256:7c1a8a9a47c780ed0f983770a662f80deb115d95cce3e2daa3d12115b8cd28f0'
RESULT = Path('/home/web-app-ci/validation-result.json')
checks = []
stage = 'initialization'


def require(condition, name):
    if not condition:
        raise RuntimeError(name)
    checks.append(name)


def run(*args, timeout=120, check=True):
    result = subprocess.run(args, text=True, capture_output=True, timeout=timeout)
    if check and result.returncode:
        raise RuntimeError('probe-command-failed')
    return result


def blocked(address, port):
    try:
        with socket.create_connection((address, port), timeout=2):
            return False
    except OSError:
        return True


def mounted_paths():
    paths = {}
    for line in Path('/proc/self/mountinfo').read_text().splitlines():
        fields = line.split()
        mountpoint = re.sub(r'\\([0-7]{3})', lambda match: chr(int(match[1], 8)), fields[4])
        paths[mountpoint] = set(fields[5].split(','))
    return paths


def toolchain_policy():
    # Run these commands in the actual validation user's current directory,
    # with its real PATH/HOME and filesystem permissions.
    home = Path('/home/web-app-ci')
    require(os.environ.get('HOME') == str(home), 'toolchain-private-home-environment')
    directories = (home, home / '.npm', home / '.gradle')
    created = []
    probes = []
    try:
        for path in directories:
            if path != home and not path.exists() and not path.is_symlink():
                path.mkdir(mode=0o700)
                created.append(path)
            information = path.lstat()
            require(stat.S_ISDIR(information.st_mode) and information.st_uid == os.getuid()
                    and information.st_gid == os.getgid() and stat.S_IMODE(information.st_mode) == 0o700,
                    'toolchain-private-directory:' + str(path))
            require(not os.statvfs(path).f_flag & os.ST_RDONLY, 'toolchain-private-directory-writable:' + str(path))
            probe = path / f'.web-app-toolchain-probe-{os.getpid()}'
            stream = probe.open('x')
            probes.append(probe)
            with stream:
                stream.write('credential-free-toolchain-cache-probe')
            require(probe.read_text() == 'credential-free-toolchain-cache-probe',
                    'toolchain-private-write-positive:' + str(path))
        require(run('/opt/node/bin/node', '--version', timeout=10).stdout.strip() == 'v24.18.1',
                'actual-ci-user-pinned-node-positive')
        require(run('/opt/node/bin/npm', '--version', timeout=30).stdout.strip() == '12.0.2',
                'actual-ci-user-pinned-npm-positive')
        java = run('/opt/jdk/bin/java', '-version', timeout=15)
        require(re.search(r'^(?:openjdk|java) version "25\.0\.4\.1"(?:\s|$)', java.stderr, re.MULTILINE) is not None,
                'actual-ci-user-pinned-java-positive')
    finally:
        for probe in probes:
            probe.unlink(missing_ok=True)
        # Remove only empty directories created by this probe; npm's legitimate
        # own cache contents, if any, remain inside the disposable private HOME.
        for path in reversed(created):
            try:
                path.rmdir()
            except OSError as error:
                if error.errno != errno.ENOTEMPTY:
                    raise


def ryuk_reaper(socket_path):
    require(os.environ.get('TESTCONTAINERS_RYUK_CONTAINER_PRIVILEGED') == 'false',
            'ryuk-unprivileged-environment')
    require(socket_path == f'/run/user/{os.getuid()}/docker.sock', 'ryuk-exact-private-daemon-socket')
    information = Path(socket_path).lstat()
    require(stat.S_ISSOCK(information.st_mode) and information.st_uid == os.getuid(),
            'ryuk-private-daemon-socket-owner')
    nonce = os.urandom(16).hex()
    label = 'web-app.ci.ryuk.probe=' + nonce
    reaper = fixture = network = sentinel = client = None

    def identifier(result):
        value = result.stdout.strip()
        require(re.fullmatch(r'[0-9a-f]{64}', value) is not None, 'ryuk-tracked-resource-id')
        return value

    def present(kind, value, timeout=10):
        # A successful inventory query proves absence; arbitrary inspect errors
        # must never be interpreted as successful reaping.
        args = ['docker', kind, 'ls', '--no-trunc']
        if kind == 'container':
            args.append('--all')
        args.extend(['--filter', 'id=' + value, '--format', '{{.ID}}'])
        found = run(*args, timeout=timeout).stdout.strip()
        if found not in ('', value):
            raise RuntimeError('ryuk-exact-resource-inventory')
        return found == value

    try:
        reaper = identifier(run('docker', 'run', '-d', '--rm', '--network', 'bridge',
                                '--memory', '64m', '--memory-swap', '64m', '--cpus', '0.25',
                                '--pids-limit', '64', '-v', f'{socket_path}:/var/run/docker.sock:rw',
                                '-p', '127.0.0.1::8080', RYUK))
        configuration = json.loads(run('docker', 'inspect', reaper).stdout)[0]
        host = configuration['HostConfig']
        require(host['Privileged'] is False and host['NetworkMode'] == 'bridge'
                and host['AutoRemove'] is True, 'ryuk-unprivileged-bridge-autoremove')
        require(configuration['Config']['Image'] == RYUK, 'ryuk-pinned-image')
        mounts = configuration['Mounts']
        require(len(mounts) == 1 and mounts[0]['Type'] == 'bind'
                and mounts[0]['Source'] == socket_path and mounts[0]['Destination'] == '/var/run/docker.sock'
                and mounts[0]['RW'] is True, 'ryuk-exact-own-socket-bind')
        bindings = configuration['NetworkSettings']['Ports']['8080/tcp']
        require(len(bindings) == 1 and bindings[0]['HostIp'] == '127.0.0.1'
                and bindings[0]['HostPort'].isdigit(), 'ryuk-loopback-only-port')
        port = int(bindings[0]['HostPort'])
        require(0 < port < 65536, 'ryuk-valid-published-port')
        # Match Testcontainers' Started-log wait: Docker's published port can
        # accept a connection before Ryuk's own listener is ready.
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            status = json.loads(run('docker', 'inspect', reaper, timeout=5).stdout)[0]['State']
            if status['Running'] is not True or status['OOMKilled'] is not False:
                raise RuntimeError('ryuk-stopped-or-oom-before-handshake')
            logs = run('docker', 'logs', '--tail', '100', reaper, timeout=5)
            output = logs.stdout + '\n' + logs.stderr
            if len(output) > 65536:
                raise RuntimeError('ryuk-readiness-log-bound')
            if re.search(r'\bStarted\b', output) is not None:
                checks.append('ryuk-running-without-oom-before-handshake')
                checks.append('ryuk-started-log-readiness-positive')
                break
            time.sleep(0.25)
        else:
            raise RuntimeError('ryuk-started-log-readiness-timeout')
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            try:
                client = socket.create_connection(('127.0.0.1', port), timeout=2)
                break
            except OSError:
                time.sleep(0.25)
        require(client is not None, 'ryuk-loopback-connection-positive')
        client.settimeout(5)
        client.sendall((urlencode({'label': label}) + '\n').encode('ascii'))
        acknowledgement = b''
        while b'\n' not in acknowledgement and len(acknowledgement) < 64:
            received = client.recv(64 - len(acknowledgement))
            require(bool(received), 'ryuk-protocol-no-premature-eof')
            acknowledgement += received
        require(acknowledgement == b'ACK\n', 'ryuk-filter-protocol-acknowledged')
        # ACK alone is insufficient: upstream also acknowledges invalid filters.
        # Keep this connection alive until all positive/control fixtures exist.
        network = identifier(run('docker', 'network', 'create', '--driver', 'bridge', '--label', label,
                                 'web-app-ryuk-fixture-' + nonce))
        sentinel = identifier(run('docker', 'network', 'create', '--driver', 'bridge', '--label',
                                  'web-app.ci.ryuk.probe=unmatched-' + nonce, 'web-app-ryuk-control-' + nonce))
        for value, expected in ((network, nonce), (sentinel, 'unmatched-' + nonce)):
            configuration = json.loads(run('docker', 'network', 'inspect', value).stdout)[0]
            require(configuration['Driver'] == 'bridge'
                    and configuration['Labels'].get('web-app.ci.ryuk.probe') == expected,
                    'ryuk-bridge-network-exact-label')
        fixture = identifier(run('docker', 'run', '-d', '--network', network, '--label', label,
                                 '--memory', '64m', '--memory-swap', '64m', '--cpus', '0.25',
                                 '--pids-limit', '32', '--entrypoint', '/bin/sleep', PG, '3600'))
        configuration = json.loads(run('docker', 'inspect', fixture).stdout)[0]
        require(configuration['State']['Running'] is True and configuration['HostConfig']['AutoRemove'] is False,
                'ryuk-live-fixture-without-autoremove')
        require(configuration['HostConfig']['NetworkMode'] == network
                and configuration['Config']['Labels'].get('web-app.ci.ryuk.probe') == nonce,
                'ryuk-fixture-network-and-label')
        time.sleep(0.5)
        require(present('container', fixture) and present('network', network) and present('network', sentinel),
                'ryuk-held-connection-resources-survive')
        require(json.loads(run('docker', 'inspect', fixture).stdout)[0]['State']['Running'] is True,
                'ryuk-held-connection-fixture-running')
        client.close()
        client = None
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            remaining = max(0.1, min(5, (deadline - time.monotonic()) / 3))
            if not present('network', sentinel, timeout=remaining):
                raise RuntimeError('ryuk-unmatched-control-lost')
            fixture_present = present('container', fixture, timeout=remaining)
            network_present = present('network', network, timeout=remaining)
            if not fixture_present and not network_present:
                break
            time.sleep(0.5)
        else:
            raise RuntimeError('ryuk-functional-reaping-timeout')
        require(not fixture_present and not network_present, 'ryuk-matching-container-and-network-reaped')
        require(present('network', sentinel), 'ryuk-unmatched-control-survives-reaping')
    finally:
        if client is not None:
            client.close()
        # Never prune by label or remove an untracked resource, even on failure.
        for value in (reaper, fixture):
            if value is not None:
                run('docker', 'container', 'rm', '-f', value, timeout=15, check=False)
        for value in (network, sentinel):
            if value is not None:
                run('docker', 'network', 'rm', value, timeout=15, check=False)
        for kind, value in (('container', reaper), ('container', fixture),
                            ('network', network), ('network', sentinel)):
            if value is not None:
                require(not present(kind, value), 'ryuk-own-fixture-cleanup-complete')


@contextmanager
def unmapped_child():
    ready_read, ready_write = os.pipe()
    hold_read, hold_write = os.pipe()
    pid = os.fork()
    if pid == 0:
        os.close(ready_read)
        os.close(hold_write)
        try:
            libc = ctypes.CDLL(None, use_errno=True)
            if libc.unshare(0x10000000) != 0:  # CLONE_NEWUSER
                os.write(ready_write, b'F')
                os._exit(1)
            os.write(ready_write, b'R')
            os.close(ready_write)
            os.read(hold_read, 1)  # Stay alive until the parent finishes mapping.
            os._exit(0)
        except BaseException:
            os._exit(1)
    os.close(ready_write)
    os.close(hold_read)
    try:
        require(bool(select.select([ready_read], [], [], 5)[0]) and os.read(ready_read, 1) == b'R',
                'fresh-owned-usernamespace-positive')
        yield pid
    finally:
        os.close(ready_read)
        os.close(hold_write)
        # The child has not been reaped, so its PID cannot be reused here.
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        os.waitpid(pid, 0)


def mapper_authorization():
    uid, gid = os.getuid(), os.getgid()
    ranges = []
    for kind in ('uid', 'gid'):
        entries = [line.split(':') for line in Path('/etc/sub' + kind).read_text().splitlines()]
        own = [entry for entry in entries if entry[0] == 'web-app-ci']
        require(len(own) == 1 and int(own[0][2]) == 65536, 'dedicated-subordinate-range:' + kind)
        ranges.append(int(own[0][1]))
    require(uid != 0 and gid != 0, 'mapper-probe-is-unprivileged')
    # A dedicated positive child proves real namespace creation and both allowed maps.
    with unmapped_child() as pid:
        process = Path('/proc') / str(pid)
        require(not (process / 'uid_map').read_text().strip() and not (process / 'gid_map').read_text().strip(),
                'positive-child-starts-unmapped')
        (process / 'setgroups').write_text('deny\n')
        for kind, own, subordinate in (('uid', uid, ranges[0]), ('gid', gid, ranges[1])):
            run('/usr/bin/new' + kind + 'map', str(pid), '0', str(own), '1', '1', str(subordinate), '65536')
            actual = [list(map(int, line.split())) for line in (process / (kind + '_map')).read_text().splitlines()]
            require(actual == [[0, own, 1], [1, subordinate, 65536]], 'allowed-own-and-subordinate-map:' + kind)
    # Each hostile attempt gets another fresh live child and an initially empty map.
    for kind in ('uid', 'gid'):
        with unmapped_child() as pid:
            process = Path('/proc') / str(pid)
            mapping = process / (kind + '_map')
            before = mapping.read_text()
            require(not before.strip(), 'hostile-child-starts-unmapped:' + kind)
            (process / 'setgroups').write_text('deny\n')
            result = subprocess.run(['/usr/bin/new' + kind + 'map', str(pid), '0', '0', '1'],
                                    capture_output=True, text=True, timeout=10,
                                    env={**os.environ, 'LC_ALL': 'C', 'LANG': 'C'})
            expected = f'new{kind}map: {kind} range [0-1) -> [0-1) not allowed'
            require(result.returncode == 1 and result.stderr.strip() == expected,
                    'host-root-range-authorization-rejected:' + kind)
            require(mapping.read_text() == before, 'rejected-host-root-map-unchanged:' + kind)


def device_policy():
    mounts = mounted_paths()
    require('/dev' in mounts and 'ro' in mounts['/dev'], 'minimal-device-root-readonly-bind')
    require(os.statvfs('/dev').f_flag & os.ST_RDONLY, 'effective-minimal-device-root-readonly')
    require(not Path('/dev/pts').exists(), 'host-pty-tree-hidden')
    expected = {'/dev/null': (1, 3), '/dev/zero': (1, 5), '/dev/full': (1, 7), '/dev/random': (1, 8),
                '/dev/urandom': (1, 9), '/dev/tty': (5, 0), '/dev/net/tun': (10, 200)}
    for path, numbers in expected.items():
        information = os.lstat(path)
        require(stat.S_ISCHR(information.st_mode) and information.st_uid == 0
                and (os.major(information.st_rdev), os.minor(information.st_rdev)) == numbers,
                'expected-root-owned-basic-device:' + path)
    tun = '/dev/net/tun'
    require(tun in mounts and 'ro' in mounts[tun], 'tun-readonly-single-device-bind')
    require(stat.S_IMODE(os.lstat(tun).st_mode) == 0o666, 'tun-device-mode-positive')
    # Character-device I/O still works through a read-only bind; it cannot alter
    # the node. Namespace interface creation separately requires CAP_NET_ADMIN.
    descriptor = os.open(tun, os.O_RDWR | os.O_CLOEXEC)
    try:
        checks.append('tun-open-readwrite-positive')
        request = struct.pack('16sH22x', b'web-app-denied0', 0x0002 | 0x1000)  # IFF_TAP | IFF_NO_PI
        try:
            fcntl.ioctl(descriptor, 0x400454ca, request)  # TUNSETIFF on x86_64
        except OSError as error:
            require(error.errno == errno.EPERM, 'outer-namespace-tun-creation-permission-denied')
        else:
            raise RuntimeError('outer-namespace-created-tap')
    finally:
        os.close(descriptor)
    def fail(error):
        raise error
    for parent, _, names in os.walk('/dev', followlinks=False, onerror=fail):
        for name in names:
            path = str(Path(parent) / name)
            information = os.lstat(path)
            if not (stat.S_ISCHR(information.st_mode) or stat.S_ISBLK(information.st_mode)):
                continue
            require(path in expected and stat.S_ISCHR(information.st_mode)
                    and (os.major(information.st_rdev), os.minor(information.st_rdev)) == expected[path],
                    'visible-device-allowlist:' + path)


def filesystem_policy():
    mounts = mounted_paths()
    kinds = {}
    for line in Path('/proc/self/mountinfo').read_text().splitlines():
        fields = line.split()
        kinds[fields[4]] = fields[fields.index('-') + 1]
    for path in ('/sys', '/proc/sys', '/proc/irq', '/proc/bus'):
        require(path in mounts and 'ro' in mounts[path], 'root-relative-readonly-mount:' + path)
        require(os.statvfs(path).f_flag & os.ST_RDONLY, 'effective-readonly-filesystem:' + path)
    for path in ('/run/systemd/system', '/run/host'):
        require(path in mounts and 'ro' in mounts[path], 'private-systemd-runtime-readonly:' + path)
        require(os.statvfs(path).f_flag & os.ST_RDONLY, 'effective-systemd-runtime-readonly:' + path)
        information = os.lstat(path)
        require(stat.S_ISDIR(information.st_mode) and information.st_uid == 0,
                'private-systemd-runtime-root-owned:' + path)
    require(not list(Path('/run/systemd/system').iterdir()), 'private-empty-systemd-boot-marker')
    notify = '/run/host/notify'
    require(notify in mounts and 'ro' in mounts[notify], 'manager-notify-readonly-bind')
    information = os.lstat(notify)
    require(stat.S_ISSOCK(information.st_mode) and information.st_uid == 0,
            'manager-notify-socket-positive')
    # systemd can create a public os-release symlink; its backing stage is masked.
    require({p.name for p in Path('/run/host').iterdir()} <= {'notify', '.os-release-stage', 'os-release'},
            'private-host-runtime-allowlist')
    for path in ('/run/systemd/private', '/run/dbus/system_bus_socket', '/run/systemd/journal/socket',
                 '/run/host/private', '/run/host/system_bus_socket', '/run/host/journal'):
        require(not Path(path).exists(), 'host-management-or-log-socket-hidden:' + path)
    for path, size_mib in (('/tmp', 512), ('/var/tmp', 256), ('/dev/shm', 256)):
        require(kinds.get(path) == 'tmpfs', 'private-temporary-filesystem-type:' + path)
        information = os.lstat(path)
        require(information.st_uid == 0 and information.st_gid == 0
                and stat.S_IMODE(information.st_mode) == 0o1777,
                'private-temporary-filesystem-sticky-mode:' + path)
        capacity = os.statvfs(path)
        require(capacity.f_blocks * capacity.f_frsize == size_mib * 1024 ** 2,
                'private-temporary-filesystem-capacity:' + path)
    for path in ('/home/web-app-ci', f'/run/user/{os.getuid()}', '/tmp', '/var/tmp', '/dev/shm'):
        require(path in mounts and 'rw' in mounts[path], 'root-relative-writable-mount:' + path)
        require(not os.statvfs(path).f_flag & os.ST_RDONLY, 'effective-writable-filesystem:' + path)
        probe = Path(path) / f'.web-app-policy-probe-{os.getpid()}'
        with probe.open('x') as stream:
            stream.write('credential-free-write-probe')
        require(probe.read_text() == 'credential-free-write-probe', 'writable-path-positive:' + path)
        probe.unlink()
    denied = 0
    for path in ('/proc/kcore', '/proc/keys', '/proc/kmsg', '/sys/kernel/debug',
                 '/sys/kernel/security', '/sys/firmware', '/run/host/.os-release-stage'):
        try:
            information = os.lstat(path)
        except FileNotFoundError:
            # Optional systemd paths can be absent on this particular kernel.
            continue
        require(path in mounts and 'ro' in mounts[path], 'root-relative-inaccessible-mount:' + path)
        require(stat.S_IMODE(information.st_mode) == 0, 'inaccessible-mask-mode:' + path)
        try:
            if stat.S_ISDIR(information.st_mode):
                with os.scandir(path) as entries:
                    next(entries, None)
            else:
                with open(path, 'rb') as stream:
                    stream.read(1)
        except PermissionError:
            checks.append('inaccessible-path-read-denied:' + path)
            denied += 1
        else:
            raise RuntimeError('inaccessible-path-readable')
    require(denied >= 3, 'effective-inaccessible-masks-positive')


def rootless_context():
    uid = os.getuid()
    # This child belongs to the disposable daemon; enter it only as the ordinary
    # CI user, with no host-root helper and no cgroup namespace/ancestor exposure.
    path = Path(f'/run/user/{uid}/dockerd-rootless/child_pid')
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        information = os.fstat(descriptor)
        require(stat.S_ISREG(information.st_mode) and information.st_uid == uid
                and not information.st_mode & 0o022 and information.st_size <= 32,
                'rootless-child-pid-file-protected')
        text = os.read(descriptor, 33).decode('ascii')
    finally:
        os.close(descriptor)
    require(re.fullmatch(r'[1-9][0-9]*\n?', text) is not None, 'rootless-child-pid-valid')
    pid = int(text)
    process = Path('/proc') / str(pid)
    require(process.stat().st_uid == uid, 'rootless-child-process-owned')
    os.kill(pid, 0)
    for kind in ('uid', 'gid'):
        entry = next(line.split(':') for line in Path('/etc/sub' + kind).read_text().splitlines()
                     if line.startswith('web-app-ci:'))
        expected = [[0, uid, 1], [1, int(entry[1]), int(entry[2])]]
        actual = [list(map(int, line.split())) for line in (process / (kind + '_map')).read_text().splitlines()]
        require(actual == expected, 'rootless-child-kernel-map:' + kind)
    require((process / 'cgroup').read_text().strip() == f'0::/user.slice/user-{uid}.slice/docker.service',
            'rootless-child-private-docker-cgroup')
    environment = {'ROOTLESSKIT_PARENT_EUID': str(uid), 'XDG_RUNTIME_DIR': f'/run/user/{uid}',
                   'DBUS_SESSION_BUS_ADDRESS': f'unix:path=/run/user/{uid}/bus',
                   'LC_ALL': 'C', 'SYSTEMD_COLORS': '0'}
    return pid, environment


def bus_compatibility():
    uid = os.getuid()
    adapter = '/usr/local/lib/web-app-ci/runtime-bin/busctl'
    require(str(Path(adapter).parent) not in os.environ['PATH'].split(':'), 'bus-adapter-is-docker-scoped')
    pid, environment = rootless_context()
    def mapped(binary, *arguments, overrides=None, check=True):
        values = {**environment, **(overrides or {})}
        return run('/usr/bin/nsenter', '--target', str(pid), '--user', '--mount', '--net',
                   '/usr/bin/env', *(name + '=' + value for name, value in values.items()),
                   binary, *arguments, check=check, timeout=20)
    require(mapped('/usr/bin/busctl', '--user', '--no-pager', 'status').returncode == 0,
            'genuine-private-user-bus-positive')
    adapted = mapped(adapter, '--user', '--no-pager', 'status')
    require(adapted.stdout == f'OwnerUID={uid}\n' and not adapted.stderr,
            'mapped-private-bus-owner-positive')
    genuine = mapped('/usr/bin/busctl', '--version')
    passthrough = mapped(adapter, '--version')
    require((passthrough.returncode, passthrough.stdout, passthrough.stderr)
            == (genuine.returncode, genuine.stdout, genuine.stderr), 'bus-adapter-genuine-passthrough')
    for overrides in ({'ROOTLESSKIT_PARENT_EUID': str(uid + 1)},
                      {'DBUS_SESSION_BUS_ADDRESS': 'unix:path=/run/systemd/private'}):
        rejected = mapped(adapter, '--user', '--no-pager', 'status', overrides=overrides, check=False)
        require(rejected.returncode == 1 and not rejected.stdout
                and rejected.stderr == 'busctl-compat-private-environment-mismatch\n',
                'bus-adapter-conflicting-environment-rejected')
    rejected = run(adapter, '--user', '--no-pager', 'status', check=False)
    require(rejected.returncode == 1 and not rejected.stdout
            and rejected.stderr == 'busctl-compat-mapped-identity-required\n',
            'bus-adapter-outer-identity-rejected')


PROC_WITNESS = '/usr/local/lib/web-app-ci/proc-witness'
SYS_WITNESS = '/usr/local/lib/web-app-ci/sys-anchor/sysfs'
NET_CONTROL = '/proc/sys/net/ipv6/conf/all/disable_ipv6'

# Fixed x86_64 syscalls, identical to the successful credential-free server proof.
# Parse the valid modern subset-clear parameter before requiring EPERM, so a
# syntax error cannot stand in for a real privilege denial.
PROC_MUTATION_PROBE = '''import ctypes,errno,os,tempfile
lib=ctypes.CDLL(None,use_errno=True)
p=b'/usr/local/lib/web-app-ci/proc-witness'
rc=lib.mount(None,p,None,32|2|4|8|(1<<21),b'hidepid=0')
assert rc==-1 and ctypes.get_errno()==errno.EPERM
with tempfile.TemporaryDirectory(prefix='proc-denial.') as target:
    rc=lib.mount(b'proc',target.encode(),b'proc',2|4|8,None)
    assert rc==-1 and ctypes.get_errno()==errno.EPERM
fd=lib.syscall(433,-100,ctypes.c_char_p(p),1)
assert fd>=0
try:
    assert lib.syscall(431,fd,1,ctypes.c_char_p(b'subset'),ctypes.c_char_p(b','),0)==0
    rc=lib.syscall(431,fd,7,None,None,0)
    assert rc==-1 and ctypes.get_errno()==errno.EPERM
finally:
    os.close(fd)
'''

INITIAL_NET_PROBE = '''import errno,os
from pathlib import Path
p=Path('/proc/sys/net/ipv6/conf/all/disable_ipv6')
assert p.read_text().strip()=='1'
assert not os.statvfs(p).f_flag&os.ST_RDONLY
for path in ('/proc/sys','/proc/sys/kernel','/proc/sys/vm'):
    assert os.statvfs(path).f_flag&os.ST_RDONLY
try:
    fd=os.open(p,os.O_WRONLY)
except OSError as error:
    assert error.errno in (errno.EACCES,errno.EPERM)
else:
    os.close(fd)
    raise AssertionError('initial-CI-network-control-writable')
'''


def proc_witness_policy():
    entries = [line.split() for line in Path('/proc/self/mountinfo').read_text().splitlines()]
    matches = [entry for entry in entries if entry[4] == PROC_WITNESS]
    require(len(matches) == 1, 'proc-witness-single-mount')
    entry = matches[0]
    separator = entry.index('-')
    require(entry[3] == '/' and entry[separator + 1] == 'proc', 'proc-witness-complete-filesystem-root')
    require({'rw', 'nosuid', 'nodev', 'noexec', 'relatime'} <= set(entry[5].split(',')),
            'proc-witness-effective-mount-flags')
    options = set(entry[separator + 3].split(','))
    require('subset=pid' in options and bool({'hidepid=invisible', 'hidepid=2'} & options),
            'proc-witness-pid-only-invisible-view')
    require(not any(entry[4].startswith(PROC_WITNESS + '/') for entry in entries),
            'proc-witness-no-child-mounts')
    witness = Path(PROC_WITNESS)
    require(all(child.name.isdigit() or child.name in ('self', 'thread-self') for child in witness.iterdir()),
            'proc-witness-only-process-entries')
    require((witness / str(os.getpid()) / 'status').is_file(), 'proc-witness-own-process-positive')
    for name in ('1', '1/root', 'sys', 'irq', 'bus', 'kcore', 'keys', 'kmsg'):
        require(not (witness / name).exists(), 'proc-witness-host-or-global-hidden:' + name)


def single_id_child(uid, gid, inherited_mount):
    assert os.getuid() == 0 and os.geteuid() == 0 and os.getgid() == 0 and os.getegid() == 0
    for kind, own in (('uid', uid), ('gid', gid)):
        actual = [list(map(int, line.split()))
                  for line in Path('/proc/self/' + kind + '_map').read_text().splitlines()]
        assert actual == [[0, own, 1]]
    assert Path('/proc/self/setgroups').read_text().strip() == 'deny'
    assert Path('/proc/self/ns/mnt').readlink() == inherited_mount
    status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
    assert int(status['CapEff'].strip(), 16) & (1 << 21)  # Child-userns CAP_SYS_ADMIN.
    libc = ctypes.CDLL(None, use_errno=True)
    result = libc.unshare(0x00020000)  # Only CLONE_NEWNS; mappings already proved.
    if result == -1:
        assert ctypes.get_errno() == errno.EPERM
        return b'D'
    assert result == 0 and Path('/proc/self/ns/mnt').readlink() != inherited_mount
    descriptor = os.open('/proc/self/ns/mnt', os.O_RDONLY | os.O_CLOEXEC)
    try:
        owner = fcntl.ioctl(descriptor, 0xb701)  # NS_GET_USERNS returns a new FD.
        try:
            expected = Path('/proc/self/ns/user').stat()
            actual = os.fstat(owner)
            assert (actual.st_dev, actual.st_ino) == (expected.st_dev, expected.st_ino)
        finally:
            os.close(owner)
    finally:
        os.close(descriptor)
    run('/usr/bin/python3', '-I', '-c', PROC_MUTATION_PROBE, timeout=15)
    return b'P'


def single_id_proc_denials():
    uid, gid = os.getuid(), os.getgid()
    status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
    require(60000 <= uid <= 65000 and gid == uid and os.geteuid() == uid and os.getegid() == gid
            and all(int(status[field].strip(), 16) == 0 for field in ('CapEff', 'CapPrm', 'CapAmb')),
            'single-id-parent-is-ordinary-ci-user')
    inherited_mount = Path('/proc/self/ns/mnt').readlink()
    ready_read, ready_write = os.pipe()
    hold_read, hold_write = os.pipe()
    outcome_read, outcome_write = os.pipe()
    pid = os.fork()
    if pid == 0:
        os.close(ready_read)
        os.close(hold_write)
        os.close(outcome_read)
        try:
            libc = ctypes.CDLL(None, use_errno=True)
            assert libc.unshare(0x10000000) == 0  # CLONE_NEWUSER.
            os.write(ready_write, b'R')
            os.close(ready_write)
            assert os.read(hold_read, 1) == b'R'
            os.close(hold_read)
            os.write(outcome_write, single_id_child(uid, gid, inherited_mount))
            os._exit(0)
        except BaseException:
            os._exit(1)
    os.close(ready_write)
    os.close(hold_read)
    os.close(outcome_write)
    reaped = False
    try:
        require(bool(select.select([ready_read], [], [], 5)[0]) and os.read(ready_read, 1) == b'R',
                'fresh-single-id-usernamespace-positive')
        process = Path('/proc') / str(pid)
        require(process.stat().st_uid == uid
                and not (process / 'uid_map').read_text().strip()
                and not (process / 'gid_map').read_text().strip(), 'single-id-owned-child-starts-unmapped')
        for name, value in (('setgroups', 'deny\n'), ('uid_map', f'0 {uid} 1\n'), ('gid_map', f'0 {gid} 1\n')):
            (process / name).write_text(value)
        os.write(hold_write, b'R')
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            completed, status = os.waitpid(pid, os.WNOHANG)
            if completed:
                reaped = True
                require(os.waitstatus_to_exitcode(status) == 0, 'single-id-child-policy-probes-completed')
                break
            time.sleep(0.05)
        else:
            raise RuntimeError('single-id-child-timeout')
        outcome = os.read(outcome_read, 2)
        require(outcome in (b'D', b'P'), 'single-id-guarded-mapping-and-namespace-outcome')
        checks.append('fresh-single-id-mountnamespace-creation-denied' if outcome == b'D'
                      else 'fresh-single-id-namespace-proc-mutations-denied')
    finally:
        os.close(ready_read)
        os.close(hold_write)
        os.close(outcome_read)
        if not reaped:
            # Until waitpid reaps it, this owned child PID cannot be reused.
            try:
                os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            os.waitpid(pid, 0)


def api_witnesses():
    proc_witness_policy()
    anchor = Path(SYS_WITNESS).parent.lstat()
    require(anchor.st_uid == 0 and anchor.st_gid == 0 and stat.S_IMODE(anchor.st_mode) == 0o700,
            'sysfs-witness-initial-root-only-anchor')
    try:
        os.listdir(SYS_WITNESS)
    except OSError as error:
        require(error.errno == errno.EACCES, 'ordinary-sysfs-witness-traversal-denied')
    else:
        raise RuntimeError('ordinary-sysfs-witness-readable')
    require(run('/usr/bin/python3', '-I', '-c', INITIAL_NET_PROBE).returncode == 0,
            'ordinary-initial-network-writes-denied-global-controls-readonly')
    pid, _ = rootless_context()
    # Inherit the original CI network here: child-userns capabilities must not
    # authorize writes to the initial-userns-owned CI network namespace.
    require(run('/usr/bin/nsenter', '--target', str(pid), '--user', '--mount',
                '/usr/bin/python3', '-I', '-c', INITIAL_NET_PROBE).returncode == 0,
            'mapped-initial-network-writes-denied')
    child_sysfs = ('import ctypes,errno,tempfile; lib=ctypes.CDLL(None,use_errno=True); '
                   'd=tempfile.TemporaryDirectory(); '
                   'rc=lib.mount(b"sysfs",d.name.encode(),b"sysfs",2|4|8,None); '
                   'assert rc==-1 and ctypes.get_errno()==errno.EPERM')
    mapped = PROC_MUTATION_PROBE + '''
from pathlib import Path
import subprocess
assert os.geteuid()==0
try:
    os.listdir('/usr/local/lib/web-app-ci/sys-anchor/sysfs')
except OSError as error:
    assert error.errno==errno.EACCES
else:
    raise AssertionError('mapped-sysfs-witness-readable')
for flags in (32|2|4|8|(1<<21),32|4096|2|4|8|(1<<21)):
    rc=lib.mount(None,b'/usr/local/lib/web-app-ci/sys-anchor/sysfs',None,flags,None)
    assert rc==-1 and ctypes.get_errno()==errno.EACCES
result=subprocess.run(['/usr/bin/unshare','--net','/usr/bin/python3','-I','-c',CHILD_SYSFS],
                      capture_output=True,timeout=20)
assert result.returncode==0
p=Path('/proc/sys/net/ipv6/conf/all/disable_ipv6')
value=p.read_text()
p.write_text(value)
assert p.read_text()==value
assert not Path('/usr/local/lib/web-app-ci/proc-witness/1').exists()
'''.replace('CHILD_SYSFS', repr(child_sysfs))
    require(run('/usr/bin/nsenter', '--target', str(pid), '--user', '--mount', '--net',
                '/usr/bin/python3', '-I', '-c', mapped, timeout=45).returncode == 0,
            'mapped-proc-mutations-and-sysfs-access-denied-owned-network-write-positive')
    # A fresh single-ID namespace is checked separately from RootlessKit's
    # mandatory successful mount-namespace path above.
    single_id_proc_denials()
    proc_witness_policy()
    require(run('/usr/bin/python3', '-I', '-c', INITIAL_NET_PROBE).returncode == 0,
            'outer-network-control-unchanged-after-child-probes')


def main():
    global stage
    stage = 'filesystem'
    require(Path('/etc/web-app-ci-boundary').read_text().strip() == 'web-app-ci-minimal-rootfs', 'minimal-root-positive')
    filesystem_policy()
    for path in ('/srv/web-app', '/srv/applications', '/etc/caddy', '/root/.ssh',
                 '/etc/web-app-ci/github-app.pem', '/etc/web-app-ci/github-app.json',
                 '/var/run/docker.sock', '/run/docker.sock',
                 '/var/lib/web-app-ci-host-canary'):
        require(not Path(path).exists(), 'host-path-hidden:' + path)
    require(not os.access('/proc/1/root', os.R_OK), 'host-pid-one-root-hidden')
    require(set(os.getgroups()) <= {os.getuid()}, 'no-privileged-groups')
    status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
    for field in ('CapEff', 'CapPrm', 'CapAmb'):
        require(int(status[field].strip(), 16) == 0, 'ordinary-ci-process-no-capabilities:' + field)
    stage = 'toolchain'
    toolchain_policy()
    stage = 'devices'
    device_policy()
    stage = 'mapper-authorization'
    mapper_authorization()
    stage = 'docker-info'
    require(run('docker', 'info', '--format', '{{json .SecurityOptions}}').stdout.find('rootless') >= 0, 'rootless-daemon')
    require(run('docker', 'info', '--format', '{{.CgroupDriver}}').stdout.strip() == 'systemd', 'docker-systemd-cgroups')
    require(run('docker', 'info', '--format', '{{.CgroupVersion}}').stdout.strip() == '2', 'docker-cgroup-v2')
    information = json.loads(run('docker', 'info', '--format', '{{json .}}').stdout)
    for field in ('MemoryLimit', 'SwapLimit', 'PidsLimit', 'CpuCfsQuota', 'CPUSet'):
        require(information.get(field) is True, 'docker-resource-controller-positive:' + field)
    stage = 'bus-compatibility'
    bus_compatibility()
    stage = 'api-witnesses'
    api_witnesses()
    # Positive egress controls prevent interpreting a completely broken network as isolation.
    stage = 'public-egress'
    for url in ('https://api.github.com/meta', 'https://registry.npmjs.org/npm',
                'https://repo.maven.apache.org/maven2/org/postgresql/postgresql/maven-metadata.xml'):
        require(run('curl', '--fail', '--silent', '--show-error', '--max-time', '30', '-o', '/dev/null', url).returncode == 0,
                'public-https-positive:' + url)
    host_ips = json.loads(Path('/home/web-app-ci/validation-input.json').read_text())['host_public_ipv4']
    stage = 'network-denials'
    for address in ['10.203.241.1', '169.254.169.254', '10.0.0.1', '172.17.0.1', '192.168.1.1', *host_ips]:
        for port in (22, 80, 443, 2019, 5432, 8081):
            require(blocked(address, port), f'host-or-private-denied:{address}:{port}')
    require(Path('/proc/sys/net/ipv6/conf/all/disable_ipv6').read_text().strip() == '1', 'outer-ipv6-disabled')
    # Even privileged containers and Docker bind mounts see the minimal outer root.
    stage = 'privileged-container'
    require(run('docker', 'run', '--rm', '--privileged', '--network', 'host', '-v', '/:/outer:ro', PG,
                'bash', '-ceu', 'test -f /outer/etc/web-app-ci-boundary; test ! -e /outer/var/lib/web-app-ci-host-canary; '
                'test ! -e /outer/srv/web-app; test ! -e /outer/etc/web-app-ci/github-app.pem; '
                'test ! -e /outer/etc/web-app-ci/github-app.json; '
                'test ! -S /outer/run/docker.sock; test ! -S /outer/var/run/docker.sock', timeout=240).returncode == 0,
            'docker-bind-and-privileged-container-contained')
    host_pid = run('docker', 'run', '--rm', '--privileged', '--pid=host', '--network', 'host', PG,
                   'bash', '-ceu', 'test ! -e /proc/1/root; test ! -e /proc/1/cgroup', timeout=90, check=False)
    require(host_pid.returncode == 0 or (host_pid.returncode == 125
            and 'error mounting "proc"' in host_pid.stderr and 'operation not permitted' in host_pid.stderr),
            'privileged-host-pid-container-contained-or-proc-mount-denied')
    socket_path = os.environ['DOCKER_HOST'].removeprefix('unix://')
    stage = 'ryuk'
    ryuk_reaper(socket_path)
    # Real Testcontainers-shaped local DB: random published loopback port and
    # access to this disposable daemon socket, no host production database.
    stage = 'testcontainers'
    run('docker', 'run', '--rm', '-v', f'{socket_path}:/ci.sock:ro', PG,
        'bash', '-ceu', 'test -S /ci.sock')
    run('docker', 'run', '-d', '--name', 'web-app-boundary-postgres', '--memory', '256m',
        '--memory-swap', '256m', '--cpus', '0.5', '--pids-limit', '64',
        '-p', '127.0.0.1::5432', '-e', 'POSTGRES_PASSWORD=disposable-probe-only', PG)
    try:
        require(run('docker', 'exec', 'web-app-boundary-postgres', 'bash', '-ceu',
                    'test "$(cat /sys/fs/cgroup/memory.max)" = 268435456; '
                    'test "$(cat /sys/fs/cgroup/memory.swap.max)" = 0; '
                    'test "$(cat /sys/fs/cgroup/pids.max)" = 64; '
                    'read -r quota period < /sys/fs/cgroup/cpu.max; '
                    'test "$quota" != max; test "$((quota * 2))" = "$period"').returncode == 0,
                'disposable-container-kernel-resource-limits-positive')
        port = int(run('docker', 'port', 'web-app-boundary-postgres', '5432/tcp').stdout.strip().rsplit(':', 1)[1])
        deadline = time.monotonic() + 45
        while time.monotonic() < deadline:
            if run('docker', 'exec', 'web-app-boundary-postgres', 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres', check=False).returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError('postgres-readiness')
        with socket.create_connection(('127.0.0.1', port), timeout=5):
            checks.append('disposable-postgres-loopback-port-positive')
        run('docker', 'exec', 'web-app-boundary-postgres', 'psql', '-U', 'postgres', '-c', 'SELECT 1')
    finally:
        run('docker', 'rm', '-f', 'web-app-boundary-postgres', check=False)
    # Persistent user services, daemonized processes and containers must disappear
    # when the ROOT controller stops the entire user manager and UID.
    stage = 'abandoned-children'
    run('systemd-run', '--user', '--unit=web-app-abandoned-probe', '--', '/usr/bin/sleep', '3600')
    run('docker', 'run', '-d', '--name', 'web-app-abandoned-container', PG, 'sleep', '3600')
    Path('/home/web-app-ci/previous-job-marker').write_text('must-not-survive')
    for path in ('/tmp', '/var/tmp', '/dev/shm'):
        (Path(path) / 'previous-job-marker').write_text('must-not-survive')


try:
    main()
    RESULT.write_text(json.dumps({'passed': True, 'checks': checks, 'stage': 'complete'}))
except Exception:
    # No framework command output or credential-shaped values are retained.
    RESULT.write_text(json.dumps({'passed': False, 'checks': checks, 'stage': stage, 'error': 'boundary-probe-failed'}))
    raise SystemExit(1)
