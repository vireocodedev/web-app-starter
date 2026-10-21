"""Fresh installer/provisioner seam without configuring the host or running CI."""
import contextlib
import importlib.util
from pathlib import Path
import os
import shlex
import stat
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'ci-runner'


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


ctl = load('provision_entrypoint_controller', SOURCE / 'controller.py')
provisioner = load('provision_entrypoint', SOURCE / 'provision_slots.py')
provisioner.ctl = ctl


class FreshProvisionEntrypointTests(unittest.TestCase):
    def setUp(self):
        self.reviewed = Path('/root/reviewed-foundation/ci-runner')
        self.config = {'fixed-fixture': True}
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.stack.enter_context(mock.patch.object(os, 'geteuid', return_value=0))
        self.load_config = self.stack.enter_context(mock.patch.object(ctl, 'load_config', return_value=self.config))
        self.provision = self.stack.enter_context(mock.patch.object(provisioner, 'provision'))
        self.metadata = self.stack.enter_context(mock.patch.object(Path, 'lstat', autospec=True, side_effect=self.safe_metadata))

    def safe_metadata(self, path):
        # These fixtures model the protected reviewed root checkout. No real
        # /root source, installed directory or host file is traversed/modified.
        files = {'validate-job.py', 'busctl-compat.py', 'docker.service',
                 'web-app-job.service', 'web-app-validation.service'}
        if path.parent == self.reviewed and path.name in files:
            return SimpleNamespace(st_mode=stat.S_IFREG | 0o644, st_uid=0)
        return SimpleNamespace(st_mode=stat.S_IFDIR | 0o755, st_uid=0)

    def test_fresh_entrypoint_uses_explicit_reviewed_source_not_installed_module_directory(self):
        self.assertNotEqual(self.reviewed, Path(provisioner.__file__).parent)
        self.assertEqual(provisioner.main([str(self.reviewed)]), 0)
        self.load_config.assert_called_once_with()
        self.provision.assert_called_once_with(self.config, self.reviewed)
        visited = [call.args[0] for call in self.metadata.call_args_list]
        self.assertIn(self.reviewed / 'validate-job.py', visited)
        self.assertIn(self.reviewed / 'busctl-compat.py', visited)
        self.assertIn(self.reviewed / 'web-app-validation.service', visited)

    def test_absent_or_extra_source_arguments_rejected_before_resource_mutation(self):
        for arguments in ([], [str(self.reviewed), '/root/another-source']):
            with self.subTest(arguments=arguments), self.assertRaisesRegex(ctl.BoundaryError, 'one-reviewed-pool-source-required'):
                provisioner.main(arguments)
        self.load_config.assert_not_called()
        self.provision.assert_not_called()
        self.metadata.assert_not_called()

    def test_relative_and_traversal_paths_rejected_before_resource_mutation(self):
        for path in ('ci-runner', '/root/../tmp/ci-runner'):
            with self.subTest(path=path), self.assertRaisesRegex(ctl.BoundaryError, 'absolute-reviewed-pool-source-required'):
                provisioner.main([path])
        self.load_config.assert_not_called()
        self.provision.assert_not_called()
        self.metadata.assert_not_called()

    def test_writable_ancestor_or_symlink_source_rejected_before_resource_mutation(self):
        for target, mode in ((self.reviewed.parent, stat.S_IFDIR | 0o777),
                             (self.reviewed, stat.S_IFLNK | 0o777)):
            def metadata(path):
                return SimpleNamespace(st_mode=mode, st_uid=0) if path == target else self.safe_metadata(path)
            self.metadata.side_effect = metadata
            try:
                with self.subTest(target=target), self.assertRaisesRegex(ctl.BoundaryError, 'untrusted-pool-source-directory'):
                    provisioner.main([str(self.reviewed)])
            finally:
                self.metadata.side_effect = self.safe_metadata
        self.load_config.assert_not_called()
        self.provision.assert_not_called()

    def test_unsafe_or_missing_required_source_file_rejected_before_resource_mutation(self):
        target = self.reviewed / 'busctl-compat.py'
        for mode, owner in ((stat.S_IFREG | 0o666, 0), (stat.S_IFREG | 0o644, 1000),
                            (stat.S_IFLNK | 0o777, 0)):
            def metadata(path):
                return SimpleNamespace(st_mode=mode, st_uid=owner) if path == target else self.safe_metadata(path)
            self.metadata.side_effect = metadata
            try:
                with self.subTest(mode=mode, owner=owner), self.assertRaisesRegex(ctl.BoundaryError, 'untrusted-pool-source-file'):
                    provisioner.main([str(self.reviewed)])
            finally:
                self.metadata.side_effect = self.safe_metadata
        def missing(path):
            if path == target:
                raise FileNotFoundError
            return self.safe_metadata(path)
        self.metadata.side_effect = missing
        try:
            with self.assertRaises(FileNotFoundError):
                provisioner.main([str(self.reviewed)])
        finally:
            self.metadata.side_effect = self.safe_metadata
        self.load_config.assert_not_called()
        self.provision.assert_not_called()

    def test_nonroot_entrypoint_rejected_before_source_or_config_reads(self):
        with mock.patch.object(os, 'geteuid', return_value=1000), self.assertRaisesRegex(ctl.BoundaryError, 'root-pool-provisioning-required'):
            provisioner.main([str(self.reviewed)])
        self.metadata.assert_not_called()
        self.load_config.assert_not_called()
        self.provision.assert_not_called()


class InstallerSourceForwardingTests(unittest.TestCase):
    def test_actual_installer_invocation_passes_reviewed_source_as_single_argument(self):
        source = (SOURCE / 'install.sh').read_text()
        commands = [line for line in source.splitlines() if line.startswith('python3 /usr/local/lib/web-app-ci/provision_slots.py')]
        self.assertEqual(len(commands), 1)
        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory)
            captured = fixture / 'argv'
            reviewed = fixture / 'reviewed source with spaces'
            # Execute only the actual installer invocation against a shell
            # function recorder. The installed provisioner is never executed.
            script = ('python3() { printf "%s\\n" "$@" > ' + shlex.quote(str(captured)) + '; }\n'
                      'WEB_APP_SOURCE=' + shlex.quote(str(reviewed)) + '\n' + commands[0] + '\n')
            subprocess.run(['/bin/bash', '-c', script], check=True, timeout=5,
                           env={'PATH': '/usr/bin:/bin'}, capture_output=True, text=True)
            self.assertEqual(captured.read_text().splitlines(),
                             ['/usr/local/lib/web-app-ci/provision_slots.py', str(reviewed)])


if __name__ == '__main__':
    unittest.main()
