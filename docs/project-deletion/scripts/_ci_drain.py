"""Stop only an idle pinned dispatcher without racing its next admission."""
import hashlib
import json
import os
import re
from pathlib import Path
import select
import signal
import stat
import time

from _state import Error, read, write


CONTROLLER = Path('/usr/local/lib/web-app-ci/controller.py')
UNIT_FILE = Path('/etc/systemd/system/web-app-ci-controller.service')
PYTHON = Path('/usr/bin/python3')
CGROUP_ROOT = Path('/sys/fs/cgroup')
ADMISSION_RECEIPT = Path('/var/lib/web-app-ci/validation.json')


def _trusted(path):
    path = Path(path)
    for item in (path, *path.parents):
        info = item.lstat()
        if (info.st_uid != 0 or info.st_mode & 0o022 or item.is_symlink()
                or not (stat.S_ISREG(info.st_mode) if item == path else stat.S_ISDIR(info.st_mode))):
            raise Error('CI drain requires unchanged root-controlled installed sources.')
    return path


def _sources(manage):
    installed = _trusted(CONTROLLER)
    source = _trusted(Path(manage.ctl.__file__))
    unit = _trusted(UNIT_FILE)
    expected_unit = _trusted(manage.SOURCE / 'web-app-ci-controller.service')
    if (installed.read_bytes() != source.read_bytes() or unit.read_bytes() != expected_unit.read_bytes()
            or 'ConditionPathExists=' + str(ADMISSION_RECEIPT) not in unit.read_text()
            or 'verify_pool_receipts(config)' not in source.read_text()):
        raise Error('Installed CI admission source differs from the reviewed drain contract.')
    _trusted(PYTHON.resolve(strict=True))
    return hashlib.sha256(installed.read_bytes()).hexdigest()


def _unit(ctl, unit):
    fields = ('ActiveState', 'UnitFileState', 'MainPID', 'ControlGroup', 'DropInPaths',
              'FragmentPath', 'NeedDaemonReload')
    raw = ctl.command('systemctl', 'show', unit, '--property=' + ','.join(fields)).stdout
    result = dict(line.split('=', 1) for line in raw.splitlines() if '=' in line)
    if (set(result) != set(fields) or not result['MainPID'].isdigit()
            or result['DropInPaths'] or result['FragmentPath'] != str(UNIT_FILE)
            or result['NeedDaemonReload'] != 'no'):
        raise Error('CI unit identity or drop-ins differ from the reviewed drain contract.')
    result['MainPID'] = int(result['MainPID'])
    return result


def _process(pid):
    path = Path('/proc') / str(pid)
    fields = (path / 'stat').read_text().rsplit(')', 1)[1].split()
    status = (path / 'status').read_text().splitlines()
    uid = next(line for line in status if line.startswith('Uid:')).split()[1:]
    argv = (path / 'cmdline').read_bytes().split(b'\0')[:-1]
    cgroups = (path / 'cgroup').read_text().splitlines()
    executable = (path / 'exe').stat()
    return {'state': fields[0], 'starttime': int(fields[19]), 'uids': tuple(map(int, uid)),
            'argv': argv, 'cgroups': cgroups, 'executable': (executable.st_dev, executable.st_ino)}


