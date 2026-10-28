"""Section-11 transport contracts; no SSH, providers, or actual operator files."""
import contextlib
import importlib
import io
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    handoff = importlib.import_module('_handoff')
    shared = importlib.import_module('_shared')
finally:
    sys.path.pop(0)


class InitializationHandoffTests(unittest.TestCase):
    def setUp(self):
        app_patch = patch.object(handoff, 'ensure_ci_app_access')
        self.app_access = app_patch.start()
        self.addCleanup(app_patch.stop)
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.local = self.directory / 'workstation'
        self.local.mkdir(mode=0o700)
        self.env = self.local / 'values.env'
        text = (SCRIPTS.parent / '.env.example').read_text()
        self.env.write_text(text.replace('your-github-login', 'brunotot')
                           .replace('admin@example.com', 'admin@vireocode.com'))
        self.env.chmod(0o600)
        self.args = SimpleNamespace(env=self.env, return_progress=False)
        self.ctx = shared.load_context(self.args, require_verified=False)
        receipt = {'schema': 1, 'env_sha256': shared.env_hash(self.env),
                   'verifier_sha256': shared.verifier_hash(), 'repository': self.ctx.values['REPOSITORY'],
                   'scope': 'full', 'mode': 'new', 'verified_at': time.time(),
                   'evidence': {'github': {'repository_id': 123}}}
        shared._write_json(self.local / 'verification.json', receipt)
        shared.update_state(self.ctx, repository_id=123, local_checked=True)
        self.ctx = shared.load_context(self.args)
        self.bundle = handoff.snapshot(self.env)
        self.host = self.directory / 'inventory-portal-initialization'
        self.addCleanup(patch.stopall)
        self.destination_patch = patch.object(handoff, 'destination', return_value=self.host)
        self.destination_patch.start()
        self.source = patch.object(handoff, 'ci_source').start()
        patch.object(shared.os, 'geteuid', return_value=0).start()

    def receive(self, bundle=None):
        return handoff.receive(self.bundle if bundle is None else bundle)

    def remote_progress(self, **updates):
        bundle = dict(self.bundle)
        state = json.loads(bundle['progress.json'])
        state.update(updates)
        bundle['progress.json'] = json.dumps(state, indent=4).encode() + b'\n'
        return bundle

    def transfer(self, response=None, effect=None):
        with patch.object(handoff, 'context', return_value=self.ctx), \
                patch.object(handoff, 'execute', return_value=response, side_effect=effect) as execute, \
                contextlib.redirect_stdout(io.StringIO()) as output:
            handoff.transfer(self.args)
        return execute, output.getvalue()

    def test_upload_preserves_exact_bytes_private_modes_and_only_three_files(self):
        with patch.object(os, 'umask', wraps=os.umask):
            self.assertEqual(self.receive(), self.host)
        self.assertEqual(handoff.snapshot(self.host / 'values.env'), self.bundle)
        self.assertEqual(self.host.stat().st_mode & 0o777, 0o700)
        self.assertEqual({path.name for path in self.host.iterdir()}, set(handoff.FILES))
        self.assertTrue(all(path.stat().st_mode & 0o777 == 0o600 for path in self.host.iterdir()))
        self.source.assert_called_once()

    def test_identical_retry_is_noop_and_preserves_inode(self):
        self.receive()
        before = {path.name: path.stat().st_ino for path in self.host.iterdir()}
        self.receive()
        self.assertEqual({path.name: path.stat().st_ino for path in self.host.iterdir()}, before)

    def test_differing_existing_host_state_is_not_replaced(self):
        self.receive()
        progress = self.host / 'progress.json'
        progress.write_bytes(self.remote_progress(ci_registered=True)['progress.json'])
        before = handoff.snapshot(self.host / 'values.env')
        with self.assertRaises(shared.InitError):
            self.receive()
        self.assertEqual(handoff.snapshot(self.host / 'values.env'), before)

    def test_partial_or_unsafe_existing_host_state_is_preserved(self):
        self.host.mkdir(mode=0o700)
        (self.host / 'values.env').write_bytes(b'partial')
        (self.host / 'values.env').chmod(0o600)
        with self.assertRaises(shared.InitError):
            self.receive()
        self.assertEqual((self.host / 'values.env').read_bytes(), b'partial')
        self.assertFalse((self.host / 'verification.json').exists())

    def test_symlink_and_insecure_host_files_rejected(self):
        self.receive()
        target = self.host / 'progress.json'
        target.chmod(0o644)
        with self.assertRaises(shared.InitError):
            self.receive()
        target.unlink()
        target.symlink_to(self.local / 'progress.json')
        with self.assertRaises(shared.InitError):
            self.receive()
        self.assertTrue(target.is_symlink())

    def test_missing_progress_fails_before_ssh(self):
        (self.local / 'progress.json').unlink()
        with patch.object(handoff, 'context', return_value=self.ctx), patch.object(handoff, 'execute') as execute:
            with self.assertRaises(shared.InitError):
                handoff.transfer(self.args)
            execute.assert_not_called()

    def test_receipt_scope_freshness_and_repository_id_are_required(self):
        for changes in ({'verified_at': time.time()-86401}, {'scope': 'local'},
                        {'evidence': {'github': {'repository_id': 124}}},
                        {'evidence': {'github': {'repository_id': True}}}):
            bundle = dict(self.bundle)
            receipt = json.loads(bundle['verification.json'])
            receipt.update(changes)
            bundle['verification.json'] = json.dumps(receipt).encode()
            with self.subTest(changes=changes), self.assertRaises(shared.InitError):
                self.receive(bundle)
            self.assertFalse(self.host.exists())

    def test_progress_identity_and_env_binding_rejected_before_write(self):
        for change in ({'repository': 'vireocodedev/other-app'}, {'env_sha256': 'changed'},
                       {'repository_id': True}, {'repository_id': 0}):
            with self.subTest(change=change), self.assertRaises(shared.InitError):
                self.receive(self.remote_progress(**change))
            self.assertFalse(self.host.exists())

    def test_source_rejection_happens_before_destination_write(self):
        self.source.side_effect = shared.InitError('Require canonical reviewed source.')
        with self.assertRaises(shared.InitError):
            self.receive()
        self.assertFalse(self.host.exists())

    def test_envelope_rejects_extra_missing_duplicate_and_oversized_files(self):
        encoded = handoff.encode(self.bundle)
        self.assertEqual(handoff.decode(encoded), self.bundle)
        invalid = [encoded.replace('"schema": 1', '"schema": 1, "schema": 1'),
                   encoded.replace('"schema": 1', '"schema": true'),
                   handoff.encode({**self.bundle, 'token.env': b'secret'}),
                   handoff.encode({'values.env': self.bundle['values.env']}),
                   handoff.encode({**self.bundle, 'values.env': b'x' * 65537}),
                   'x' * (handoff.MAX_ENVELOPE + 1)]
        for text in invalid:
            with self.subTest(length=len(text)), self.assertRaises(shared.InitError):
                handoff.decode(text)

    def test_app_access_failure_prevents_upload(self):
        self.app_access.side_effect = shared.InitError('App access unavailable')
        with self.assertRaisesRegex(shared.InitError, 'App access unavailable'):
            self.transfer(response='accepted')

    def test_upload_uses_strict_ssh_and_captured_three_file_payload(self):
        execute, output = self.transfer(response='accepted')
        self.app_access.assert_called_once()
        arguments = execute.call_args.args[0]
        self.assertEqual(arguments[:6], ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
                                         'root@46.224.72.162'])
        remote = shlex.split(arguments[-1])
        self.assertEqual(remote[:4], ['python3', '-I', '-B', '-c'])
        self.assertEqual(remote[-2:], ['/root/web-app-starter', 'upload'])
        self.assertIn("from _handoff import remote_main", remote[4])
        self.assertEqual(handoff.decode(execute.call_args.kwargs['input']), self.bundle)
        self.assertEqual(output.count('--env /root/inventory-portal-initialization/values.env'), 4)
        for name in ('11_2_prepare_registration.py', '11_3_stop_and_inspect_ci.py',
                     '11_4_register_and_validate_ci.py', '11_5_activate_ci.py'):
            self.assertIn('/root/web-app-starter/docs/template-initialization/scripts/' + name, output)
        self.assertNotIn('CURRENT_OBSERVED_CONFIG_SHA256', output)
        self.assertIn('step 11.3 records the configuration hash', output)
        self.assertIn('--reviewed', output)
        self.assertNotIn(self.env.read_text(), output)

    def test_return_only_updates_progress_preserving_exact_bytes_and_mode(self):
        self.args.return_progress = True
        actual = self.remote_progress(ci_registered=True)
        self.transfer(response=handoff.encode(actual))
        self.app_access.assert_not_called()
        self.assertEqual(handoff.snapshot(self.env), actual)
        self.assertEqual((self.local / 'progress.json').stat().st_mode & 0o777, 0o600)

    def test_remote_return_validates_current_host_files_without_mutation(self):
        self.receive()
        actual = self.remote_progress(ci_registered=True)
        (self.host / 'progress.json').write_bytes(actual['progress.json'])
        self.assertEqual(handoff.return_bundle(self.bundle), actual)
        self.assertEqual(handoff.snapshot(self.host / 'values.env'), actual)

    def test_return_conflict_or_removed_local_observation_preserves_local_state(self):
        self.args.return_progress = True
        for change in ({'repository_id': 124}, {'local_checked': False}, {'local_checked': 1},
                       {'repository': 'other/project'}):
            with self.subTest(change=change), self.assertRaises(shared.InitError):
                self.transfer(response=handoff.encode(self.remote_progress(**change)))
            self.assertEqual(handoff.snapshot(self.env), self.bundle)
        missing = self.remote_progress()
        state = json.loads(missing['progress.json'])
        del state['local_checked']
        missing['progress.json'] = json.dumps(state).encode()
        with self.assertRaises(shared.InitError):
            self.transfer(response=handoff.encode(missing))
        self.assertEqual(handoff.snapshot(self.env), self.bundle)

    def test_return_rejects_changed_env_or_receipt_even_with_same_identity(self):
        self.args.return_progress = True
        for name in ('values.env', 'verification.json'):
            changed = dict(self.bundle)
            changed[name] += b'\n'
            # A trailing newline changes exact bytes even if parsed JSON is equal.
            with self.subTest(name=name), self.assertRaises(shared.InitError):
                self.transfer(response=handoff.encode(changed))
            self.assertEqual(handoff.snapshot(self.env), self.bundle)

    def test_local_change_during_ssh_is_not_overwritten(self):
        self.args.return_progress = True
        changed = self.remote_progress(workstation_new_observation=True)['progress.json']
        def concurrent_change(*args, **kwargs):
            (self.local / 'progress.json').write_bytes(changed)
            return handoff.encode(self.remote_progress(ci_registered=True))
        with self.assertRaises(shared.InitError):
            self.transfer(effect=concurrent_change)
        self.assertEqual((self.local / 'progress.json').read_bytes(), changed)

    def test_identity_replacement_after_context_is_rejected_before_ssh(self):
        changed = self.env.read_text().replace('inventory-portal', 'different-app')
        self.env.write_text(changed)
        new_ctx = shared.load_context(self.args, require_verified=False)
        receipt = json.loads(self.bundle['verification.json'])
        receipt.update(env_sha256=shared.env_hash(self.env), repository=new_ctx.values['REPOSITORY'])
        shared._write_json(self.local / 'verification.json', receipt)
        state = json.loads(self.bundle['progress.json'])
        state.update(env_sha256=shared.env_hash(self.env), repository=new_ctx.values['REPOSITORY'])
        shared._write_json(self.local / 'progress.json', state)
        with patch.object(handoff, 'context', return_value=self.ctx), patch.object(handoff, 'execute') as execute:
            with self.assertRaisesRegex(shared.InitError, 'values changed during validation'):
                handoff.transfer(self.args)
            execute.assert_not_called()

    def test_progress_change_during_temporary_fsync_is_not_overwritten(self):
        self.args.return_progress = True
        actual = self.remote_progress(ci_registered=True)
        changed = self.remote_progress(workstation_late_observation=True)['progress.json']
        real_fsync = os.fsync
        def concurrent_change(descriptor):
            real_fsync(descriptor)
            # Validation also fsyncs staged files; change only the final local temp.
            if Path('/proc/self/fd/' + str(descriptor)).resolve().parent == self.local:
                (self.local / 'progress.json').write_bytes(changed)
        with patch.object(handoff.os, 'fsync', side_effect=concurrent_change):
            with self.assertRaises(shared.InitError):
                self.transfer(response=handoff.encode(actual))
        self.assertEqual((self.local / 'progress.json').read_bytes(), changed)
        self.assertFalse(list(self.local.glob('.progress.json.*')))

    def test_return_enforces_mode_under_restrictive_umask(self):
        self.args.return_progress = True
        previous = os.umask(0o777)
        try:
            self.transfer(response=handoff.encode(self.remote_progress(ci_registered=True)))
        finally:
            os.umask(previous)
        self.assertEqual((self.local / 'progress.json').stat().st_mode & 0o777, 0o600)

    def test_actual_destination_uses_slug_and_rejects_unsafe_ancestors_and_symlinks(self):
        self.destination_patch.stop()
        operator_root = self.directory / 'operator'
        operator_root.mkdir(mode=0o700)
        original_lstat = Path.lstat
        def root_controlled(path, *args, **kwargs):
            info = list(original_lstat(path, *args, **kwargs))
            info[4] = 0
            info[0] &= ~0o022
            return os.stat_result(info)
        with patch.object(handoff, 'HOST_ROOT', operator_root), \
                patch.object(Path, 'lstat', root_controlled):
            expected = operator_root / 'inventory-portal-initialization'
            self.assertEqual(handoff.destination(self.ctx), expected)
            def unsafe(path, *args, **kwargs):
                info = list(root_controlled(path, *args, **kwargs))
                if path == operator_root:
                    info[0] |= 0o020
                return os.stat_result(info)
            with patch.object(Path, 'lstat', unsafe), self.assertRaises(shared.InitError):
                handoff.destination(self.ctx)
            expected.symlink_to(self.local, target_is_directory=True)
            with self.assertRaises(shared.InitError):
                handoff.destination(self.ctx)

    def test_generated_isolated_bootstrap_dispatches_actual_canonical_helper(self):
        source = self.directory / 'canonical'
        scripts = source / 'docs/template-initialization/scripts'
        scripts.mkdir(parents=True)
        for name in ('_handoff.py', '_shared.py', '_operations.py', '_github_bootstrap.py'):
            shutil.copyfile(SCRIPTS / name, scripts / name)
        # Root ownership is a mocked host seam; imports and dispatch are real in
        # the isolated interpreter using the exact generated bootstrap unchanged.
        harness = """import os, sys
from pathlib import Path
from unittest.mock import patch
original = Path.lstat
def root_controlled(path, *args, **kwargs):
    info = list(original(path, *args, **kwargs))
    info[4] = 0
    info[0] &= ~0o022
    return os.stat_result(info)
with patch.object(Path, 'lstat', root_controlled):
    exec(sys.argv[3])
"""
        remote = shlex.split(handoff.remote_arguments(self.ctx, 'upload')[-1])
        poisoned = self.directory / 'poison'
        poisoned.mkdir()
        (poisoned / '_handoff.py').write_text("raise RuntimeError('POISONED IMPORT')\n")
        result = subprocess.run([sys.executable, '-I', '-B', '-c', harness, str(source), 'upload', remote[4]],
                                input='invalid protected envelope', capture_output=True, text=True, timeout=10,
                                env={**os.environ, 'PYTHONPATH': str(poisoned)})
        self.assertEqual(result.returncode, 1)
        self.assertIn('Initialization state transfer rejected;', result.stderr)
        self.assertNotIn('Require the latest reviewed', result.stderr)
        self.assertNotIn('POISONED IMPORT', result.stderr)
        self.assertEqual(result.stdout, '')

    def test_remote_errors_never_print_payload(self):
        secret = 'UNPRINTABLE-PRIVATE-DATA'
        with patch.object(sys, 'stdin', io.StringIO(secret)), \
                contextlib.redirect_stderr(io.StringIO()) as errors, \
                contextlib.redirect_stdout(io.StringIO()) as output:
            with self.assertRaises(SystemExit):
                handoff.remote_main('upload')
        self.assertNotIn(secret, errors.getvalue() + output.getvalue())

    def test_cli_help_performs_no_setup(self):
        result = subprocess.run([sys.executable, '-B', str(SCRIPTS / '11_1_transfer_state.py'), '--help'],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('--return-progress', result.stdout)
        self.assertFalse(self.host.exists())


if __name__ == '__main__':
    unittest.main()
