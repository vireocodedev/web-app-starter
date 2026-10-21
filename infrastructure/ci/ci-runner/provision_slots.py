#!/usr/bin/env python3
"""Provision homogeneous slot boundaries from a stopped trusted baseline.

Called only by the fresh installer or the guarded versioned migration. Never
copies job files, credentials, controller state, or writable dependency caches.
"""
import grp
import os
from pathlib import Path
import pwd
import shutil
import stat
import sys


def identity(config, index):
    return 'web-app-ci' if index == 0 else f'web-app-ci-{index}'


def preflight(config):
    ctl.pool_capacity(config)
    for index in range(1, config.get('worker_slots', 1)):
        worker = ctl.slot_config(config, index)
        uid, start = worker['uid'], worker['subuid_start']
        end = start + 65536
        name = identity(config, index)
        if any(row.pw_name == name or row.pw_uid == uid or start <= row.pw_uid < end for row in pwd.getpwall()):
            raise ctl.BoundaryError('pool-uid-conflict')
        if any(row.gr_name == name or row.gr_gid == uid or start <= row.gr_gid < end for row in grp.getgrall()):
            raise ctl.BoundaryError('pool-gid-conflict')
        for path in (Path('/etc/subuid'), Path('/etc/subgid')):
            for line in path.read_text().splitlines() if path.exists() else []:
                owner, first, count = line.split(':')
                if owner == name or start < int(first) + int(count) and int(first) < end:
                    raise ctl.BoundaryError('pool-subordinate-id-conflict')
        for path in (Path(f'/etc/systemd/system/webappci-worker{index}.slice'), ctl.POOL_BASE / 'slots' / str(index),
                     Path(f'/etc/systemd/system/user@{uid}.service.d'),
                     Path(f'/etc/systemd/system/user-{uid}.slice.d'),
                     Path(f'/run/user/{uid}'), Path('/var/lib/systemd/linger') / name):
            if path.exists() or path.is_symlink():
                raise ctl.BoundaryError('pool-slot-destination-conflict')
    # Actual rootfs allocation, rather than the entire filesystem used count.
    size = int(ctl.command('du', '-sx', '--block-size=1', str(ctl.ROOTFS)).stdout.split()[0])
    if config.get('worker_slots', 1) > 1:
        for path in (Path('/etc/systemd/system/webappci.slice'), Path('/etc/systemd/system/webappci-worker0.slice')):
            if path.exists() or path.is_symlink():
                raise ctl.BoundaryError('pool-aggregate-destination-conflict')
    required = size * (config.get('worker_slots', 1) - 1) + config.get('worker_slots', 1) * config['job_disk_gib'] * 1024 ** 3
    if shutil.disk_usage(ctl.POOL_BASE).free < required + 8 * 1024 ** 3:
        raise ctl.BoundaryError('insufficient-pool-disk-headroom')


def configure_limits(config, index):
    worker = ctl.slot_config(config, index)
    path = (Path(f'/etc/systemd/system/webappci-worker{index}.slice') if config.get('worker_slots', 1) > 1
            else Path(f"/etc/systemd/system/user-{worker['uid']}.slice.d/web-app-ci.conf"))
    path.parent.mkdir(mode=0o755, exist_ok=True)
    path.write_text('[Unit]\nDescription=Immutable CI worker resource boundary\n[Slice]\nMemoryAccounting=yes\n'
                    f"MemoryHigh={worker['memory_high_mib']}M\nMemoryMax={worker['memory_max_mib']}M\n"
                    f"MemorySwapMax={worker['swap_max_mib']}M\nCPUAccounting=yes\nCPUQuota={worker['cpu_quota_percent']}%\n"
                    f"TasksAccounting=yes\nTasksMax={worker['tasks_max']}\n")
    path.chmod(0o644)


def require_probe(rootfs, expected):
    if (Path(rootfs) / 'usr/local/lib/web-app-ci/validate-job.py').read_bytes() != expected:
        raise ctl.BoundaryError('pool-rootfs-probe-source-mismatch')


