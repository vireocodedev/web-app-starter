"""Admission-barrier ordering and real pidfd races; no host/systemd mutation."""
import contextlib
import copy
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / 'docs/project-deletion/scripts'
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location('deletion_ci_drain_tests', SCRIPTS / '_ci_drain.py')
drain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(drain)
REAL_UNIT = drain._unit
REAL_SLEEP = time.sleep


class FakePin:
    def __init__(self, events):
        self.events = events
        self.dead = False
        self.pid = 123
        self.identity = {'starttime': 1}
        self.group = '/system.slice/web-app-ci-controller.service'

    def freeze(self):
        self.events.append('freeze')

    def check(self):
        self.events.append('check')
        return 'T'

    def exited(self):
        return self.dead

    def send(self, value):
        self.events.append(value)

    def kill_idle(self):
        self.events.append('kill')
        self.dead = True

    def close(self):
        self.events.append('close')


class DeletionDrainTests(unittest.TestCase):
    def setUp(self):
        self.events = []
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        self.recovery = self.directory / 'drain-recovery.json'
        self.config = {'projects': {'neighbor': {'repository': 'Acme/neighbor'}}}
        self.ctl = SimpleNamespace(config_digest=mock.Mock(return_value='a' * 64),
                                   load_config=mock.Mock(side_effect=lambda: copy.deepcopy(self.config)))
        self.manage = SimpleNamespace(ctl=self.ctl, SERVICE='web-app-ci-controller.service',
                                      root_required=mock.Mock(), source_protected=mock.Mock(),
                                      invalidate_pool_receipts=mock.Mock(side_effect=lambda _config: self.events.append('invalidate')))
        self.observation = {'ActiveState': 'active', 'UnitFileState': 'enabled', 'MainPID': 123,
                            'ControlGroup': '/system.slice/web-app-ci-controller.service'}
        self.pins = []

        def pin(*_args):
            result = FakePin(self.events)
            self.pins.append(result)
            return result

        patches = contextlib.ExitStack()
        self.addCleanup(patches.close)
        for patch in (
                mock.patch.object(drain, 'ADMISSION_RECEIPT', self.directory / 'absent-validation.json'),
                mock.patch.object(drain, '_sources', return_value='b' * 64),
                mock.patch.object(drain, '_unit', side_effect=lambda *_args: dict(self.observation)),
                mock.patch.object(drain, '_pin', side_effect=pin),
                mock.patch.object(drain, '_busy', return_value=False),
                mock.patch.object(drain, '_stop_disabled', side_effect=lambda *_args: self.events.append('stop-disable')),
                mock.patch.object(drain.time, 'sleep')):
            patches.enter_context(patch)

    def run_drain(self, **kwargs):
        return drain.drain_and_stop(self.manage, self.config, recovery_path=self.recovery, **kwargs)

    def test_idle_main_invalidates_receipts_before_kill_and_stop(self):
        result = self.run_drain()
        self.assertLess(self.events.index('freeze'), self.events.index('invalidate'))
        self.assertLess(self.events.index('invalidate'), self.events.index('kill'))
        self.assertLess(self.events.index('kill'), self.events.index('stop-disable'))
        self.assertNotIn(signal.SIGCONT, self.events)
        self.assertTrue(result['was_enabled'])
        self.assertTrue(result['validation_invalidated'])
        self.assertTrue(result['stopped'])

    def test_busy_observation_resumes_without_invalidation_then_rechecks_under_new_barrier(self):
        drain._busy.side_effect = [True, False]
        self.run_drain()
        self.assertEqual(self.events.count('freeze'), 2)
        self.assertEqual(self.events.count(signal.SIGCONT), 1)
        self.assertLess(self.events.index(signal.SIGCONT), self.events.index('invalidate'))
        self.assertEqual(self.events.count('kill'), 1)

    def test_error_before_invalidation_resumes_main_without_stop(self):
        drain._busy.side_effect = drain.Error('uncertain worker state')
        with self.assertRaises(drain.Error):
            self.run_drain()
        self.assertIn(signal.SIGCONT, self.events)
        self.assertNotIn('invalidate', self.events)
        self.assertNotIn('kill', self.events)
        self.assertNotIn('stop-disable', self.events)

    def test_partial_receipt_invalidation_never_resumes_main(self):
        self.manage.invalidate_pool_receipts.side_effect = OSError('durability failure')
        with self.assertRaises(OSError):
            self.run_drain()
        self.assertIn('kill', self.events)
        self.assertIn('stop-disable', self.events)
        self.assertNotIn(signal.SIGCONT, self.events)

    def test_failed_slot0_unlink_keeps_main_frozen_with_durable_recovery_and_blocks_retry(self):
        admission = self.directory / 'validation.json'
        admission.write_text('{}')
        self.manage.invalidate_pool_receipts.side_effect = OSError('EIO before unlink')
        with mock.patch.object(drain, 'ADMISSION_RECEIPT', admission):
            with self.assertRaisesRegex(drain.Error, 'main remains frozen'):
                self.run_drain()
            self.assertNotIn(signal.SIGCONT, self.events)
            self.assertNotIn('kill', self.events)
            self.assertNotIn('stop-disable', self.events)
            self.assertTrue(admission.exists())
            recovery = json.loads(self.recovery.read_text())
            self.assertEqual(recovery['phase'], 'frozen-recovery-required')
            self.assertTrue(recovery['validation_required'])
            with self.assertRaisesRegex(drain.Error, 'uncertain frozen main'):
                self.run_drain()
            self.assertEqual(self.events.count('freeze'), 1)

    @unittest.skipUnless(hasattr(os, 'pidfd_open') and hasattr(signal, 'pidfd_send_signal'), 'Linux pidfd required')
    def test_real_idle_main_remains_stopped_after_failed_slot0_unlink(self):
        process = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)'],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        def cleanup():
            if process.poll() is None:
                process.kill()
            process.wait(timeout=5)
        self.addCleanup(cleanup)
        class RealPin(drain._Pinned):
            def __init__(self):
                self.pid = process.pid
                self.fd = os.pidfd_open(self.pid, 0)
                self.identity = drain._process(self.pid)
                self.group = '/fixture'
            def check(self):
                return drain._process(self.pid)['state']
        drain._pin.side_effect = lambda *_args: RealPin()
        drain.time.sleep.side_effect = lambda seconds: REAL_SLEEP(min(seconds, .01))
        admission = self.directory / 'validation.json'
        admission.write_text('{}')
        self.manage.invalidate_pool_receipts.side_effect = OSError('EIO before unlink')
        with mock.patch.object(drain, 'ADMISSION_RECEIPT', admission):
            with self.assertRaisesRegex(drain.Error, 'main remains frozen'):
                self.run_drain()
        self.assertIn(drain._process(process.pid)['state'], ('T', 't'))
        self.assertIsNone(process.poll())
        self.assertTrue(admission.exists())
        self.assertNotIn('stop-disable', self.events)
        self.assertEqual(json.loads(self.recovery.read_text())['phase'], 'frozen-recovery-required')

    def test_unconfirmed_kill_never_calls_systemd_stop_or_resumes_main(self):
        def pin(*_args):
            result = FakePin(self.events)
            result.kill_idle = mock.Mock(side_effect=drain.Error('kill not confirmed'))
            return result
        drain._pin.side_effect = pin
        with self.assertRaisesRegex(drain.Error, 'kill not confirmed'):
            self.run_drain()
        self.assertNotIn(signal.SIGCONT, self.events)
        self.assertNotIn('stop-disable', self.events)

    def test_configuration_drift_under_barrier_resumes_without_mutation(self):
        self.ctl.config_digest.side_effect = ['a' * 64, 'b' * 64]
        with self.assertRaisesRegex(drain.Error, 'configuration or reviewed admission source changed'):
            self.run_drain()
        self.assertIn(signal.SIGCONT, self.events)
        self.assertNotIn('invalidate', self.events)

    def test_already_stopped_path_does_not_invalidate_or_signal(self):
        self.observation.update(ActiveState='inactive', MainPID=0)
        result = self.run_drain()
        self.assertEqual(self.events, ['stop-disable'])
        self.assertFalse(result['validation_invalidated'])

    def test_transitioning_main_is_not_signaled(self):
        self.observation.update(ActiveState='deactivating')
        with self.assertRaisesRegex(drain.Error, 'transitioning'):
            self.run_drain()
        self.assertEqual(self.events, [])

    def test_expired_busy_drain_leaves_service_running(self):
        drain._busy.return_value = True
        with mock.patch.object(drain.time, 'monotonic', side_effect=[0, 0, 601, 601, 601]):
            with self.assertRaisesRegex(drain.Error, 'remain busy'):
                self.run_drain()
        self.assertIn(signal.SIGCONT, self.events)
        self.assertNotIn('invalidate', self.events)
        self.assertNotIn('stop-disable', self.events)

    def test_loaded_unit_dropins_or_stale_fragment_are_rejected(self):
        values = {'ActiveState': 'active', 'UnitFileState': 'enabled', 'MainPID': '123',
                  'ControlGroup': '/system.slice/web-app-ci-controller.service', 'DropInPaths': '',
                  'FragmentPath': str(drain.UNIT_FILE), 'NeedDaemonReload': 'no'}
        for changes in ({'DropInPaths': '/run/systemd/system/custom.conf'},
                        {'NeedDaemonReload': 'yes'}, {'FragmentPath': '/tmp/unreviewed.service'}):
            raw = '\n'.join(key + '=' + value for key, value in dict(values, **changes).items())
            with self.subTest(changes=changes):
                ctl = SimpleNamespace(command=mock.Mock(return_value=SimpleNamespace(stdout=raw)))
                with self.assertRaises(drain.Error):
                    REAL_UNIT(ctl, self.manage.SERVICE)

    @unittest.skipUnless(hasattr(os, 'pidfd_open') and hasattr(signal, 'pidfd_send_signal'), 'Linux pidfd required')
    def test_real_process_reservation_at_final_check_drains_neighbor_without_signaling_worker(self):
        script = r'''
import json, os, pathlib, signal, sys, time
root = pathlib.Path(sys.argv[1])
while not (root / 'admit').exists(): time.sleep(.005)
pid = os.fork()
if pid == 0:
    def canceled(*_):
        (root / 'canceled').write_text('yes')
        os._exit(2)
    signal.signal(signal.SIGTERM, canceled)
    (root / 'worker-pid').write_text(str(os.getpid()))
    time.sleep(.15)
    (root / 'completed').write_text('yes')
    os._exit(0)
(root / 'pool-next.json').write_text(json.dumps({'0': {'repo': 'Acme/neighbor', 'job_id': 1}}))
(root / 'pool-next.json').replace(root / 'pool.json')
(root / 'ready').write_text('yes')
os.waitpid(pid, 0)
(root / 'pool-next.json').write_text('{}')
(root / 'pool-next.json').replace(root / 'pool.json')
while True: time.sleep(.01)
'''
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            process = subprocess.Popen([sys.executable, '-u', '-c', script, str(root)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            def cleanup():
                if process.poll() is None:
                    process.kill()
                process.wait(timeout=5)
            self.addCleanup(cleanup)
            first = True
            observations = []

            class RealPin(drain._Pinned):
                def __init__(self):
                    self.pid = process.pid
                    self.fd = os.pidfd_open(self.pid, 0)
                    self.identity = drain._process(self.pid)
                    self.group = '/fixture'
                def check(self):
                    current = drain._process(self.pid)
                    if current['starttime'] != self.identity['starttime']:
                        raise drain.Error('fixture PID changed')
                    return current['state']

            def pin(*_args):
                nonlocal first
                if first:
                    first = False
                    (root / 'admit').write_text('yes')
                    deadline = time.monotonic() + 5
                    while not (root / 'ready').exists():
                        if time.monotonic() >= deadline:
                            self.fail('fixture did not publish reservation')
                        REAL_SLEEP(.005)
                return RealPin()

            def busy(_ctl, _config, pinned):
                self.assertIn(pinned.check(), ('T', 't'))
                reservations = json.loads((root / 'pool.json').read_text())
                children = Path('/proc', str(pinned.pid), 'task', str(pinned.pid), 'children').read_text().split()
                observations.append(bool(reservations or children))
                return bool(reservations or children)

            def invalidate(_config):
                self.assertTrue((root / 'completed').exists())
                self.assertFalse((root / 'canceled').exists())
                self.events.append('invalidate')

            drain._pin.side_effect = pin
            drain._busy.side_effect = busy
            drain.time.sleep.side_effect = lambda seconds: REAL_SLEEP(min(seconds, .01))
            self.manage.invalidate_pool_receipts.side_effect = invalidate
            self.run_drain(timeout=5)
            process.wait(timeout=5)
            self.assertTrue(observations[0])
            self.assertFalse(observations[-1])
            self.assertTrue((root / 'completed').exists())
            self.assertFalse((root / 'canceled').exists())


class AdmissionSourceContractTests(unittest.TestCase):
    def test_startup_checks_receipts_before_any_admission_and_reserves_before_fork(self):
        source = (ROOT / 'infrastructure/ci/ci-runner/controller.py').read_text()
        serve = source.split('def serve(config):', 1)[1].split('\ndef verify_pool_receipts', 1)[0]
        self.assertLess(serve.index('verify_pool_receipts(config)'), serve.index('while not STOP:'))
        self.assertLess(serve.index('pool_state(reservations)  # fsync intent BEFORE fork'), serve.index('pid = os.fork()'))
        unit = (ROOT / 'infrastructure/ci/ci-runner/web-app-ci-controller.service').read_text()
        self.assertIn('ConditionPathExists=/var/lib/web-app-ci/validation.json', unit)


if __name__ == '__main__':
    unittest.main()
