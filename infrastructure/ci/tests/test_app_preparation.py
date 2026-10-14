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
spec = importlib.util.spec_from_file_location('app_preparation', ROOT / 'manage.py')
manage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manage)
ctl = manage.ctl


class AppPreparationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        self.installed = self.directory / 'installed'
        self.systemd = self.directory / 'systemd'
        self.installed.mkdir()
        self.systemd.mkdir()
        self.rootfs = self.directory / 'rootfs'
        (self.rootfs / 'usr/local/lib/web-app-ci').mkdir(parents=True)
        self.controller = self.installed / 'controller.py'
        self.controller.write_text('previous reviewed controller')
        self.controller_sha = hashlib.sha256(self.controller.read_bytes()).hexdigest()
        self.config = json.loads((ROOT / 'ci-runner/config.example.json').read_text())
        self.receipt = self.directory / 'validation.json'
        self.receipt.write_text('{}')
        self.settings = self.directory / 'settings.json'
        self.settings.write_text(json.dumps({'app_id': 1, 'installation_id': 2, 'owner': 'Acme'}))
        self.app_settings = self.directory / 'github-app.json'
        original_lstat = Path.lstat

        def trusted_metadata(path):
            value = original_lstat(path)
            return SimpleNamespace(st_mode=value.st_mode & ~0o022, st_uid=0)

        self.patches = contextlib.ExitStack()
        self.addCleanup(self.patches.close)
        for patch in (
                mock.patch.object(manage, 'root_required'),
                mock.patch.object(manage, 'source_protected'),
                mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext),
                mock.patch.object(manage, 'expected_digest'),
                mock.patch.object(manage, 'require_idle'),
                mock.patch.object(manage, 'require_no_ledger'),
                mock.patch.object(manage, 'INSTALLED', self.installed),
                mock.patch.object(manage, 'SYSTEMD', self.systemd),
                mock.patch.object(manage, 'TOKEN', self.directory / 'key.pem'),
                mock.patch.object(manage, 'LEGACY_TOKEN', self.directory / 'old-token'),
                mock.patch.object(ctl, 'BASE', self.directory),
                mock.patch.object(ctl, 'ROOTFS', self.rootfs),
                mock.patch.object(ctl, 'APP_SETTINGS', self.app_settings),
                mock.patch.object(ctl, 'load_config', side_effect=lambda: copy.deepcopy(self.config)),
                mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()),
                mock.patch.object(ctl, 'protected_path', side_effect=lambda path: Path(path)),
                mock.patch.object(ctl, 'command'),
                mock.patch.object(Path, 'lstat', trusted_metadata)):
            self.patches.enter_context(patch)

    def prepare(self):
        return manage.prepare_app_auth(str(self.settings), '0' * 64, self.controller_sha)

    def test_guarded_preparation_installs_only_adapter_and_invalidates_receipt(self):
        result = self.prepare()
        self.assertEqual(self.controller.read_bytes(), (ROOT / 'ci-runner/controller.py').read_bytes())
        self.assertEqual((self.installed / 'github_app.py').read_bytes(),
                         (ROOT / 'ci-runner/github_app.py').read_bytes())
        self.assertEqual(json.loads(self.app_settings.read_text()),
                         {'app_id': 1, 'installation_id': 2, 'owner': 'Acme'})
        self.assertFalse(self.receipt.exists())
        self.assertFalse(result['controller_enabled'])
        self.assertFalse(result['credential_introduced'])
        self.assertTrue(result['full_validation_required'])
        ctl.command.assert_called_once_with('systemctl', 'daemon-reload')

    def test_registered_or_credentialed_foundation_is_not_modified(self):
        for variant in ('registered', 'key', 'old-token'):
            with self.subTest(variant=variant):
                if variant == 'registered':
                    self.config['projects'] = {'app': {'repository': 'Acme/app'}}
                else:
                    (manage.TOKEN if variant == 'key' else manage.LEGACY_TOKEN).write_text('fixture')
                with self.assertRaisesRegex(
                        ctl.BoundaryError, 'app-auth-preparation-requires-unregistered-credential-free-foundation'):
                    self.prepare()
                self.assertEqual(hashlib.sha256(self.controller.read_bytes()).hexdigest(), self.controller_sha)
                self.assertTrue(self.receipt.exists())
                self.config['projects'] = {}
                manage.TOKEN.unlink(missing_ok=True)
                manage.LEGACY_TOKEN.unlink(missing_ok=True)

    def test_changed_installed_hash_blocks_all_writes(self):
        with self.assertRaisesRegex(ctl.BoundaryError, 'installed-controller-changed'):
            manage.prepare_app_auth(str(self.settings), '0' * 64, 'f' * 64)
        self.assertTrue(self.receipt.exists())
        self.assertFalse(self.app_settings.exists())

    def test_null_or_secret_settings_are_rejected_before_receipt_removal(self):
        for value in (
                {'app_id': None, 'installation_id': None, 'owner': 'Acme'},
                {'app_id': 1, 'installation_id': 2, 'owner': 'Acme', 'private_key': 'forbidden'}):
            with self.subTest(value=value):
                self.settings.write_text(json.dumps(value))
                with self.assertRaises(ctl.BoundaryError):
                    self.prepare()
                self.assertTrue(self.receipt.exists())
                self.assertFalse(self.app_settings.exists())

    def test_partial_write_failure_keeps_controller_disabled_and_receipt_invalid(self):
        with mock.patch.object(manage.os, 'replace', side_effect=OSError('fixture')), self.assertRaises(OSError):
            self.prepare()
        self.assertFalse(self.receipt.exists())
        ctl.command.assert_not_called()
        self.assertEqual(list(self.installed.glob('.app-auth-*')), [])


if __name__ == '__main__':
    unittest.main()