def provision(config, source):
    expected_probe = (Path(source) / 'validate-job.py').read_bytes()
    require_probe(ctl.POOL_BASE / 'rootfs', expected_probe)
    preflight(config)
    baseline = ctl.POOL_BASE
    template = Path(f"/etc/systemd/system/user@{config['uid']}.service.d/web-app-ci.conf").read_text()
    (baseline / 'slots').mkdir(mode=0o700, exist_ok=True)
    if config.get('worker_slots', 1) > 1:
        aggregate = Path('/etc/systemd/system/webappci.slice')
        aggregate.write_text('[Unit]\nDescription=Aggregate CI worker resource budget\n[Slice]\n'
                             f"CPUAccounting=yes\nCPUQuota={config['ci_cpu_budget_percent']}%\n"
                             f"MemoryAccounting=yes\nMemoryHigh={config['ci_memory_budget_mib'] * 9 // 10}M\nMemoryMax={config['ci_memory_budget_mib']}M\n"
                             f"MemorySwapMax={config['swap_max_mib'] * config['worker_slots']}M\n"
                             f"TasksAccounting=yes\nTasksMax={config['tasks_max'] * config['worker_slots']}\n")
        aggregate.chmod(0o644)
        manager = Path(f"/etc/systemd/system/user@{config['uid']}.service.d/web-app-ci.conf")
        manager.write_text(template + '\nSlice=webappci-worker0.slice\n')
        manager.chmod(0o644)
    configure_limits(config, 0)
    for index in range(1, config.get('worker_slots', 1)):
        worker = ctl.slot_config(config, index)
        name = identity(config, index)
        destination = baseline / 'slots' / str(index)
        destination.mkdir(mode=0o700)
        ctl.command('groupadd', '--gid', str(worker['uid']), name)
        ctl.command('useradd', '--uid', str(worker['uid']), '--gid', str(worker['uid']),
                    '-K', 'SUB_UID_COUNT=0', '-K', 'SUB_GID_COUNT=0', '--no-create-home',
                    '--home-dir', '/nonexistent/' + name, '--shell', '/usr/sbin/nologin', name)
        ctl.command('usermod', '--lock', name)
        for path in (Path('/etc/subuid'), Path('/etc/subgid')):
            with path.open('a') as stream:
                stream.write(f"{name}:{worker['subuid_start']}:65536\n")
                stream.flush()
                os.fsync(stream.fileno())
        for entry in ('rootfs', 'minimal-dev', 'baseline-packages.tsv', 'proc-witness', 'sys-witness'):
            ctl.command('cp', '-a', '--reflink=auto', '--', str(baseline / entry), str(destination / entry), timeout=600)
        rootfs = destination / 'rootfs'
        require_probe(rootfs, expected_probe)
        for entry in ('passwd', 'group'):
            path = rootfs / 'etc' / entry
            rows = []
            for row in path.read_text().splitlines():
                fields = row.split(':')
                if fields[0] == 'web-app-ci':
                    fields[2] = str(worker['uid'])
                    if entry == 'passwd':
                        fields[3] = str(worker['uid'])
                rows.append(':'.join(fields))
            path.write_text('\n'.join(rows) + '\n')
            path.chmod(0o644)
        for entry in ('subuid', 'subgid'):
            (rootfs / 'etc' / entry).write_text(f"web-app-ci:{worker['subuid_start']}:65536\n")
            (rootfs / 'etc' / entry).chmod(0o644)
        runtime = rootfs / 'run/user'
        (runtime / str(config['uid'])).rmdir()
        (runtime / str(worker['uid'])).mkdir(mode=0o755)
        adapter = (Path(source) / 'busctl-compat.py').read_text()
        adapter = adapter.replace('@UID@', str(worker['uid'])).replace('@SUBUID@', str(worker['subuid_start'])).replace('@SUBGID@', str(worker['subuid_start']))
        (rootfs / 'usr/local/lib/web-app-ci/runtime-bin/busctl').write_text(adapter)
        (rootfs / 'usr/local/lib/web-app-ci/runtime-bin/busctl').chmod(0o755)
        for entry in ('docker.service', 'web-app-job.service', 'web-app-validation.service'):
            (rootfs / 'etc/systemd/user' / entry).write_text((Path(source) / entry).read_text().replace('@UID@', str(worker['uid'])))
            (rootfs / 'etc/systemd/user' / entry).chmod(0o644)
        (rootfs / 'etc/machine-id').unlink()
        ctl.command('systemd-machine-id-setup', '--root=' + str(rootfs))
        unit = Path(f"/etc/systemd/system/user@{worker['uid']}.service.d/web-app-ci.conf")
        unit.parent.mkdir(mode=0o755)
        text = template.replace(str(baseline), str(destination))
        text = text.replace(f"{config['uid']}", f"{worker['uid']}").replace('/run/netns/web-app-ci', f'/run/netns/web-app-ci-{index}')
        if config.get('worker_slots', 1) > 1:
            text += f'\nSlice=webappci-worker{index}.slice\n'
        unit.write_text(text)
        unit.chmod(0o644)
        configure_limits(config, index)
    ctl.command('systemctl', 'daemon-reload')