class _Pinned:
    def __init__(self, ctl, unit, observation):
        self.ctl, self.unit, self.pid = ctl, unit, observation['MainPID']
        self.fd = os.pidfd_open(self.pid, 0)
        try:
            self.identity = _process(self.pid)
            expected_exe = PYTHON.resolve(strict=True).stat()
            expected_argv = [os.fsencode(PYTHON), os.fsencode(CONTROLLER), b'serve']
            group = observation['ControlGroup']
            if (self.pid <= 1 or not group.startswith('/') or '..' in Path(group).parts
                    or group != '/system.slice/' + unit
                    or self.identity['uids'] != (0, 0, 0, 0)
                    or self.identity['argv'] != expected_argv
                    or self.identity['cgroups'] != ['0::' + group]
                    or self.identity['executable'] != (expected_exe.st_dev, expected_exe.st_ino)):
                raise Error('CI main process differs from its installed systemd identity.')
            self.group = group
            self.check()
        except BaseException:
            self.close()
            raise

    def close(self):
        os.close(self.fd)

    def send(self, value):
        signal.pidfd_send_signal(self.fd, value)

    def check(self):
        observation = _unit(self.ctl, self.unit)
        current = _process(self.pid)
        if (observation['MainPID'] != self.pid or observation['ActiveState'] != 'active'
                or observation['ControlGroup'] != self.group
                or any(current[key] != self.identity[key] for key in self.identity if key != 'state')):
            raise Error('CI main process changed during the admission barrier.')
        return current['state']

    def freeze(self):
        self.send(signal.SIGSTOP)
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            if self.check() in ('T', 't'):
                return
            time.sleep(0.02)
        raise Error('CI main process could not be frozen safely.')

    def exited(self):
        poll = select.poll()
        poll.register(self.fd, select.POLLIN)
        return bool(poll.poll(0))

    def kill_idle(self):
        # Never ask systemd to stop a frozen live main: stop sends SIGCONT and
        # can resume an already-entered admission before its next STOP check.
        self.send(signal.SIGKILL)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            if self.exited():
                return
            time.sleep(0.02)
        raise Error('Pinned idle CI main has not exited; leave the barrier intact.')


def _pin(ctl, unit, observation):
    return _Pinned(ctl, unit, observation)


def _busy(ctl, config, pinned):
    if ctl.pool_state():
        return True
    children = Path('/proc', str(pinned.pid), 'task', str(pinned.pid), 'children').read_text().split()
    if children:
        return True
    directory = CGROUP_ROOT / pinned.group.lstrip('/')
    if not directory.is_dir() or not (directory / 'cgroup.procs').is_file():
        raise Error('CI controller cgroup is missing.')
    for path in directory.rglob('cgroup.procs'):
        if any(int(pid) != pinned.pid for pid in path.read_text().split()):
            return True
    mounts = ctl.mount_entries()
    for index in range(config.get('worker_slots', 1)):
        worker = ctl.slot_config(config, index)
        with ctl.slot_context(index):
            state = ctl.command('systemctl', 'show', ctl.manager_unit(worker), '-p', 'ActiveState', '--value').stdout.strip()
            if state not in ('inactive', 'failed') or ctl.remaining_processes(worker):
                return True
            if ctl.STATE.exists() and json.loads(ctl.protected_file(ctl.STATE), object_pairs_hook=ctl.unique_object) != {}:
                return True
            if (ctl.BASE / 'job.img').exists() or Path('/run/netns', ctl.NETNS).exists():
                return True
            if any(entry['target'] == str(ctl.BASE) or entry['target'].startswith(str(ctl.BASE) + '/') for entry in mounts):
                return True
    return False


def _stop_disabled(manage, unit, config):
    manage.ctl.command('systemctl', 'disable', '--now', unit, timeout=30)
    manage.require_idle(config)



def _recovery(path, unit):
    path = Path(path)
    if not (path.exists() or path.is_symlink()):
        return path
    value = read(path)
    fields = {'schema_version', 'operation', 'phase', 'unit', 'main_pid', 'main_starttime',
              'cgroup', 'configuration_sha256', 'source_sha256', 'admission_receipt', 'validation_required'}
    if (set(value) != fields or type(value['schema_version']) is not int or value['schema_version'] != 1 or value['operation'] != 'ci-drain'
            or value['unit'] != unit or value['phase'] not in ('invalidating', 'frozen-recovery-required', 'stopped')
            or type(value['main_pid']) is not int or value['main_pid'] <= 1
            or type(value['main_starttime']) is not int or value['main_starttime'] <= 0
            or type(value['cgroup']) is not str or not value['cgroup'].startswith('/')
            or '..' in Path(value['cgroup']).parts
            or any(type(value[key]) is not str or not re.fullmatch('[0-9a-f]{64}', value[key])
                   for key in ('configuration_sha256', 'source_sha256'))
            or value['admission_receipt'] != str(ADMISSION_RECEIPT)
            or value['validation_required'] is not True):
        raise Error('Protected CI drain recovery identity is invalid.')
    if value['phase'] != 'stopped':
        raise Error('CI drain recovery records an uncertain frozen main; reconcile its protected PID identity before retrying.')
    return path


