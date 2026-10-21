"""Pinned serial probe repair and retained-ledger guards; no host/API changes."""
import contextlib
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('postgres_repair_manage', ROOT / 'manage.py')
manage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manage)
ctl = manage.ctl
BASELINE = json.loads((ROOT / 'ci-runner/config.example.json').read_text())
POOL = json.loads((ROOT / 'ci-runner/config.pool.example.json').read_text())


class ReadinessRepairFixture:
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.base = self.directory / 'base'
        self.installed = self.directory / 'installed'
        self.systemd = self.directory / 'systemd'
        self.source = self.directory / 'source'
        for path in (self.base, self.installed, self.systemd, self.source):
            path.mkdir()
        self.rootfs = self.base / 'rootfs'
        self.runtime = self.rootfs / 'usr/local/lib/web-app-ci'
        self.runtime.mkdir(parents=True)
        self.config = self.directory / 'config.json'
        self.config.write_text(json.dumps(BASELINE))
        self.probe = self.runtime / 'validate-job.py'
        self.old_probe = b'# fixed original serial probe fixture\n'
        self.probe.write_bytes(self.old_probe)
        self.probe.chmod(0o755)
        self.controller = self.installed / 'controller.py'
        self.validation = self.installed / 'validation.py'
        self.app = self.installed / 'github_app.py'
        self.start_job = self.runtime / 'start-job.sh'
        self.service = self.systemd / manage.SERVICE
        for path, content in ((self.validation, b'fixed legacy validation\n'), (self.app, b'fixed unchanged app module\n'),
                              (self.start_job, b'fixed unchanged start job\n'), (self.service, b'fixed unchanged service\n')):
            path.write_bytes(content)
        self.manager = self.systemd / f"user@{BASELINE['uid']}.service.d/web-app-ci.conf"
        self.slice = self.systemd / f"user-{BASELINE['uid']}.slice.d/web-app-ci.conf"
        for path in (self.manager, self.slice):
            path.parent.mkdir()
            path.write_text('fixed original unit\n')
        self.secret = self.directory / 'github-app.pem'
        self.secret.write_text('private credential fixture must not be read\n')
        # This tiny pinned legacy fixture computes a changing boundary from real
        # temporary files. It never models a fabricated host acceptance receipt.
        inputs = [self.config, self.probe, self.controller, self.validation, self.app,
                  self.start_job, self.service, self.manager, self.slice]
        self.controller.write_text('import hashlib\nfrom pathlib import Path\n'
                                   'def boundary_digest(config):\n'
                                   '    digest = hashlib.sha256()\n'
                                   f'    for path in {[str(path) for path in inputs]!r}:\n'
                                   '        digest.update(Path(path).read_bytes())\n'
                                   '    return digest.hexdigest()\n')
        self.paths = {'controller.py': self.controller, 'validation.py': self.validation,
                      'github_app.py': self.app, 'start-job.sh': self.start_job, 'service': self.service}
        self.pins = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in self.paths.items()}
        for name in ('controller.py', 'validation.py', 'provision_slots.py', 'validate-job.py'):
            (self.source / name).write_bytes((manage.SOURCE / name).read_bytes())
        self.new_probe = (self.source / 'validate-job.py').read_bytes()
        self.assertEqual(hashlib.sha256(self.new_probe).hexdigest(), manage.POSTGRES_READINESS_PROBE)
        self.expected_config = hashlib.sha256(self.config.read_bytes()).hexdigest()
        self.receipt = self.base / 'validation.json'
        self.failure_receipt = self.base / 'validation-failure.json'
        self.pool_receipt = self.base / 'pool-validation.json'
        self.reads = []
        self.provisioner = mock.Mock()
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        def read(path):
            self.reads.append(Path(path))
            return Path(path).read_text()
        for patch in (mock.patch.object(manage, 'root_required'), mock.patch.object(manage, 'source_protected'),
                      mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext),
                      mock.patch.object(manage, 'require_idle'), mock.patch.object(manage, 'trusted_executable'),
                      mock.patch.object(manage, 'POSTGRES_LEGACY_COMPONENT_SHA256', self.pins),
                      mock.patch.object(manage, 'POOL_PREDECESSOR', self.pins['controller.py']),
                      mock.patch.object(manage, 'POOL_PREDECESSOR_PROBE', hashlib.sha256(self.old_probe).hexdigest()),
                      mock.patch.object(manage, 'SOURCE', self.source), mock.patch.object(manage, 'INSTALLED', self.installed),
                      mock.patch.object(manage, 'SYSTEMD', self.systemd), mock.patch.object(manage, 'TOKEN', self.secret),
                      mock.patch.object(manage, 'load_slot_provisioner', return_value=self.provisioner),
                      mock.patch.object(ctl, 'CONFIG', self.config), mock.patch.object(ctl, 'BASE', self.base),
                      mock.patch.object(ctl, 'POOL_BASE', self.base), mock.patch.object(ctl, 'ROOTFS', self.rootfs),
                      mock.patch.object(ctl, 'protected_path', side_effect=lambda path, **_kwargs: Path(path)),
                      mock.patch.object(ctl, 'protected_file', side_effect=read), mock.patch.object(ctl, 'command')):
            self.stack.enter_context(patch)
        self.expected_boundary = self.boundary()

    def boundary(self):
        module = {'__name__': 'fixed_legacy_test_fixture', '__file__': str(self.controller)}
        exec(compile(self.controller.read_bytes(), str(self.controller), 'exec'), module)
        return module['boundary_digest'](BASELINE)

    def repair(self, configuration=None, boundary=None):
        return manage.repair_postgres_readiness(configuration or self.expected_config, boundary or self.expected_boundary)

    def completed_rollback(self):
        self.receipt.write_text(json.dumps({'passed': True, 'configuration_sha256': self.expected_config,
                                           'boundary_sha256': self.boundary(),
                                           'boot_id': Path('/proc/sys/kernel/random/boot_id').read_text().strip()}))
        candidate = self.directory / 'pool.json'
        candidate.write_text(json.dumps(POOL))
        manage.migrate_pool(str(candidate), self.expected_config, self.pins['controller.py'])
        manage.rollback_pool(ctl.config_digest())
        ledger_path = manage.pool_migration_directory() / 'ledger.json'
        self.assertEqual(manage.read_pool_migration()['phase'], 'rolled-back')
        return ledger_path, ledger_path.read_bytes()


