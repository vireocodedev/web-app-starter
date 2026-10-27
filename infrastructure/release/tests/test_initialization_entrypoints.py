"""Moved initialization entrypoints keep the canonical release source and guards."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
ENTRYPOINTS = ROOT / 'docs/template-initialization/scripts'


def load(name):
    filename = {'install': '14_4_install_release', 'prepare': '14_5_prepare_release'}[name]
    spec = importlib.util.spec_from_file_location('initialization_' + name, ENTRYPOINTS / (filename + '.py'))
    module = importlib.util.module_from_spec(spec)
    with mock.patch.object(sys, 'path', list(sys.path)):
        spec.loader.exec_module(module)
    return module


installer = load('install')
preparer = load('prepare')


class InitializationEntrypointTests(unittest.TestCase):
    def test_clis_work_outside_checkout_without_loading_adjacent_or_cwd_modules(self):
        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory)
            checkout = fixture / 'checkout'
            entries = checkout / 'docs/template-initialization/scripts'
            canonical = checkout / 'infrastructure/release'
            signer = checkout / 'infrastructure/ci/ci-runner/github_app.py'
            unrelated = fixture / 'unrelated'
            for path in (entries, canonical, signer.parent, unrelated):
                path.mkdir(parents=True)
            for name in ('controller.py', 'protocol.py', 'runtime.py'):
                shutil.copyfile(ROOT / 'infrastructure/release' / name, canonical / name)
                for path in (entries, unrelated):
                    (path / name).write_text('raise RuntimeError("unexpected shadow module")\n')
            shutil.copyfile(ROOT / 'infrastructure/ci/ci-runner/github_app.py', signer)
            shutil.copyfile(ENTRYPOINTS / '_shared.py', entries / '_shared.py')
            for name in ('14_4_install_release.py', '14_5_prepare_release.py'):
                shutil.copyfile(ENTRYPOINTS / name, entries / name)
                with self.subTest(entrypoint=name):
                    result = subprocess.run(
                        [sys.executable, '-B', str(entries / name), '--help'], cwd=unrelated,
                        env=dict(os.environ, PYTHONPATH=str(unrelated)),
                        capture_output=True, text=True, timeout=10)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertIn('usage:', result.stdout)
                    self.assertEqual(result.stderr, '')

    def test_install_uses_repository_root_for_git_copies_and_trusted_hashes(self):
        args = SimpleNamespace(
            repository='vireocodedev/fixture-app', repository_id=12, slug='fixture-app',
            actor=['brunotot'], staging_workflow_id=20, production_workflow_id=21,
            staging_hostname='fixture-staging.vireocode.com', production_hostname='fixture.vireocode.com',
            staging_frontend_port=18080, staging_backend_port=18081,
            production_frontend_port=18180, production_backend_port=18181,
            app_settings='/etc/web-app-ci/github-app.json', app_key='/etc/web-app-ci/github-app.pem',
            username='admin', display_name='Fixture administrator', email='fixture@vireocode.com')
        source_stat = Path.lstat
        ancestors = {ROOT, *ROOT.parents}

        def metadata(path):
            if path in ancestors:
                return SimpleNamespace(st_uid=0, st_mode=0o755)
            return source_stat(path)

        def command(*arguments):
            if arguments[:1] == ('git',):
                self.assertEqual(arguments[:3], ('git', '-C', str(ROOT)))
                return b'a' * 40 if arguments[3:] == ('rev-parse', 'HEAD') else b''
            return b''

        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory)

            def destination(value):
                path = Path(value)
                return fixture / path.relative_to('/') if path.is_absolute() else path

            for path in ('etc/web-app-deploy', 'var/lib/web-app-deploy',
                         'usr/local/lib/web-app-deploy', 'etc/systemd/system'):
                (fixture / path).mkdir(parents=True)
            previous_cwd = Path.cwd()
            os.chdir(fixture)
            try:
                with mock.patch.object(installer, 'Path', side_effect=destination), \
                        mock.patch.object(Path, 'lstat', autospec=True, side_effect=metadata), \
                        mock.patch.object(installer.os, 'geteuid', return_value=0), \
                        mock.patch.object(installer.os, 'umask'), \
                        mock.patch.object(installer, 'protected'), \
                        mock.patch.object(installer, 'validate'), \
                        mock.patch.object(installer, 'command', side_effect=command), \
                        contextlib.redirect_stdout(io.StringIO()):
                    installer.install(args)
            finally:
                os.chdir(previous_cwd)
            settings = fixture / 'etc/web-app-deploy/fixture-app'
            installed = fixture / 'usr/local/lib/web-app-deploy/fixture-app'
            config = json.loads((settings / 'controller.json').read_text())
            self.assertEqual(config['trusted_sha256'], {
                name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
                for name in installer.TRUSTED})
            for name in ('controller.py', 'protocol.py', 'runtime.py'):
                self.assertEqual((installed / name).read_bytes(),
                                 (ROOT / 'infrastructure/release' / name).read_bytes())
            self.assertEqual((installed / 'github_app.py').read_bytes(),
                             (ROOT / 'infrastructure/ci/ci-runner/github_app.py').read_bytes())
            receipt = json.loads((settings / 'installation.json').read_text())
            self.assertEqual(receipt['source_sha'], 'a' * 40)
            self.assertEqual(config['runtime_config'], str(settings / 'runtime.json'))

    def test_install_refuses_nonroot_and_dirty_sources_before_host_writes(self):
        with mock.patch.object(installer.os, 'geteuid', return_value=1000), \
                mock.patch.object(installer, 'command') as command, \
                mock.patch.object(Path, 'mkdir') as mkdir, \
                self.assertRaisesRegex(installer.ReleaseError, 'root-required'):
            installer.install(SimpleNamespace())
        command.assert_not_called()
        mkdir.assert_not_called()
        with mock.patch.object(installer.os, 'geteuid', return_value=0), \
                mock.patch.object(installer.os, 'umask'), \
                mock.patch.object(Path, 'lstat', return_value=SimpleNamespace(st_uid=0, st_mode=0o755)), \
                mock.patch.object(installer, 'command', side_effect=[b'a' * 40, b' M tracked-file']), \
                mock.patch.object(Path, 'mkdir') as mkdir, \
                self.assertRaisesRegex(installer.ReleaseError, 'installation-source-dirty'):
            installer.install(SimpleNamespace(repository='vireocodedev/fixture-app'))
        mkdir.assert_not_called()

    def test_prepare_keeps_validation_and_interrupted_preparation_guards(self):
        with mock.patch.object(preparer, 'command') as command, \
                mock.patch.object(preparer, 'write_json') as write_json, \
                self.assertRaisesRegex(preparer.ReleaseError, 'runtime-config-fields'):
            preparer.prepare({})
        command.assert_not_called()
        write_json.assert_not_called()
        with tempfile.TemporaryDirectory() as directory:
            (Path(directory) / 'preparation.json').write_text('{"state":"preparing"}')
            with mock.patch.object(preparer, 'validate'), \
                    mock.patch.object(preparer, 'command') as command, \
                    mock.patch.object(preparer, 'write_json') as write_json, \
                    self.assertRaisesRegex(preparer.ReleaseError, 'existing-preparation'):
                preparer.prepare({'state': directory})
            command.assert_not_called()
            write_json.assert_not_called()


if __name__ == '__main__':
    unittest.main()