def _require_startup_blocked():
    try:
        ADMISSION_RECEIPT.lstat()
    except FileNotFoundError:
        return
    except OSError:
        pass
    raise Error('CI admission receipt remains present or uncertain.')


def drain_and_stop(manage, config, unit='web-app-ci-controller.service', timeout=600, *, recovery_path):
    """Drain without interrupting other consumers; invalidation is fail-closed.

    Before invalidation every failure resumes the pinned main. After invalidation
    starts, no path resumes it. Prove the admission receipt absent before killing
    that idle main; otherwise retain a frozen-main recovery record. Missing
    receipts prevent any automatic replacement main from admitting work.
    """
    if unit != manage.SERVICE or timeout <= 0:
        raise Error('CI drain requires the fixed shared controller and a positive deadline.')
    manage.root_required()
    manage.source_protected()
    source_sha = _sources(manage)
    ctl = manage.ctl
    expected_sha = ctl.config_digest()
    if ctl.load_config() != config:
        raise Error('Shared CI configuration changed before draining.')
    recovery = _recovery(recovery_path, unit)
    original = _unit(ctl, unit)
    previous = {'was_enabled': original['UnitFileState'] in ('enabled', 'enabled-runtime'),
                'active_state': original['ActiveState'], 'unit_file_state': original['UnitFileState']}
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        observation = _unit(ctl, unit)
        if observation['ActiveState'] in ('inactive', 'failed') and observation['MainPID'] == 0:
            _stop_disabled(manage, unit, config)
            return dict(previous, validation_invalidated=False, stopped=True)
        if observation['ActiveState'] != 'active' or observation['MainPID'] <= 1:
            raise Error('CI controller is transitioning; leave active workers untouched and retry.')
        pinned = _pin(ctl, unit, observation)
        invalidating = False
        try:
            pinned.freeze()
            if not _busy(ctl, config, pinned):
                pinned.check()
                if ctl.config_digest() != expected_sha or ctl.load_config() != config or _sources(manage) != source_sha:
                    raise Error('CI configuration or reviewed admission source changed while draining.')
                # Startup requires these receipts, and the unit condition names
                # slot 0's receipt. Removing them blocks automatic restart too.
                record = {'schema_version': 1, 'operation': 'ci-drain', 'phase': 'invalidating',
                          'unit': unit, 'main_pid': pinned.pid, 'main_starttime': pinned.identity['starttime'],
                          'cgroup': pinned.group, 'configuration_sha256': expected_sha, 'source_sha256': source_sha,
                          'admission_receipt': str(ADMISSION_RECEIPT), 'validation_required': True}
                write(recovery, record)  # Durable reconciliation identity precedes receipt mutation.
                invalidating = True
                try:
                    manage.invalidate_pool_receipts(config)
                finally:
                    try:
                        _require_startup_blocked()
                    except Error:
                        record['phase'] = 'frozen-recovery-required'
                        try:
                            write(recovery, record)
                        finally:
                            raise Error('CI main remains frozen; reconcile the protected CI drain recovery record before retrying.') from None
                    pinned.kill_idle()
                    _stop_disabled(manage, unit, config)
                    record['phase'] = 'stopped'
                    write(recovery, record)
                return dict(previous, validation_invalidated=True, stopped=True)
        finally:
            if not invalidating:
                try:
                    if not pinned.exited():
                        pinned.send(signal.SIGCONT)
                except ProcessLookupError:
                    pass
            pinned.close()
        time.sleep(min(2, max(0, deadline - time.monotonic())))
    raise Error('Shared CI workers remain busy; no jobs were stopped. Retry after they drain.')