class SerialReadinessRepairTests(ReadinessRepairFixture, unittest.TestCase):
    def test_changes_only_probe_invalidates_receipts_and_never_uses_credentials(self):
        unchanged = {path: path.read_bytes() for path in [*self.paths.values(), self.config, self.manager, self.slice, self.secret]}
        for receipt in (self.receipt, self.failure_receipt, self.pool_receipt):
            receipt.write_text('{"passed":false}')
        with mock.patch.object(ctl, 'app_credentials') as credentials, mock.patch.object(ctl, 'api') as api:
            result = self.repair()
        self.assertTrue(result['mutation_performed'])
        self.assertTrue(result['full_validation_required'])
        self.assertFalse(result['controller_enabled'])
        self.assertFalse(result['credential_introduced'])
        self.assertEqual(self.probe.read_bytes(), self.new_probe)
        self.assertEqual(self.probe.stat().st_mode & 0o777, 0o755)
        for path, content in unchanged.items():
            self.assertEqual(path.read_bytes(), content)
        self.assertFalse(any(path.exists() for path in (self.receipt, self.failure_receipt, self.pool_receipt)))
        self.assertFalse(manage.pool_migration_directory().exists())
        self.assertFalse((self.installed / '__pycache__').exists())
        self.assertNotIn(self.secret, self.reads)
        credentials.assert_not_called()
        api.assert_not_called()

    def test_prior_passing_receipt_is_not_required(self):
        self.assertFalse(self.receipt.exists())
        self.assertTrue(self.repair()['mutation_performed'])
        self.assertFalse(self.receipt.exists())

    def test_stale_configuration_or_boundary_rejected_without_mutation(self):
        for argument in ('configuration', 'boundary'):
            with self.subTest(argument=argument), mock.patch.object(manage, 'atomic_file') as write, self.assertRaises(ctl.BoundaryError):
                self.repair(**{argument: '0' * 64})
            write.assert_not_called()
            self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_each_legacy_component_pin_is_required(self):
        for name, path in self.paths.items():
            original = path.read_bytes()
            try:
                path.write_bytes(b'unknown later legacy component\n')
                with self.subTest(name=name), self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-legacy-component-changed'):
                    self.repair()
            finally:
                path.write_bytes(original)
        self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_unknown_installed_probe_and_replacement_source_rejected(self):
        self.probe.write_bytes(b'unknown probe\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-unknown-probe'):
            self.repair()
        self.probe.write_bytes(self.old_probe)
        (self.source / 'validate-job.py').write_bytes(b'unknown replacement\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-source-probe-changed'):
            self.repair()
        self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_serial_idle_and_registration_recovery_guards(self):
        self.config.write_text(json.dumps(POOL))
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-requires-serial-installation'):
            self.repair(configuration=ctl.config_digest())
        self.config.write_text(json.dumps(BASELINE))
        with mock.patch.object(manage, 'require_idle', side_effect=ctl.BoundaryError('controller-must-be-stopped-and-disabled')), \
                self.assertRaisesRegex(ctl.BoundaryError, 'controller-must-be-stopped-and-disabled'):
            self.repair()
        manage.ledger_path().write_text('{}')
        with self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            self.repair()
        self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_untrusted_destination_rejected_before_probe_replacement(self):
        def trust(path):
            if path == self.probe:
                raise ctl.BoundaryError('untrusted-pool-migration-destination')
        with mock.patch.object(manage, 'trusted_executable', side_effect=trust), \
                self.assertRaisesRegex(ctl.BoundaryError, 'untrusted-pool-migration-destination'):
            self.repair()
        self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_failed_atomic_replace_leaves_old_probe_and_no_receipt_safe_to_retry(self):
        self.receipt.write_text('{"passed":true}')
        with mock.patch.object(manage.os, 'replace', side_effect=OSError('fixture-before-replace')), self.assertRaises(OSError):
            self.repair()
        self.assertEqual(self.probe.read_bytes(), self.old_probe)
        self.assertFalse(self.receipt.exists())
        self.assertEqual(list(self.runtime.glob('.pool-migration-*')), [])
        self.assertTrue(self.repair()['mutation_performed'])

    def test_failed_directory_fsync_after_replace_leaves_new_probe_and_requires_fresh_boundary(self):
        self.receipt.write_text('{"passed":true}')
        original_sync = manage.sync_directory
        def sync(path):
            if path == self.runtime:
                raise OSError('fixture-after-replace')
            return original_sync(path)
        with mock.patch.object(manage, 'sync_directory', side_effect=sync), self.assertRaises(OSError):
            self.repair()
        self.assertEqual(self.probe.read_bytes(), self.new_probe)
        self.assertFalse(self.receipt.exists())
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-boundary-changed'):
            self.repair()
        with mock.patch.object(manage, 'atomic_file') as write:
            self.assertFalse(self.repair(boundary=self.boundary())['mutation_performed'])
        write.assert_not_called()

    def test_already_repaired_is_literal_no_write_after_all_guards(self):
        self.probe.write_bytes(self.new_probe)
        self.receipt.write_bytes(b'unchanged existing receipt fixture\n')
        original = self.receipt.read_bytes()
        with mock.patch.object(manage, 'atomic_file') as write, mock.patch.object(manage, 'invalidate_pool_receipts') as invalidate:
            result = self.repair(boundary=self.boundary())
        self.assertFalse(result['mutation_performed'])
        self.assertTrue(result['full_validation_required'])
        self.assertEqual(self.receipt.read_bytes(), original)
        write.assert_not_called()
        invalidate.assert_not_called()
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-boundary-changed'):
            self.repair()

    def test_configuration_and_boundary_rechecked_after_ledger_guard(self):
        def drift(*_args):
            self.probe.write_bytes(self.new_probe)
            return None
        with mock.patch.object(manage, 'readiness_repair_ledger', side_effect=drift), \
                mock.patch.object(manage, 'atomic_file') as write, \
                self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-boundary-changed'):
            self.repair()
        write.assert_not_called()
        self.probe.write_bytes(self.old_probe)
        def config_drift(*_args):
            self.config.write_text(json.dumps(dict(BASELINE, poll_seconds=60)))
            return None
        with mock.patch.object(manage, 'readiness_repair_ledger', side_effect=config_drift), \
                mock.patch.object(manage, 'atomic_file') as write, self.assertRaisesRegex(ctl.BoundaryError, 'configuration-changed'):
            self.repair()
        write.assert_not_called()

    def test_cli_requires_explicit_configuration_and_boundary_hashes(self):
        with mock.patch.object(manage, 'root_required'), mock.patch.object(manage, 'repair_postgres_readiness', return_value={}) as repair:
            with self.assertRaises(SystemExit):
                manage.main(['repair-postgres-readiness-v1', '--expected-config-sha256', '0' * 64])
            with mock.patch('builtins.print'):
                self.assertEqual(manage.main(['repair-postgres-readiness-v1', '--expected-config-sha256', '0' * 64,
                                              '--expected-boundary-sha256', '1' * 64]), 0)
        repair.assert_called_once_with('0' * 64, '1' * 64)


