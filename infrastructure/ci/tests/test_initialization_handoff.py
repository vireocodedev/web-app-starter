"""Section-11 transport contracts; no SSH, providers, or actual operator files."""
import contextlib
import importlib
import io
import json
import os
from pathlib import Path
import shlex
import shutil
import stat
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

    def release_inputs(self):
        self.receive()
        host = self.remote_progress(ci_registered=True)
        (self.host / 'progress.json').write_bytes(host['progress.json'])
        shared.update_state(self.ctx, source_sha='a' * 40,
                            release_branch=self.ctx.values['RELEASE_BRANCH'],
                            staging_workflow_id=456, production_workflow_id=789)
        self.args.release_context = True
        return handoff.snapshot(self.env), host

    def release_response(self, *args, **kwargs):
        return handoff.encode(handoff.reconcile_release(handoff.decode(kwargs['input'])))

    def test_release_context_merges_both_contexts_with_private_original_backups(self):
        local, host = self.release_inputs()
        execute, output = self.transfer(effect=self.release_response)
        merged = handoff.snapshot(self.env)
        self.assertEqual(merged, handoff.snapshot(self.host / 'values.env'))
        state = json.loads(merged['progress.json'])
        self.assertIs(state['ci_registered'], True)
        self.assertEqual(state['source_sha'], 'a' * 40)
        self.assertEqual(state['staging_workflow_id'], 456)
        self.assertEqual(state['production_workflow_id'], 789)
        for directory, original in ((self.local, local), (self.host, host)):
            backups = list(directory.glob('.release-context-backup-*'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].stat().st_mode & 0o777, 0o700)
            self.assertEqual(handoff.snapshot(backups[0] / 'values.env'), original)
            self.assertEqual({item.name for item in backups[0].iterdir()}, set(handoff.FILES))
            self.assertTrue(all(item.stat().st_mode & 0o777 == 0o600 for item in backups[0].iterdir()))
            self.assertFalse(list(directory.glob('.progress.json.*')))
        self.app_access.assert_not_called()
        self.assertEqual(shlex.split(execute.call_args.args[0][-1])[-1], 'reconcile-release')
        self.assertIn('/root/web-app-starter/docs/template-initialization/scripts/14_2_prepare_release_source.py', output)
        self.assertIn('--env /root/inventory-portal-initialization/values.env --source-sha ' + 'a' * 40, output)
        self.assertNotIn(self.env.read_text(), output)

    def test_release_backup_directories_are_durable_before_progress_replacement(self):
        local, host = self.release_inputs()
        actual = handoff.merge_progress(local, json.loads(local['progress.json']),
                                        host, json.loads(host['progress.json']))
        events = []
        opens = []
        real_fsync, real_replace, real_open = os.fsync, os.replace, os.open
        def record_fsync(descriptor):
            real_fsync(descriptor)
            path = Path('/proc/self/fd/' + str(descriptor)).resolve()
            if path == self.local:
                events.append('progress-parent' if 'replace' in events else 'backup-parent')
            elif path.name.startswith('.release-context-backup-'):
                events.append('backup-directory')
            elif path.parent.name.startswith('.release-context-backup-'):
                events.append('backup-file')
        def record_replace(*args):
            events.append('replace')
            return real_replace(*args)
        def record_open(path, flags, *args, **kwargs):
            if flags & os.O_DIRECTORY:
                opens.append((Path(path), flags))
            return real_open(path, flags, *args, **kwargs)
        with patch.object(handoff.os, 'fsync', side_effect=record_fsync), \
                patch.object(handoff.os, 'replace', side_effect=record_replace), \
                patch.object(handoff.os, 'open', side_effect=record_open):
            handoff.replace_progress(self.env, local, actual, backup=True)
        self.assertEqual(events, ['backup-file'] * 3
                         + ['backup-directory', 'backup-parent', 'replace', 'progress-parent'])
        self.assertEqual(len(opens), 3)
        self.assertTrue(all(flags & os.O_DIRECTORY and flags & os.O_NOFOLLOW for _, flags in opens))
        backup = next(self.local.glob('.release-context-backup-*'))
        self.assertEqual(handoff.snapshot(backup / 'values.env'), local)
        self.assertEqual(backup.stat().st_mode & 0o777, 0o700)
        self.assertTrue(all(path.stat().st_mode & 0o777 == 0o600 for path in backup.iterdir()))

    def test_release_backup_directory_sync_failure_preserves_original_progress(self):
        local, host = self.release_inputs()
        actual = handoff.merge_progress(local, json.loads(local['progress.json']),
                                        host, json.loads(host['progress.json']))
        real_fsync = os.fsync
        for failing in ('backup-directory', 'backup-parent'):
            def fail_directory_sync(descriptor):
                path = Path('/proc/self/fd/' + str(descriptor)).resolve()
                if stat.S_ISDIR(os.fstat(descriptor).st_mode):
                    kind = 'backup-parent' if path == self.local else 'backup-directory'
                    if kind == failing:
                        raise OSError('directory fsync unavailable')
                return real_fsync(descriptor)
            with self.subTest(failing=failing), \
                    patch.object(handoff.os, 'fsync', side_effect=fail_directory_sync), \
                    patch.object(handoff.os, 'replace') as replace:
                with self.assertRaises(OSError):
                    handoff.replace_progress(self.env, local, actual, backup=True)
                replace.assert_not_called()
            self.assertEqual(handoff.snapshot(self.env), local)
            self.assertFalse(list(self.local.glob('.progress.json.*')))
        for backup in self.local.glob('.release-context-backup-*'):
            self.assertEqual(handoff.snapshot(backup / 'values.env'), local)
            self.assertEqual(backup.stat().st_mode & 0o777, 0o700)
            self.assertTrue(all(path.stat().st_mode & 0o777 == 0o600 for path in backup.iterdir()))

    def test_release_post_replace_sync_failure_reports_uncertainty_and_retry_finishes_durability(self):
        local, host = self.release_inputs()
        actual = handoff.merge_progress(local, json.loads(local['progress.json']),
                                        host, json.loads(host['progress.json']))
        replaced = False
        real_replace, real_sync = os.replace, handoff.sync_private_directory
        def record_replace(*args):
            nonlocal replaced
            real_replace(*args)
            replaced = True
        def fail_after_replace(path):
            if replaced:
                raise OSError('post-replace fsync unavailable')
            return real_sync(path)
        with patch.object(handoff.os, 'replace', side_effect=record_replace), \
                patch.object(handoff, 'sync_private_directory', side_effect=fail_after_replace):
            with self.assertRaisesRegex(shared.InitError, 'was replaced.*durability is uncertain'):
                handoff.replace_progress(self.env, local, actual, backup=True)
        self.assertEqual(handoff.snapshot(self.env), actual)
        backup = next(self.local.glob('.release-context-backup-*'))
        self.assertEqual(handoff.snapshot(backup / 'values.env'), local)
        with patch.object(handoff, 'sync_private_directory', wraps=real_sync) as sync, \
                patch.object(handoff.os, 'replace') as replace:
            handoff.replace_progress(self.env, actual, actual, backup=True)
        sync.assert_called_once_with(self.local)
        replace.assert_not_called()
        self.assertEqual(len(list(self.local.glob('.release-context-backup-*'))), 1)

    def test_backup_directory_sync_rejects_symlink(self):
        link = self.directory / 'unsafe-backup'
        link.symlink_to(self.local, target_is_directory=True)
        with self.assertRaises(OSError):
            handoff.sync_private_directory(link)

    def test_release_context_repeated_transfer_is_noop(self):
        self.release_inputs()
        self.transfer(effect=self.release_response)
        before = {(directory, path.name): path.stat().st_ino
                  for directory in (self.local, self.host) for path in directory.iterdir()}
        self.transfer(effect=self.release_response)
        after = {(directory, path.name): path.stat().st_ino
                 for directory in (self.local, self.host) for path in directory.iterdir()}
        self.assertEqual(after, before)

    def test_release_context_requires_source_branch_and_actual_workflow_ids_before_ssh(self):
        self.args.release_context = True
        for change in ({}, {'source_sha': 'invalid'}, {'source_sha': 'a' * 40},
                       {'source_sha': 'a' * 40, 'release_branch': 'other'},
                       {'source_sha': 'a' * 40, 'release_branch': self.ctx.values['RELEASE_BRANCH'],
                        'staging_workflow_id': True, 'production_workflow_id': 789},
                       {'source_sha': 'a' * 40, 'release_branch': self.ctx.values['RELEASE_BRANCH'],
                        'staging_workflow_id': 456, 'production_workflow_id': 0}):
            shared._write_json(self.local / 'progress.json', json.loads(self.remote_progress(**change)['progress.json']))
            with self.subTest(change=change), patch.object(handoff, 'execute') as execute:
                with self.assertRaises(shared.InitError):
                    self.transfer()
                execute.assert_not_called()
        self.app_access.assert_not_called()

    def test_release_conflicts_preserve_both_copies_without_secret_values(self):
        local, host = self.release_inputs()
        for change in ({'source_sha': 'b' * 40}, {'local_checked': 1},
                       {'repository_id': 124}, {'repository': 'other/project'}):
            changed = dict(host)
            state = json.loads(host['progress.json'])
            state.update(change)
            changed['progress.json'] = json.dumps(state).encode()
            (self.host / 'progress.json').write_bytes(changed['progress.json'])
            with self.subTest(change=change), self.assertRaises(shared.InitError) as error:
                handoff.reconcile_release(local)
            self.assertNotIn('b' * 40, str(error.exception))
            self.assertEqual(handoff.snapshot(self.env), local)
            self.assertEqual(handoff.snapshot(self.host / 'values.env'), changed)
            self.assertFalse(list(self.host.glob('.release-context-backup-*')))
        observed = json.loads(host['progress.json'])
        expected = json.loads(local['progress.json'])
        expected['private_observation'] = {'enabled': True}
        observed['private_observation'] = {'enabled': 1}
        with self.assertRaisesRegex(shared.InitError, 'private_observation'):
            handoff.merge_progress(local, expected, host, observed)

    def test_release_receipt_and_values_must_match_exact_bytes(self):
        local, host = self.release_inputs()
        for name in ('values.env', 'verification.json'):
            changed = dict(host)
            changed[name] += b'\n'
            (self.host / name).write_bytes(changed[name])
            with self.subTest(name=name), self.assertRaises(shared.InitError):
                handoff.reconcile_release(local)
            self.assertEqual(handoff.snapshot(self.env), local)
            self.assertEqual(handoff.snapshot(self.host / 'values.env'), changed)
            (self.host / name).write_bytes(host[name])

    def test_release_rejects_unsafe_host_files_and_stale_receipt_without_backups(self):
        local, host = self.release_inputs()
        progress = self.host / 'progress.json'
        progress.chmod(0o644)
        with self.assertRaises(shared.InitError):
            handoff.reconcile_release(local)
        progress.chmod(0o600)
        progress.unlink()
        progress.symlink_to(self.local / 'progress.json')
        with self.assertRaises(shared.InitError):
            handoff.reconcile_release(local)
        progress.unlink()
        handoff.exclusive_write(progress, host['progress.json'])
        receipt = json.loads(host['verification.json'])
        receipt['verified_at'] = time.time() - 86401
        shared._write_json(self.host / 'verification.json', receipt)
        with self.assertRaises(shared.InitError):
            handoff.reconcile_release(local)
        self.assertFalse(list(self.host.glob('.release-context-backup-*')))

    def test_release_fsync_races_do_not_overwrite_new_progress_on_either_side(self):
        local, host = self.release_inputs()
        real_fsync = os.fsync
        for directory in (self.host, self.local):
            changed = json.loads((host if directory == self.host else local)['progress.json'])
            changed['concurrent_private_observation'] = True
            encoded = json.dumps(changed).encode()
            def concurrent_change(descriptor):
                real_fsync(descriptor)
                target = Path('/proc/self/fd/' + str(descriptor)).resolve()
                if target.parent == directory and target.name.startswith('.progress.json.'):
                    (directory / 'progress.json').write_bytes(encoded)
            with self.subTest(directory=directory.name), patch.object(handoff.os, 'fsync', side_effect=concurrent_change):
                with self.assertRaises(shared.InitError):
                    self.transfer(effect=self.release_response)
            self.assertEqual((directory / 'progress.json').read_bytes(), encoded)
            self.assertFalse(list(directory.glob('.progress.json.*')))
            # Reset only this fixture's files for the second independent race.
            for name, data in host.items():
                (self.host / name).write_bytes(data)
            for name, data in local.items():
                (self.local / name).write_bytes(data)

    def test_release_interruption_after_host_commit_resumes_without_lost_observations(self):
        local, _ = self.release_inputs()
        def interrupted(*args, **kwargs):
            self.release_response(*args, **kwargs)
            raise shared.InitError('SSH response lost')
        with self.assertRaisesRegex(shared.InitError, 'SSH response lost'):
            self.transfer(effect=interrupted)
        self.assertEqual(handoff.snapshot(self.env), local)
        committed = handoff.snapshot(self.host / 'values.env')
        host_inode = (self.host / 'progress.json').stat().st_ino
        self.transfer(effect=self.release_response)
        self.assertEqual(handoff.snapshot(self.env), committed)
        self.assertEqual((self.host / 'progress.json').stat().st_ino, host_inode)
        self.assertEqual(len(list(self.host.glob('.release-context-backup-*'))), 1)

    def test_release_response_must_preserve_all_workstation_observations(self):
        local, host = self.release_inputs()
        with self.assertRaises(shared.InitError):
            self.transfer(response=handoff.encode(host))
        self.assertEqual(handoff.snapshot(self.env), local)
        self.assertFalse(list(self.local.glob('.release-context-backup-*')))

    def test_remote_release_conflict_reports_only_safe_fields_to_workstation(self):
        local, host = self.release_inputs()
        changed = json.loads(host['progress.json'])
        changed['source_sha'] = 'b' * 40
        changed['private_observation'] = 'HOST-PRIVATE-VALUE'
        shared._write_json(self.host / 'progress.json', changed)
        shared.update_state(self.ctx, private_observation='LOCAL-PRIVATE-VALUE')
        local = handoff.snapshot(self.env)
        host = handoff.snapshot(self.host / 'values.env')
        def canonical_dispatch(*args, **kwargs):
            with patch.object(sys, 'stdin', io.StringIO(kwargs['input'])), \
                    contextlib.redirect_stdout(io.StringIO()) as output, \
                    contextlib.redirect_stderr(io.StringIO()) as errors:
                handoff.remote_main('reconcile-release')
            self.assertEqual(errors.getvalue(), '')
            response = output.getvalue()
            self.assertEqual(json.loads(response), {'schema': 1, 'error': 'progress_conflict',
                                                   'fields': ['private_observation', 'source_sha']})
            return response
        with self.assertRaisesRegex(shared.InitError, 'private_observation, source_sha') as error:
            self.transfer(effect=canonical_dispatch)
        for secret in ('b' * 40, 'HOST-PRIVATE-VALUE', 'LOCAL-PRIVATE-VALUE'):
            self.assertNotIn(secret, str(error.exception))
        self.assertEqual(handoff.snapshot(self.env), local)
        self.assertEqual(handoff.snapshot(self.host / 'values.env'), host)
        self.assertFalse(list(self.host.glob('.release-context-backup-*')))
        self.assertFalse(list(self.local.glob('.release-context-backup-*')))

    def test_release_conflict_response_rejects_unbounded_or_unrecognized_diagnostics(self):
        valid = {'schema': 1, 'error': 'progress_conflict', 'fields': ['source_sha']}
        invalid = [dict(valid, fields=['not a field']), dict(valid, fields=['x' * 65]),
                   dict(valid, fields=['source_sha'] * 65), dict(valid, fields=[]),
                   dict(valid, fields=[True]), dict(valid, fields=[{}]),
                   dict(valid, schema=True), dict(valid, error='RAW-REMOTE-ERROR'),
                   dict(valid, detail='PRIVATE-DIAGNOSTIC')]
        for response in invalid:
            with self.subTest(response=response), self.assertRaises(shared.InitError) as error:
                handoff.release_response(json.dumps(response))
            self.assertNotIn('PRIVATE-DIAGNOSTIC', str(error.exception))
            self.assertNotIn('RAW-REMOTE-ERROR', str(error.exception))

    def test_transfer_modes_are_mutually_exclusive(self):
        result = subprocess.run([sys.executable, '-B', str(SCRIPTS / '11_1_transfer_state.py'),
                                 '--release-context', '--return-progress'],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 2)
        self.assertIn('not allowed with argument', result.stderr)
        self.app_access.assert_not_called()

    def test_cli_help_performs_no_setup(self):
        result = subprocess.run([sys.executable, '-B', str(SCRIPTS / '11_1_transfer_state.py'), '--help'],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('--return-progress', result.stdout)
        self.assertIn('--release-context', result.stdout)
        self.assertFalse(self.host.exists())


if __name__ == '__main__':
    unittest.main()
