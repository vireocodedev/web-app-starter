"""Bound root preparation writeback without changing the controller cgroup."""
import contextlib
import copy
import fcntl
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

from test_worker_pool import ctl, BASELINE


class RunnerCopyLockTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        real_fstat = os.fstat
        def metadata(descriptor):
            result = real_fstat(descriptor)
            return SimpleNamespace(st_uid=0, st_gid=0, st_mode=result.st_mode,
                                   st_nlink=result.st_nlink, st_size=result.st_size)
        for patch in (mock.patch.object(ctl, 'POOL_BASE', self.base),
                      mock.patch.object(ctl, 'protected_path', side_effect=lambda path, **_kwargs: Path(path)),
                      mock.patch.object(os, 'fstat', side_effect=metadata), mock.patch.object(ctl, 'STOP', False)):
            self.stack.enter_context(patch)

    def test_slots_use_one_pool_lock_and_independent_open_descriptions_exclude_each_other(self):
        with ctl.slot_context(0), ctl.runner_copy_lock() as first:
            self.assertEqual(os.fstat(first).st_mode & 0o777, 0o600)
            self.assertFalse(os.get_inheritable(first))
            with ctl.slot_context(1):
                second = os.open(self.base / 'runner-copy.lock', os.O_RDWR | os.O_CLOEXEC)
                try:
                    with self.assertRaises(BlockingIOError):
                        fcntl.flock(second, fcntl.LOCK_EX | fcntl.LOCK_NB)
                finally:
                    os.close(second)
        with ctl.slot_context(1), ctl.runner_copy_lock():
            pass  # Closing the last owner made the same lock available.
        self.assertFalse((self.base / 'slots/1/runner-copy.lock').exists())

    def test_wait_timeout_is_bounded_and_stop_interrupts_wait_without_entering(self):
        with ctl.runner_copy_lock():
            clock = [0.0]
            def sleep(seconds):
                clock[0] += seconds
            with mock.patch.object(ctl.time, 'monotonic', side_effect=lambda: clock[0]), \
                    mock.patch.object(ctl.time, 'sleep', side_effect=sleep), \
                    self.assertRaisesRegex(ctl.BoundaryError, 'runner-copy-lock-timeout'):
                with ctl.runner_copy_lock(timeout=0.3):
                    self.fail('A competing writer entered the lock.')
            self.assertLessEqual(clock[0], 0.5)
            def stop(_seconds):
                ctl.STOP = True
            with mock.patch.object(ctl.time, 'sleep', side_effect=stop), \
                    self.assertRaisesRegex(ctl.BoundaryError, 'runner-copy-lock-stopped'):
                with ctl.runner_copy_lock():
                    self.fail('Stopped preparation entered the lock.')
        ctl.STOP = False
        with ctl.runner_copy_lock():
            pass

    def test_unsafe_lock_metadata_or_symlink_is_rejected(self):
        safe = dict(st_uid=0, st_gid=0, st_mode=stat.S_IFREG | 0o600, st_nlink=1, st_size=0)
        for change in ({'st_uid': 1000}, {'st_gid': 1000}, {'st_mode': stat.S_IFREG | 0o640},
                       {'st_mode': stat.S_IFDIR | 0o600}, {'st_nlink': 2}, {'st_size': 1}):
            with self.subTest(change=change), mock.patch.object(os, 'fstat', return_value=SimpleNamespace(**dict(safe, **change))), \
                    self.assertRaisesRegex(ctl.BoundaryError, 'unsafe-runner-copy-lock'):
                with ctl.runner_copy_lock():
                    self.fail('Unsafe file was accepted.')
        lock = self.base / 'runner-copy.lock'
        lock.unlink()
        target = self.base / 'target'
        target.write_text('')
        lock.symlink_to(target)
        with self.assertRaisesRegex(ctl.BoundaryError, 'unsafe-runner-copy-lock'):
            with ctl.runner_copy_lock():
                self.fail('Symlink was accepted.')

    def test_unprotected_pool_ancestor_is_rejected_before_open(self):
        with mock.patch.object(ctl, 'protected_path', side_effect=ctl.BoundaryError('unsafe-protected-parent')), \
                mock.patch.object(os, 'open') as opening, \
                self.assertRaisesRegex(ctl.BoundaryError, 'unsafe-protected-parent'):
            with ctl.runner_copy_lock():
                self.fail('An unprotected ancestor was accepted.')
        opening.assert_not_called()

    def test_helper_keeps_lock_after_python_owner_closes_until_helper_exits(self):
        # Real exec/FD handoff: emulate owner death by closing its descriptor.
        # Explicit LOCK_UN would make the competing acquisition succeed here.
        helper = None
        try:
            with ctl.runner_copy_lock() as descriptor:
                helper = subprocess.Popen(
                    [sys.executable, '-c', 'import sys; print("ready", flush=True); sys.stdin.buffer.read(1)'],
                    pass_fds=(descriptor,), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                import select
                ready, _, _ = select.select([helper.stdout], [], [], 5)
                self.assertTrue(ready, 'The inherited-FD helper did not become ready.')
                self.assertEqual(helper.stdout.readline(), b'ready\n')
            competitor = os.open(self.base / 'runner-copy.lock', os.O_RDWR | os.O_CLOEXEC)
            try:
                with self.assertRaises(BlockingIOError):
                    fcntl.flock(competitor, fcntl.LOCK_EX | fcntl.LOCK_NB)
            finally:
                os.close(competitor)
            helper.communicate(input=b'x', timeout=5)
            self.assertEqual(helper.returncode, 0)
            with ctl.runner_copy_lock():
                pass
        finally:
            if helper is not None and helper.poll() is None:
                helper.kill()
                helper.communicate(timeout=5)


class RunnerCopyOperationTests(unittest.TestCase):
    def test_copy_chown_and_flush_share_inherited_descriptor_and_close_only_after_flush(self):
        events = []
        @contextlib.contextmanager
        def lock():
            events.append('locked')
            try:
                yield 42
            finally:
                events.append('closed')
        def command(*args, **kwargs):
            self.assertEqual(kwargs, {'pass_fds': (42,)})
            events.append(args[0])
        with mock.patch.object(ctl, 'runner_copy_lock', side_effect=lock), \
                mock.patch.object(ctl, 'command', side_effect=command):
            ctl.copy_runner(BASELINE)
        self.assertEqual(events, ['locked', 'cp', 'chown', 'sync', 'closed'])

    def test_failed_copy_or_chown_still_flushes_while_locked_and_never_reports_success(self):
        for failed in ('cp', 'chown'):
            with self.subTest(failed=failed):
                events = []
                @contextlib.contextmanager
                def lock():
                    events.append('locked')
                    try:
                        yield 42
                    finally:
                        events.append('closed')
                def command(*args, **kwargs):
                    self.assertEqual(kwargs, {'pass_fds': (42,)})
                    events.append(args[0])
                    if args[0] == failed:
                        raise ctl.BoundaryError('fixed-local-command-failed')
                with mock.patch.object(ctl, 'runner_copy_lock', side_effect=lock), \
                        mock.patch.object(ctl, 'command', side_effect=command), \
                        self.assertRaisesRegex(ctl.BoundaryError, 'fixed-local-command-failed'):
                    ctl.copy_runner(BASELINE)
                expected = ['locked', 'cp'] + (['chown'] if failed == 'chown' else []) + ['sync', 'closed']
                self.assertEqual(events, expected)

    def test_flush_failure_is_fatal_and_lock_wait_failure_runs_no_io_commands(self):
        def command(*args, **_kwargs):
            if args[0] == 'sync':
                raise ctl.BoundaryError('fixed-local-command-failed')
        with mock.patch.object(ctl, 'runner_copy_lock', return_value=contextlib.nullcontext(42)), \
                mock.patch.object(ctl, 'command', side_effect=command), \
                self.assertRaisesRegex(ctl.BoundaryError, 'fixed-local-command-failed'):
            ctl.copy_runner(BASELINE)
        with mock.patch.object(ctl, 'runner_copy_lock', side_effect=ctl.BoundaryError('runner-copy-lock-timeout')), \
                mock.patch.object(ctl, 'command') as io, \
                self.assertRaisesRegex(ctl.BoundaryError, 'runner-copy-lock-timeout'):
            ctl.copy_runner(BASELINE)
        io.assert_not_called()

    def test_command_inherits_only_explicit_fds_and_preserves_default_subprocess_contract(self):
        result = SimpleNamespace(returncode=0)
        with mock.patch.object(ctl.subprocess, 'run', return_value=result) as run:
            ctl.command('fixed')
            run.assert_called_once_with(('fixed',), input=None, text=True, capture_output=True,
                                        timeout=120, env={'PATH': '/usr/sbin:/usr/bin:/sbin:/bin'})
            run.reset_mock()
            ctl.command('fixed', pass_fds=(42,))
            self.assertEqual(run.call_args.kwargs['pass_fds'], (42,))