def remove_extra_slots(config, systemd, atomic_file, trusted_executable):
    """Rollback only; caller holds the lock and proved all slots idle."""
    for index in reversed(range(1, config['worker_slots'])):
        worker = ctl.slot_config(config, index)
        name = identity(config, index)
        for path in (Path('/etc/subuid'), Path('/etc/subgid')):
            exact = f"{name}:{worker['subuid_start']}:65536"
            rows = path.read_text().splitlines()
            if any(row.startswith(name + ':') and row != exact for row in rows):
                raise ctl.BoundaryError('pool-rollback-subordinate-identity-changed')
            atomic_file(path, ('\n'.join(row for row in rows if row != exact) + '\n').encode(), 0o644)
        import pwd, grp
        try:
            account = pwd.getpwnam(name)
        except KeyError:
            account = None
        if account is not None:
            if account.pw_uid != worker['uid'] or account.pw_gid != worker['uid']:
                raise ctl.BoundaryError('pool-rollback-user-identity-changed')
            ctl.command('userdel', name)
        try:
            group = grp.getgrnam(name)
        except KeyError:
            group = None
        if group is not None:
            if group.gr_gid != worker['uid'] or group.gr_mem:
                raise ctl.BoundaryError('pool-rollback-group-identity-changed')
            ctl.command('groupdel', name)
        import shutil
        for path in (ctl.POOL_BASE / 'slots' / str(index),
                     systemd / f"user@{worker['uid']}.service.d",
                     systemd / f"user-{worker['uid']}.slice.d"):
            if path.exists():
                # No recursive traversal through symlinks; shutil.rmtree's
                # fd-based implementation resists path replacement attacks.
                if path.is_symlink() or path.stat().st_uid != 0:
                    raise ctl.BoundaryError('pool-rollback-resource-ownership-changed')
                shutil.rmtree(path)
    for index in range(config['worker_slots']):
        path = systemd / f'webappci-worker{index}.slice'
        if path.exists():
            trusted_executable(path)
            path.unlink()
    path = systemd / 'webappci.slice'
    if path.exists():
        trusted_executable(path)
        path.unlink()


def reviewed_source(value):
    source = Path(value)
    if not source.is_absolute() or '..' in source.parts:
        raise ctl.BoundaryError('absolute-reviewed-pool-source-required')
    for path in (source, *source.parents):
        info = path.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ctl.BoundaryError('untrusted-pool-source-directory')
    for name in ('validate-job.py', 'busctl-compat.py', 'docker.service',
                 'web-app-job.service', 'web-app-validation.service'):
        info = (source / name).lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ctl.BoundaryError('untrusted-pool-source-file')
    return source


def main(argv=None):
    if os.geteuid() != 0:
        raise ctl.BoundaryError('root-pool-provisioning-required')
    arguments = sys.argv[1:] if argv is None else argv
    if len(arguments) != 1:
        raise ctl.BoundaryError('one-reviewed-pool-source-required')
    source = reviewed_source(arguments[0])
    provision(ctl.load_config(), source)
    return 0


if __name__ == '__main__':
    import controller as ctl
    try:
        sys.exit(main())
    except (ctl.BoundaryError, OSError, ValueError):
        print('pool-provisioning-rejected; controller remains disabled', file=sys.stderr)
        sys.exit(1)