class RolledBackReadinessRepairTests(ReadinessRepairFixture, unittest.TestCase):
    def test_completed_rollback_repair_preserves_ledger_and_every_backup_byte(self):
        path, original = self.completed_rollback()
        backups = {entry: entry.read_bytes() for entry in path.parent.iterdir() if entry.is_file()}
        result = self.repair(boundary=self.boundary())
        self.assertTrue(result['mutation_performed'])
        self.assertEqual(path.read_bytes(), original)
        for entry, content in backups.items():
            self.assertEqual(entry.read_bytes(), content)
        self.assertEqual(self.probe.read_bytes(), self.new_probe)
        self.assertFalse(self.receipt.exists())
        self.assertFalse(self.repair(boundary=self.boundary())['mutation_performed'])
        self.assertEqual(path.read_bytes(), original)
        # Completed audit ledgers remain in place and cannot authorize rerunning
        # a serial-to-pool migration, even after the explicit serial repair.
        candidate = self.directory / 'pool-after-repair.json'
        candidate.write_text(json.dumps(POOL))
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-already-started-or-not-serial'):
            manage.migrate_pool(str(candidate), ctl.config_digest(), self.pins['controller.py'])

    def test_in_progress_migration_phases_rejected_without_repair_writes(self):
        path, original = self.completed_rollback()
        for phase in ('prepared', 'applying', 'applied', 'rolling-back'):
            ledger = json.loads(original)
            ledger['phase'] = phase
            ctl.atomic_json(path, ledger)
            with self.subTest(phase=phase), mock.patch.object(manage, 'atomic_file') as write, \
                    self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-requires-completed-rollback'):
                self.repair(boundary=self.boundary())
            write.assert_not_called()
        self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_tampered_backup_or_unknown_completed_candidate_rejected(self):
        path, original = self.completed_rollback()
        backup = path.parent / 'controller.py'
        old_backup = backup.read_bytes()
        backup.write_bytes(b'unknown altered backup\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-backup-changed'):
            self.repair(boundary=self.boundary())
        backup.write_bytes(old_backup)
        ledger = json.loads(original)
        ledger['candidate']['controller.py'] = '0' * 64
        ctl.atomic_json(path, ledger)
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-rollback-candidate-changed'):
            self.repair(boundary=self.boundary())
        self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_completed_ledger_current_source_candidate_drift_is_rejected(self):
        self.completed_rollback()
        (self.source / 'provision_slots.py').write_bytes(b'unknown current source\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-rollback-candidate-changed'):
            self.repair(boundary=self.boundary())
        self.assertEqual(self.probe.read_bytes(), self.old_probe)

    def test_completed_rollback_requires_exact_current_configuration_bytes(self):
        self.completed_rollback()
        # Equal parsed values are insufficient: restore must match the exact
        # protected configuration byte hash sealed in the migration backup.
        self.config.write_text(json.dumps(BASELINE, indent=2) + '\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-rollback-configuration-mismatch'):
            self.repair(configuration=ctl.config_digest(), boundary=self.boundary())

    def test_completed_rollback_requires_exact_restored_manager_and_slice(self):
        self.completed_rollback()
        self.manager.write_text('unknown restored manager configuration\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'postgres-repair-rollback-components-changed'):
            self.repair(boundary=self.boundary())

    def test_completed_candidate_probe_hash_must_be_the_pinned_replacement(self):
        path, _original = self.completed_rollback()
        ledger = json.loads(path.read_text())
        ledger['candidate']['validate-job.py'] = '0' * 64
        ctl.atomic_json(path, ledger)
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-candidate-probe-mismatch'):
            self.repair(boundary=self.boundary())


if __name__ == '__main__':
    unittest.main()
