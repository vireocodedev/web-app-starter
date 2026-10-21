"""Root half of credential-free validation; invokes only baseline probe code."""
import errno
import json
import os
from pathlib import Path
import socket
import stat
import tempfile
import time
import controller as ctl


def retain_failure(config, stage, error):
    # Fixed fields only: never persist framework stderr, job logs or exception text.
    payload = {'passed': False, 'stage': stage, 'recorded_at_epoch': int(time.time()),
               'error_kind': 'boundary' if isinstance(error, ctl.BoundaryError) else 'local'}
    try:
        descriptor = os.open(ctl.HOME / 'validation-result.json', os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(descriptor, 'r') as stream:
            information = os.fstat(stream.fileno())
            if not stat.S_ISREG(information.st_mode) or information.st_uid != config['uid'] or information.st_size > 65536:
                raise ValueError('invalid probe result metadata')
            result = json.loads(stream.read(65537))
        stages = {'initialization', 'filesystem', 'toolchain', 'devices', 'mapper-authorization', 'docker-info',
                  'public-egress', 'network-denials', 'privileged-container', 'ryuk', 'testcontainers',
                  'bus-compatibility', 'api-witnesses', 'abandoned-children', 'complete'}
        if isinstance(result, dict) and result.get('stage') in stages:
            payload['user_stage'] = result['stage']
            if isinstance(result.get('checks'), list) and len(result['checks']) <= 512:
                payload['user_check_count'] = len(result['checks'])
                # Probe check names are fixed source codes, never exception or
                # job text. Persist only bounded ASCII identifiers.
                import re
                checks = result['checks']
                if checks and type(checks[-1]) is str and re.fullmatch(r'[a-z0-9_-]{1,100}', checks[-1]):
                    payload['last_completed_check'] = checks[-1]
    except (OSError, ValueError, TypeError):
        pass
    try:
        text = ctl.inside(config, 'systemctl', '--user', 'show', 'docker.service', '-p', 'Result',
                          '-p', 'ExecMainStatus', timeout=5, check=False).stdout
        values = dict(line.split('=', 1) for line in text.splitlines() if '=' in line)
        if values.get('Result') in {'success', 'exit-code', 'signal', 'core-dump', 'timeout',
                                    'resources', 'start-limit-hit', 'oom-kill', 'protocol'}:
            payload['docker_result'] = values['Result']
        if values.get('ExecMainStatus', '').isdigit() and 0 <= int(values['ExecMainStatus']) <= 255:
            payload['docker_exit_status'] = int(values['ExecMainStatus'])
    except Exception:
        pass
    with tempfile.NamedTemporaryFile(mode='w', dir=ctl.BASE, prefix='.validation-failure.', delete=False) as stream:
        temporary = Path(stream.name)
        os.chmod(temporary, 0o600)
        json.dump(payload, stream)
    temporary.replace(ctl.BASE / 'validation-failure.json')


def device_policy(config):
    ctl.minimal_devices()
    information = Path('/dev/net/tun').lstat()
    if not stat.S_ISCHR(information.st_mode) or information.st_uid != 0 or information.st_gid != 0 \
            or (os.major(information.st_rdev), os.minor(information.st_rdev)) != (10, 200):
        raise ctl.BoundaryError('host-tun-device-metadata-mismatch')
    unit = ctl.manager_unit(config)
    if ctl.command('systemctl', 'show', unit, '-p', 'DevicePolicy', '--value').stdout.strip() != 'closed':
        raise ctl.BoundaryError('manager-device-policy-not-closed')
    if ctl.command('systemctl', 'show', unit, '-p', 'DeviceAllow', '--value').stdout.strip() != '/dev/net/tun rw':
        raise ctl.BoundaryError('manager-explicit-device-allowlist-mismatch')
    capabilities = ctl.command('systemctl', 'show', unit, '-p', 'CapabilityBoundingSet', '--value').stdout.split()
    if set(capabilities) != {'cap_setuid', 'cap_setgid'}:
        raise ctl.BoundaryError('manager-capability-bound-too-broad')
    synthetic = (ctl.BASE / 'minimal-dev').stat()
    # Identity defeats both a hidden host devtmpfs and an unrelated empty directory.
    probe = ('import os; from pathlib import Path; '
             f"s=os.stat('/dev'); assert (s.st_dev,s.st_ino)==({synthetic.st_dev},{synthetic.st_ino}); "
             "assert os.statvfs('/dev').f_flag & os.ST_RDONLY; "
             "assert not Path('/dev/pts').exists()")
    ctl.inside(config, 'python3', '-c', probe)
    nodes = ('/dev/null', '/dev/zero', '/dev/full', '/dev/random', '/dev/urandom', '/dev/tty', '/dev/net/tun')
    identity = {path: (os.stat(path).st_dev, os.stat(path).st_ino, os.stat(path).st_rdev) for path in nodes}
    probe = (f'import os; expected={identity!r}; '
             'assert all((os.stat(p).st_dev,os.stat(p).st_ino,os.stat(p).st_rdev)==value '
             'for p,value in expected.items())')
    ctl.inside(config, 'python3', '-c', probe)


def cleanup_validation(config, stage):
    try:
        ctl.cleanup(config)
    except Exception as error:
        retain_failure(config, stage, error)
        raise


def baseline_privileges():
    ctl.mapping_helpers()
    allowed = {ctl.ROOTFS / 'usr/bin/newuidmap', ctl.ROOTFS / 'usr/bin/newgidmap'}
    def fail(error):
        raise error
    # One-time credential-free scan; ordinary job admission checks only the mappers.
    for parent, _, names in os.walk(ctl.ROOTFS, followlinks=False, onerror=fail):
        for name in names:
            path = Path(parent) / name
            information = path.lstat()
            if not stat.S_ISREG(information.st_mode):
                continue
            if information.st_mode & 0o6000:
                raise ctl.BoundaryError('unexpected-baseline-setuid-or-setgid-file')
            try:
                os.getxattr(path, 'security.capability')
            except OSError as error:
                if error.errno != errno.ENODATA:
                    raise
            else:
                if path not in allowed:
                    raise ctl.BoundaryError('unexpected-baseline-file-capabilities')


def parent_limits(config):
    manager_path_expected = ctl.manager_cgroup(config)
    group = (Path('/sys/fs/cgroup') / manager_path_expected.lstrip('/')).parent
    expected = {'memory.max': str(config['memory_max_mib'] * 1024 ** 2),
                'memory.high': str(config['memory_high_mib'] * 1024 ** 2),
                'memory.swap.max': str(config['swap_max_mib'] * 1024 ** 2),
                'pids.max': str(config['tasks_max'])}
    for filename, value in expected.items():
        path = group / filename
        if path.read_text().strip() != value or path.stat().st_uid != 0 or path.stat().st_mode & 0o022:
            raise ctl.BoundaryError('immutable-parent-resource-limit-mismatch')
    quota, period = (group / 'cpu.max').read_text().split()
    if quota == 'max' or int(quota) * 100 != int(period) * config['cpu_quota_percent']:
        raise ctl.BoundaryError('immutable-parent-cpu-limit-mismatch')
    if config.get('worker_slots', 1) > 1:
        pool = Path('/sys/fs/cgroup/webappci.slice')
        if (pool / 'memory.max').read_text().strip() != str(config['ci_memory_budget_mib'] * 1024 ** 2):
            raise ctl.BoundaryError('immutable-pool-memory-limit-mismatch')
        quota, period = (pool / 'cpu.max').read_text().split()
        if quota == 'max' or int(quota) * 100 != int(period) * config['ci_cpu_budget_percent']:
            raise ctl.BoundaryError('immutable-pool-cpu-limit-mismatch')
    # Compare actual mount identities. CI can legitimately create a private
    # user.slice hierarchy; names alone cannot distinguish it from host exposure.
    manager_path = ctl.command('systemctl', 'show', ctl.manager_unit(config),
                               '-p', 'ControlGroup', '--value').stdout.strip()
    expected_path = manager_path_expected
    if manager_path != expected_path:
        raise ctl.BoundaryError('unexpected-host-manager-cgroup-path')
    manager_group = Path('/sys/fs/cgroup') / manager_path.lstrip('/')
    manager = manager_group.stat()
    immutable = group.stat()
    probe = ("import os; from pathlib import Path; s=os.stat('/sys/fs/cgroup'); "
             f"assert (s.st_dev,s.st_ino)==({manager.st_dev},{manager.st_ino}); "
             f"assert (s.st_dev,s.st_ino)!=({immutable.st_dev},{immutable.st_ino}); "
             "assert Path('/sys/fs/cgroup/cgroup.controllers').exists()")
    ctl.inside(config, 'python3', '-c', probe)
    control_group = ctl.inside(config, 'systemctl', '--user', 'show',
                               '-p', 'ControlGroup', '--value').stdout.strip()
    if control_group not in ('', '/'):
        raise ctl.BoundaryError('user-manager-cgroup-view-not-private-root')
    # nsenter --join-cgroup must move helper commands under the same immutable
    # host parent before runuser drops privileges. Any retained cgroup FD must
    # refer only to the delegated private init.scope, never a host parent/control.
    # util-linux 2.41.3 also consumes stdin as the target's read-only proc cgroup
    # metadata. Capture its host-side identity before crossing the proc mount.
    stdin = Path(f'/proc/{ctl.manager_pid(config)}/cgroup').stat()
    probe = """import errno, fcntl, os
from pathlib import Path
assert Path('/proc/self/cgroup').read_text().strip() == '0::/init.scope'
assert os.getuid() == EXPECTED_UID and os.geteuid() == EXPECTED_UID
assert set(os.getgroups()) <= {EXPECTED_UID}
status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
assert all(int(status[field].strip(), 16) == 0 for field in ('CapEff', 'CapPrm', 'CapAmb'))
stdin = os.fstat(0)
assert (stdin.st_dev, stdin.st_ino) == (STDIN_DEVICE, STDIN_INODE)
assert fcntl.fcntl(0, fcntl.F_GETFL) & os.O_ACCMODE == os.O_RDONLY
expected = os.stat('/sys/fs/cgroup/init.scope/cgroup.procs')
assert expected.st_uid == EXPECTED_UID
retained = 0
for name in os.listdir('/proc/self/fd'):
    descriptor = int(name)
    if descriptor <= 2:
        continue
    try:
        actual = os.fstat(descriptor)
    except OSError as error:
        if error.errno == errno.EBADF:
            continue
        raise
    assert (actual.st_dev, actual.st_ino) == (expected.st_dev, expected.st_ino)
    assert actual.st_uid == EXPECTED_UID
    assert fcntl.fcntl(descriptor, fcntl.F_GETFL) & os.O_ACCMODE == os.O_WRONLY
    retained += 1
assert retained <= 1
""".replace('EXPECTED_UID', str(config['uid'])).replace('STDIN_DEVICE', str(stdin.st_dev)).replace('STDIN_INODE', str(stdin.st_ino))
    ctl.inside(config, 'python3', '-c', probe)


def docker_cgroups(config):
    uid = config['uid']
    manager_group = Path('/sys/fs/cgroup') / ctl.manager_cgroup(config).lstrip('/')
    child = manager_group / 'user.slice' / f'user-{uid}.slice'
    child_identity = child.stat()
    immutable = manager_group.parent.stat()
    private_child = f'/sys/fs/cgroup/user.slice/user-{uid}.slice'
    probe = ("import os; from pathlib import Path; "
             f"root=Path({private_child!r}); s=root.stat(); "
             f"assert (s.st_dev,s.st_ino)==({child_identity.st_dev},{child_identity.st_ino}); "
             f"assert (s.st_dev,s.st_ino)!=({immutable.st_dev},{immutable.st_ino}); "
             "required={'cpu','cpuset','io','memory','pids'}; "
             "assert set((root/'cgroup.controllers').read_text().split())==required; "
             "assert set((root/'cgroup.subtree_control').read_text().split())==required; "
             "assert (root/'cpuset.cpus.effective').read_text().strip()")
    ctl.inside(config, 'python3', '-c', probe)


def temporary_filesystems(config):
    sources = {'/tmp': ctl.ROOTFS / 'tmp', '/var/tmp': ctl.ROOTFS / 'var/tmp',
               '/dev/shm': ctl.BASE / 'minimal-dev/shm'}
    identities = {path: (source.stat().st_dev, source.stat().st_ino) for path, source in sources.items()}
    probe = (f'import os; expected={identities!r}; '
             'assert all((os.stat(p).st_dev,os.stat(p).st_ino)!=value '
             'for p,value in expected.items())')
    ctl.inside(config, 'python3', '-c', probe)


def notification_policy(config):
    unit = ctl.manager_unit(config)
    if ctl.command('systemctl', 'show', unit, '-p', 'NotifyAccess', '--value').stdout.strip() != 'main':
        raise ctl.BoundaryError('manager-notification-access-too-broad')
    marker = 'WEB_APP_CI_CHILD_STATUS_MUST_BE_REJECTED'
    before = ctl.command('systemctl', 'show', unit, '-p', 'StatusText', '--value').stdout.strip()
    if marker in before:
        raise ctl.BoundaryError('manager-already-has-child-status')
    # Run under the actual user manager's cgroup, not a root nsenter child.
    # A second barrier datagram waits until PID 1 consumes all preceding messages:
    # its received pipe descriptor is closed even when this sender is unauthorized.
    probe = """import array, os, select, socket
from pathlib import Path
assert 'web-app-notify-spoof-probe.service' in Path('/proc/self/cgroup').read_text()
with socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM) as client:
    client.connect('/run/host/notify')
    client.send(b'STATUS=WEB_APP_CI_CHILD_STATUS_MUST_BE_REJECTED')
    read_fd, write_fd = os.pipe()
    try:
        client.sendmsg([b'BARRIER=1'], [(socket.SOL_SOCKET, socket.SCM_RIGHTS, array.array('i', [write_fd]))])
    finally:
        os.close(write_fd)
    try:
        assert select.select([read_fd], [], [], 10)[0], 'notification barrier timeout'
        assert os.read(read_fd, 1) == b'', 'notification barrier did not close'
    finally:
        os.close(read_fd)
"""
    ctl.inside(config, 'systemd-run', '--user', '--wait', '--collect',
               '--unit=web-app-notify-spoof-probe', '--property=StandardOutput=null',
               '--property=StandardError=null', '/usr/bin/python3', '-c', probe, timeout=30)
    after = ctl.command('systemctl', 'show', unit, '-p', 'StatusText', '--value').stdout.strip()
    if marker in after:
        raise ctl.BoundaryError('child-spoofed-manager-status')
    if ctl.command('systemctl', 'show', unit, '-p', 'NotifyAccess', '--value').stdout.strip() != 'main':
        raise ctl.BoundaryError('manager-notification-access-changed')


def validate(config):
    cleanup_validation(config, 'initial-cleanup')
    receipt = ctl.BASE / 'validation.json'
    receipt.unlink(missing_ok=True)
    try:
        baseline_privileges()
    except Exception as error:
        retain_failure(config, 'baseline-privileges', error)
        raise
    # Publicly traversable host parent: permission denial alone cannot make this
    # negative probe pass on an otherwise unconfined runner.
    canary = Path('/var/lib/web-app-ci-host-canary')
    with canary.open('x') as stream:
        stream.write('NONSECRET-HOST-BOUNDARY-CANARY')
    os.chmod(canary, 0o644)
    try:
        try:
            stage = 'first-job-prepare'
            ctl.prepare(config)
            stage = 'first-job-parent-limits'
            parent_limits(config)
            stage = 'first-job-devices'
            device_policy(config)
            temporary_filesystems(config)
            stage = 'first-job-notification'
            notification_policy(config)
            # Caddy is known to listen on this host's HTTPS port. A positive
            # host-side connection makes the job-side gateway denial meaningful.
            stage = 'host-gateway-positive'
            with socket.create_connection((ctl.GATEWAY, 443), timeout=5):
                pass
            incoming = ctl.HOME / 'validation-input.json'
            incoming.write_text(json.dumps({'host_public_ipv4': config['host_public_ipv4']}))
            os.chown(incoming, config['uid'], config['uid'])
            stage = 'first-job-user-probes'
            ctl.inside(config, 'systemctl', '--user', 'start', 'web-app-validation.service', timeout=620)
            result_file = ctl.HOME / 'validation-result.json'
            if result_file.stat().st_size > 65536:
                raise ctl.BoundaryError('invalid-validation-receipt')
            result = json.loads(result_file.read_text())
            if result.get('passed') is not True:
                raise ctl.BoundaryError('credential-free-probes-failed')
            stage = 'first-job-container-cgroups'
            docker_cgroups(config)
            parent_limits(config)
            ctl.witnesses_verify(config)
            stage = 'first-job-namespace-checks'
            pid = ctl.manager_pid(config)
            if Path(f'/proc/{pid}/ns/net').readlink() == Path('/proc/1/ns/net').readlink():
                raise ctl.BoundaryError('host-network-namespace-exposed')
            if Path(f'/proc/{pid}/ns/cgroup').readlink() == Path('/proc/1/ns/cgroup').readlink():
                raise ctl.BoundaryError('host-cgroup-namespace-exposed')
        except Exception as error:
            retain_failure(config, stage, error)
            raise
        finally:
            cleanup_validation(config, 'first-job-cleanup')
        # A second fresh boundary proves previous files, containers and children
        # cannot be carried into the next repository's job.
        try:
            stage = 'second-job-prepare'
            ctl.prepare(config)
            stage = 'second-job-parent-limits'
            parent_limits(config)
            stage = 'second-job-fresh-filesystem'
            temporary_filesystems(config)
            if (ctl.HOME / 'previous-job-marker').exists():
                raise ctl.BoundaryError('cross-job-file-persistence')
            probe = ("from pathlib import Path; assert all(not (Path(p)/'previous-job-marker').exists() "
                     "for p in ('/tmp','/var/tmp','/dev/shm'))")
            ctl.inside(config, 'python3', '-c', probe)
            stage = 'second-job-docker'
            ctl.inside(config, 'systemctl', '--user', 'start', 'docker.service')
            docker_cgroups(config)
            parent_limits(config)
            ctl.witnesses_verify(config)
            names = ctl.inside(config, 'docker', 'ps', '-a', '--format', '{{.Names}}').stdout.strip()
            if names:
                raise ctl.BoundaryError('cross-job-container-persistence')
        except Exception as error:
            retain_failure(config, stage, error)
            raise
        finally:
            cleanup_validation(config, 'second-job-cleanup')
        payload = {'passed': True, 'configuration_sha256': ctl.config_digest(),
                   'boundary_sha256': ctl.boundary_digest(config),
                   'boot_id': Path('/proc/sys/kernel/random/boot_id').read_text().strip(),
                   'validated_at_epoch': int(time.time()), 'checks': result['checks'],
                   'notify_access_main': True, 'child_notification_rejected': True,
                   'mapping_helper_metadata_verified': True,
                   'baseline_privilege_allowlist_verified': True,
                   'closed_device_policy_verified': True,
                   'inside_helper_cgroup_and_descriptors_verified': True,
                   'private_temporary_filesystems_verified': True,
                   'private_bus_runtime_adapter_verified': True,
                   'private_api_witnesses_verified': True,
                   'actual_ci_toolchain_verified': True, 'ryuk_reaper_verified': True,
                   'private_docker_controller_hierarchy_verified': True,
                   'host_parent_limits': True, 'abandoned_children_cleanup': True,
                   'fresh_second_job': True}
        with receipt.open('x') as stream:
            os.chmod(receipt, 0o600)
            json.dump(payload, stream, indent=2)
        (ctl.BASE / 'validation-failure.json').unlink(missing_ok=True)
        print('credential-free-boundary-validation-passed; GitHub job verification remains separate')
    finally:
        canary.unlink(missing_ok=True)


def validate_pool(config):
    """Require every ordinary boundary probe AND simultaneous hostile isolation."""
    ctl.pool_capacity(config)
    receipt = ctl.POOL_BASE / 'pool-validation.json'
    receipt.unlink(missing_ok=True)
    for index in range(config.get('worker_slots', 1)):
        with ctl.slot_context(index):
            validate(ctl.slot_config(config, index))
    if config.get('worker_slots', 1) == 1:
        return
    prepared = []
    managers = {}
    try:
        for index in range(config['worker_slots']):
            with ctl.slot_context(index):
                worker = ctl.slot_config(config, index)
                prepared.append(index)  # A partial prepare also requires cleanup.
                ctl.prepare(worker)
                parent_limits(worker)
                ctl.inside(worker, 'systemctl', '--user', 'start', 'docker.service')
                ctl.inside(worker, 'docker', 'volume', 'create', f'pool-slot-{index}')
                ctl.inside(worker, 'systemd-run', '--user', '--unit=web-app-peer-probe',
                           '--property=StandardOutput=null', '--property=StandardError=null',
                           '/usr/bin/python3', '-m', 'http.server', '8080')
                managers[index] = (ctl.manager_pid(worker), ctl.CLIENT)
                (ctl.HOME / 'pool-marker').write_text(str(index))
                os.chown(ctl.HOME / 'pool-marker', worker['uid'], worker['uid'])
        # All workers are alive concurrently. The peer's own namespace makes
        # the positive connection: the host deliberately cannot receive new
        # connections from CI, so a host TCP handshake is not a valid control.
        for index, (_pid, address) in managers.items():
            with ctl.slot_context(index):
                ctl.inside(ctl.slot_config(config, index), 'python3', '-c',
                           "import socket, time; deadline=time.monotonic()+10\n"
                           "while True:\n"
                           " try:\n"
                           f"  connection=socket.create_connection(({address!r},8080),timeout=1); connection.close(); break\n"
                           " except OSError:\n"
                           "  if time.monotonic()>=deadline: raise\n"
                           "  time.sleep(0.2)\n", timeout=15)
        for index in prepared:
            with ctl.slot_context(index):
                worker = ctl.slot_config(config, index)
                for other, (pid, address) in managers.items():
                    if other == index:
                        continue
                    other_uid = ctl.slot_config(config, other)['uid']
                    peer_home = (ctl.POOL_BASE if other == 0 else ctl.POOL_BASE / 'slots' / str(other)) / 'job/home/pool-marker'
                    probe = f'''import os, socket
from pathlib import Path
for target in ({str(peer_home)!r},
               '/run/user/{other_uid}/bus', '/run/user/{other_uid}/docker.sock',
               '/proc/{pid}/root/home/web-app-ci/pool-marker', '/proc/{pid}/environ'):
    try:
        Path(target).read_bytes()
    except (FileNotFoundError, PermissionError, IsADirectoryError):
        pass
    else:
        raise AssertionError('cross-slot-filesystem-access')
try:
    with socket.create_connection(({address!r}, 8080), timeout=2):
        raise AssertionError('cross-slot-network-access')
except OSError:
    pass
'''
                    ctl.inside(worker, 'python3', '-c', probe)
                    if f'pool-slot-{other}' in ctl.inside(worker, 'docker', 'volume', 'ls', '--format', '{{.Name}}').stdout.split():
                        raise ctl.BoundaryError('cross-slot-docker-state-visible')
                volumes = ctl.inside(worker, 'docker', 'volume', 'ls', '--format', '{{.Name}}').stdout.split()
                if volumes != [f'pool-slot-{index}']:
                    raise ctl.BoundaryError('pool-private-docker-volume-mismatch')
        # Destroy one live slot while every other one remains active. Root-side
        # namespace identity and live in-boundary Docker checks must still pass.
        with ctl.slot_context(0):
            ctl.cleanup(ctl.slot_config(config, 0))
        prepared.remove(0)
        for index in prepared:
            with ctl.slot_context(index):
                worker = ctl.slot_config(config, index)
                if ctl.manager_pid(worker) != managers[index][0]:
                    raise ctl.BoundaryError('pool-cleanup-changed-peer-manager')
                ctl.witnesses_verify(worker)
                parent_limits(worker)
                ctl.inside(worker, 'python3', '-c',
                           f"from pathlib import Path; assert Path('/home/web-app-ci/pool-marker').read_text() == '{index}'")
                volumes = ctl.inside(worker, 'docker', 'volume', 'ls', '--format', '{{.Name}}').stdout.split()
                if volumes != [f'pool-slot-{index}']:
                    raise ctl.BoundaryError('pool-cleanup-damaged-peer-docker')
    finally:
        for index in reversed(prepared):
            with ctl.slot_context(index):
                ctl.cleanup(ctl.slot_config(config, index))
    ctl.atomic_json(receipt, ctl.pool_receipt(config))
    print('simultaneous-pool-boundary-validation-passed')
