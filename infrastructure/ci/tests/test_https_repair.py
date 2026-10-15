import contextlib
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('https_repair_manage', ROOT / 'manage.py')
manage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manage)
ctl = manage.ctl


class HTTPSRepairTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.installed = self.root / 'installed'
        self.installed.mkdir()
        self.systemd = self.root / 'systemd'
        self.systemd.mkdir()
        self.rootfs = self.root / 'rootfs'
        (self.rootfs / 'usr/local/lib/web-app-ci').mkdir(parents=True)
        self.base = self.root / 'state'
        self.base.mkdir()
        self.config = json.loads((ROOT / 'ci-runner/config.example.json').read_text())
        self.config['projects'] = {'app': {'repository': 'Acme/app'}}
        self.config_path = self.root / 'config.json'
        self.config_path.write_text(json.dumps(self.config))
        self.config_sha = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        self.receipt = self.base / 'validation.json'
        self.receipt.write_text('{"passed":true}')
        self.controller = self.installed / 'controller.py'
        self.controller.write_text('old reviewed controller')
        self.controller.chmod(0o755)
        self.app = self.installed / 'github_app.py'
        self.app.write_text('old reviewed app module')
        self.app.chmod(0o755)
        self.controller_sha = hashlib.sha256(self.controller.read_bytes()).hexdigest()
        self.app_sha = hashlib.sha256(self.app.read_bytes()).hexdigest()
        self.key = self.root / 'github-app.pem'
        self.key.write_text('untouched-fixture-key')
        self.unchanged = (
            (self.installed / 'validation.py', manage.SOURCE / 'validation.py'),
            (self.rootfs / 'usr/local/lib/web-app-ci/start-job.sh', manage.SOURCE / 'start-job.sh'),
            (self.rootfs / 'usr/local/lib/web-app-ci/validate-job.py', manage.SOURCE / 'validate-job.py'),
            (self.systemd / manage.SERVICE, manage.SOURCE / manage.SERVICE),
        )
        for destination, source in self.unchanged:
            destination.write_bytes(source.read_bytes())
            destination.chmod(0o644 if destination.suffix == '.service' else 0o755)
        self.active = 'inactive'
        original_lstat = Path.lstat
        def metadata(path):
            info = original_lstat(path)
            mode = info.st_mode & ~0o022 if stat.S_ISDIR(info.st_mode) else info.st_mode
            return SimpleNamespace(st_mode=mode, st_uid=0, st_size=info.st_size)
        patches = contextlib.ExitStack()
        self.addCleanup(patches.close)
        for patch in (
                mock.patch.object(manage, 'root_required'),
                mock.patch.object(manage, 'source_protected'),
                mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext),
                mock.patch.object(manage, 'INSTALLED', self.installed),
                mock.patch.object(manage, 'SYSTEMD', self.systemd),
                mock.patch.object(manage, 'state_of', side_effect=lambda unit, prop:
                                  'disabled' if prop == 'UnitFileState' else self.active),
                mock.patch.object(ctl, 'CONFIG', self.config_path),
                mock.patch.object(ctl, 'BASE', self.base),
                mock.patch.object(ctl, 'STATE', self.base / 'controller.json'),
                mock.patch.object(ctl, 'ROOTFS', self.rootfs),
                mock.patch.object(ctl, 'load_config', side_effect=lambda: copy.deepcopy(self.config)),
                mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()),
                mock.patch.object(ctl, 'protected_path', side_effect=lambda path: Path(path)),
                mock.patch.object(ctl, 'remaining_processes', return_value=[]),
                mock.patch.object(ctl, 'mount_entries', return_value=[]),
                mock.patch.object(ctl, 'command'),
                mock.patch.object(Path, 'lstat', metadata)):
            patches.enter_context(patch)

    def repair(self):
        return manage.repair_https_memory(self.config_sha, self.controller_sha, self.app_sha)

    def test_registered_pool_repair_changes_only_reviewed_modules_and_invalidates_receipt(self):
        previous_config = self.config_path.read_bytes()
        previous_files = {path: path.read_bytes() for path, _ in self.unchanged}
        result = self.repair()
        self.assertEqual(self.controller.read_bytes(), (manage.SOURCE / 'controller.py').read_bytes())
        self.assertEqual(self.app.read_bytes(), (manage.SOURCE / 'github_app.py').read_bytes())
        self.assertEqual(self.config_path.read_bytes(), previous_config)
        self.assertEqual(self.key.read_text(), 'untouched-fixture-key')
        self.assertEqual({path: path.read_bytes() for path, _ in self.unchanged}, previous_files)
        self.assertFalse(self.receipt.exists())
        self.assertTrue(result['full_validation_required'])
        self.assertFalse(result['controller_enabled'])
        self.assertFalse(result['credential_introduced'])
        ctl.command.assert_not_called()

    def test_each_old_hash_and_config_guard_blocks_all_mutation(self):
        for config_sha, controller_sha, app_sha in (
                ('0' * 64, self.controller_sha, self.app_sha),
                (self.config_sha, '0' * 64, self.app_sha),
                (self.config_sha, self.controller_sha, '0' * 64)):
            with self.subTest(config=config_sha, controller=controller_sha, app=app_sha), \
                    self.assertRaises(ctl.BoundaryError):
                manage.repair_https_memory(config_sha, controller_sha, app_sha)
            self.assertTrue(self.receipt.exists())
            self.assertEqual(hashlib.sha256(self.controller.read_bytes()).hexdigest(), self.controller_sha)

    def test_active_or_surviving_job_is_rejected_before_writes(self):
        self.active = 'active'
        with self.assertRaisesRegex(ctl.BoundaryError, 'stopped-and-disabled'):
            self.repair()
        self.active = 'inactive'
        (ctl.STATE).write_text('{"repo":"Acme/app"}')
        with self.assertRaisesRegex(ctl.BoundaryError, 'job-state-not-empty'):
            self.repair()
        self.assertTrue(self.receipt.exists())

    def test_unrelated_source_drift_requires_another_migration(self):
        self.unchanged[0][0].write_text('unreviewed validation change')
        with self.assertRaisesRegex(ctl.BoundaryError, 'https-repair-source-incompatible'):
            self.repair()
        self.assertTrue(self.receipt.exists())

    def test_unsafe_destination_is_rejected_before_receipt_removal(self):
        self.app.chmod(0o666)
        with self.assertRaisesRegex(ctl.BoundaryError, 'untrusted-https-repair'):
            self.repair()
        self.assertTrue(self.receipt.exists())

    def test_interrupted_write_keeps_receipt_invalid_and_controller_disabled(self):
        with mock.patch.object(manage.os, 'replace', side_effect=OSError('fixture')), self.assertRaises(OSError):
            self.repair()
        self.assertFalse(self.receipt.exists())
        self.assertEqual(list(self.installed.glob('.https-repair-*')), [])
        ctl.command.assert_not_called()


if __name__ == '__main__':
    unittest.main()
