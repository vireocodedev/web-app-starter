"""Exact, offline scheduler repair: sealed recovery intent and no forged receipts."""
import contextlib
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest import mock

from test_worker_pool import manage, ctl, BASELINE, POOL


def sha(content):
    return hashlib.sha256(content).hexdigest()


class DispatchRepairFixture(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.base = self.root / 'base'
        self.installed = self.root / 'installed'
        self.systemd = self.root / 'systemd'
        self.source = self.root / 'source'
        for directory in (self.base, self.installed, self.systemd, self.source):
            directory.mkdir()
        for source in manage.SOURCE.iterdir():
            if source.is_file():
                shutil.copyfile(source, self.source / source.name)
        self.config = dict(POOL, worker_slots=2)
        self.config_path = self.root / 'config.json'
        self.config_path.write_text(json.dumps(self.config) + '\n')
        self.expected = sha(self.config_path.read_bytes())
        self.previous = b'def verify_pool_receipts(config):\n    return None\n'
        self.controller = self.installed / 'controller.py'
        self.controller.write_bytes(self.previous)
        self.candidate = (self.source / 'controller.py').read_bytes()
        self.write_components()
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.idle = mock.Mock()
        self.protected = mock.Mock(side_effect=lambda path, **_kwargs: Path(path))
        for patch in (mock.patch.object(manage, 'root_required'), mock.patch.object(manage, 'source_protected'),
                      mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext),
                      mock.patch.object(manage, 'require_idle', self.idle), mock.patch.object(manage, 'trusted_executable'),
                      mock.patch.object(manage, 'DISPATCH_PREDECESSOR', sha(self.previous)),
                      mock.patch.object(manage, 'SOURCE', self.source), mock.patch.object(manage, 'INSTALLED', self.installed),
                      mock.patch.object(manage, 'SYSTEMD', self.systemd),
                      mock.patch.object(ctl, 'BASE', self.base), mock.patch.object(ctl, 'POOL_BASE', self.base),
                      mock.patch.object(ctl, 'ROOTFS', self.base / 'rootfs'), mock.patch.object(ctl, 'CONFIG', self.config_path),
                      mock.patch.object(ctl, 'protected_path', self.protected),
                      mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text())):
            self.stack.enter_context(patch)
        self.write_receipts()

    def write_components(self):
        for name in ('validation.py', 'github_app.py', 'provision_slots.py'):
            shutil.copyfile(self.source / name, self.installed / name)
        shutil.copyfile(self.source / manage.SERVICE, self.systemd / manage.SERVICE)
        for index in range(2):
            worker = ctl.slot_config(self.config, index)
            rootfs = self.base / ('rootfs' if not index else f'slots/{index}/rootfs')
            for name in ('start-job.sh', 'validate-job.py', 'busctl-compat.py',
                         'docker.service', 'web-app-job.service', 'web-app-validation.service'):
                if name == 'busctl-compat.py':
                    destination = rootfs / 'usr/local/lib/web-app-ci/runtime-bin/busctl'
                elif name.endswith('.service'):
                    destination = rootfs / 'etc/systemd/user' / name
                else:
                    destination = rootfs / 'usr/local/lib/web-app-ci' / name
                text = (self.source / name).read_text().replace('@UID@', str(worker['uid']))
                text = text.replace('@SUBUID@', str(worker['subuid_start'])).replace('@SUBGID@', str(worker['subuid_start']))
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text(text)

    def write_receipts(self):
        self.receipts = [self.base / 'validation.json', self.base / 'validation-failure.json',
                         self.base / 'slots/1/validation.json', self.base / 'slots/1/validation-failure.json',
                         self.base / 'pool-validation.json']
        for path in self.receipts:
            path.write_text('{"fixture":"predecessor receipt; never restored"}\n')

    def migration(self):
        directory = manage.pool_migration_directory()
        directory.mkdir()
        backups = {}
        for name in manage.migration_destinations(BASELINE):
            content = (self.source / 'validate-job.py').read_bytes() if name == 'validate-job.py' else (name + ' sealed predecessor\n').encode()
            (directory / name).write_bytes(content)
            backups[name] = sha(content)
        ledger = {'migration': manage.POOL_MIGRATION, 'phase': 'applied', 'old_config': BASELINE,
                  'new_config': self.config, 'backups': backups,
                  'candidate': {'controller.py': sha(self.previous), **{name: manage.DISPATCH_UNCHANGED_SHA256[name]
                                for name in ('validation.py', 'provision_slots.py', 'validate-job.py')}}}
        (directory / 'ledger.json').write_text(json.dumps(ledger))
        return {path.name: path.read_bytes() for path in directory.iterdir()}

    def assert_untouched(self):
        self.assertEqual(self.controller.read_bytes(), self.previous)
        self.assertTrue(all(path.exists() for path in self.receipts))
        self.assertFalse(manage.dispatch_repair_directory().exists())

    def repair(self):
        return manage.repair_pool_dispatch(self.expected)

    def rollback(self):
        return manage.rollback_pool_dispatch(self.expected)

    def test_exact_repair_changes_only_controller_removes_all_receipts_and_preserves_migration(self):
        history = self.migration()
        config_bytes = self.config_path.read_bytes()
        components = manage.dispatch_components(self.config)
        result = self.repair()
        self.assertEqual(self.controller.read_bytes(), self.candidate)
        self.assertEqual(self.controller.stat().st_mode & 0o777, 0o755)
        ledger, backup = manage.read_dispatch_repair()
        self.assertEqual(backup, self.previous)
        self.assertEqual(ledger['phase'], 'applied')
        self.assertEqual(ledger['configuration_sha256'], self.expected)
        self.assertEqual(ledger['candidate_sha256'], sha(self.candidate))
        self.assertEqual(ledger['unchanged'], components)
        self.assertFalse(any(path.exists() for path in self.receipts))
        self.assertEqual(self.config_path.read_bytes(), config_bytes)
        self.assertEqual(manage.dispatch_components(self.config), components)
        self.assertEqual({path.name: path.read_bytes() for path in manage.pool_migration_directory().iterdir()}, history)
        self.assertTrue(result['full_validation_required'])
        self.assertFalse(result['controller_enabled'])
        self.assertFalse(result['credential_introduced'])
        self.assertEqual({path.name for path in manage.dispatch_repair_directory().iterdir()}, {'ledger.json', 'controller.py'})

    def test_stale_configuration_serial_pool_and_active_worker_fail_before_any_mutation(self):
        with self.assertRaisesRegex(ctl.BoundaryError, 'configuration-changed'):
            manage.repair_pool_dispatch('0' * 64)
        self.assert_untouched()
        self.idle.side_effect = ctl.BoundaryError('ci-processes-still-active')
        with self.assertRaisesRegex(ctl.BoundaryError, 'ci-processes-still-active'):
            self.repair()
        self.assert_untouched()
        self.idle.side_effect = None
        with mock.patch.object(ctl, 'load_config', return_value=BASELINE), \
                self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-requires-worker-pool'):
            self.repair()
        self.assert_untouched()

    def test_registration_recovery_intent_blocks_repair(self):
        (self.base / 'registration-proof.json').write_text('{}')
        with self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            self.repair()
        self.assert_untouched()

    def test_unknown_predecessor_and_changed_source_or_installed_runtime_rejected(self):
        self.controller.write_bytes(b'unknown controller\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-installed-controller-changed'):
            self.repair()
        self.controller.write_bytes(self.previous)
        path = self.source / 'validation.py'
        original = path.read_bytes()
        path.write_bytes(original + b'\n# unknown source revision\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-source-component-changed'):
            self.repair()
        path.write_bytes(original)
        self.assert_untouched()
        path = self.base / 'slots/1/rootfs/etc/systemd/user/docker.service'
        path.write_bytes(path.read_bytes() + b'\n# unexpected installed change\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-installed-component-changed'):
            self.repair()
        self.assert_untouched()

    def test_actual_predecessor_receipt_guard_rejects_invalid_validation(self):
        previous = b'def verify_pool_receipts(config):\n    raise RuntimeError("stale source/config/boot receipt")\n'
        self.controller.write_bytes(previous)
        with mock.patch.object(manage, 'DISPATCH_PREDECESSOR', sha(previous)), \
                self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-current-validation-required'):
            self.repair()
        self.assertFalse(manage.dispatch_repair_directory().exists())
        self.assertTrue(all(path.exists() for path in self.receipts))

    def test_receipts_are_invalidated_and_backup_sealed_before_controller_replace(self):
        original = manage.atomic_file
        def replace(path, content, mode):
            if path == self.controller:
                ledger, backup = manage.read_dispatch_repair()
                self.assertEqual(ledger['phase'], 'applying')
                self.assertEqual(backup, self.previous)
                self.assertFalse(any(receipt.exists() for receipt in self.receipts))
            original(path, content, mode)
        with mock.patch.object(manage, 'atomic_file', side_effect=replace):
            self.repair()

    def test_interruption_before_replace_or_after_replace_requires_explicit_exact_rollback(self):
        original = manage.atomic_file
        for after in (False, True):
            with self.subTest(after=after):
                def replace(path, content, mode):
                    if path == self.controller:
                        if after:
                            original(path, content, mode)
                        raise OSError('fixture controller replace interruption')
                    original(path, content, mode)
                with mock.patch.object(manage, 'atomic_file', side_effect=replace), self.assertRaises(OSError):
                    self.repair()
                self.assertEqual(manage.read_dispatch_repair()[0]['phase'], 'applying')
                self.assertEqual(self.controller.read_bytes(), self.candidate if after else self.previous)
                with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-already-started'):
                    self.repair()
                self.rollback()
                self.assertEqual(self.controller.read_bytes(), self.previous)
                self.assertEqual(manage.read_dispatch_repair()[0]['phase'], 'rolled-back')
                self.assertFalse(any(path.exists() for path in self.receipts))
                shutil.rmtree(manage.dispatch_repair_directory())
                self.write_receipts()

    def test_interruption_before_receipt_removal_or_final_seal_is_recoverable_without_pass_receipts(self):
        with mock.patch.object(manage, 'invalidate_pool_receipts', side_effect=OSError('fixture before invalidation')), \
                self.assertRaises(OSError):
            self.repair()
        self.assertEqual(manage.read_dispatch_repair()[0]['phase'], 'prepared')
        self.rollback()
        self.assertEqual(self.controller.read_bytes(), self.previous)
        self.assertFalse(any(path.exists() for path in self.receipts))
        shutil.rmtree(manage.dispatch_repair_directory())
        original = ctl.atomic_json
        def seal(path, value):
            if path == manage.dispatch_repair_directory() / 'ledger.json' and value['phase'] == 'applied':
                raise OSError('fixture final seal interruption')
            return original(path, value)
        with mock.patch.object(ctl, 'atomic_json', side_effect=seal), self.assertRaises(OSError):
            self.repair()
        self.assertEqual(self.controller.read_bytes(), self.candidate)
        self.rollback()
        self.assertEqual(self.controller.read_bytes(), self.previous)

    def test_backup_tampering_unknown_current_or_later_source_blocks_rollback(self):
        self.repair()
        backup = manage.dispatch_repair_directory() / 'controller.py'
        backup.write_bytes(b'unknown backup\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-backup-changed'):
            self.rollback()
        backup.write_bytes(self.previous)
        self.controller.write_bytes(b'unknown installed revision\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-installed-controller-changed'):
            self.rollback()
        self.controller.write_bytes(self.candidate)
        (self.source / 'controller.py').write_bytes(self.candidate + b'\n# later source\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-rollback-precondition-changed'):
            self.rollback()
        self.assertEqual(manage.read_dispatch_repair()[0]['phase'], 'applied')

    def test_migration_tampering_and_nonapplied_phase_reject_and_history_never_changes(self):
        history = self.migration()
        ledger_path = manage.pool_migration_directory() / 'ledger.json'
        ledger = json.loads(ledger_path.read_text())
        ledger['phase'] = 'applying'
        ledger_path.write_text(json.dumps(ledger))
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-migration-not-applied'):
            self.repair()
        self.assert_untouched()
        ledger_path.write_bytes(history['ledger.json'])
        self.repair()
        (manage.pool_migration_directory() / 'controller.py').write_text('tampered historical backup')
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-backup-changed'):
            self.rollback()
        self.assertEqual(self.controller.read_bytes(), self.candidate)

    def test_active_repair_blocks_pool_rollback_and_replay_is_rejected_after_rollback(self):
        self.repair()
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-must-be-rolled-back-first'):
            manage.rollback_pool(self.expected)
        self.rollback()
        manage.require_no_active_dispatch_repair()
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-already-rolled-back'):
            self.rollback()
        with self.assertRaisesRegex(ctl.BoundaryError, 'dispatch-repair-already-started'):
            self.repair()

    def test_unknown_ledger_phase_and_keys_never_authorize_rollback(self):
        self.repair()
        path = manage.dispatch_repair_directory() / 'ledger.json'
        original = path.read_text()
        for change in ({'phase': 'unknown'}, {'configuration_sha256': True}, {'extra': 'bad'}):
            value = json.loads(original)
            value.update(change)
            path.write_text(json.dumps(value))
            with self.subTest(change=change), self.assertRaisesRegex(ctl.BoundaryError, 'invalid-dispatch-repair-ledger'):
                self.rollback()
        self.assertEqual(self.controller.read_bytes(), self.candidate)
