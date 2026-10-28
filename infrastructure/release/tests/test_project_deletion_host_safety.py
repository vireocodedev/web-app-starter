"""Host deletion must reject mount boundaries and close CI admission first."""
from types import SimpleNamespace
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

SOURCE = Path(__file__).resolve().parents[3] / 'docs/project-deletion/scripts'
sys.path.insert(0, str(SOURCE))
import _host as host


def mount_line(target, identifier=2, root='/', device='8:1'):
    def escape(value):
        return str(value).replace('\\', r'\134').replace(' ', r'\040').replace('\t', r'\011').replace('\n', r'\012')
    return f'{identifier} 1 {device} {escape(root)} {escape(target)} rw,relatime - ext4 /dev/example rw\n'


class MountBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.table = self.root / 'mountinfo'
        self.patch = mock.patch.object(host, 'MOUNTINFO', self.table)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        self.target = self.root / 'selected'
        self.target.mkdir(mode=0o700)

    def table_with(self, *lines):
        self.table.write_text(mount_line('/', identifier=1) + ''.join(lines))

    def test_selected_root_mount_blocks_before_recursive_walk(self):
        self.table_with(mount_line(self.target))
        with mock.patch.object(Path, 'rglob') as walk, mock.patch('os.path.ismount', return_value=False):
            with self.assertRaises(host.Error):
                host.metadata(self.target, owner=os.getuid())
            walk.assert_not_called()

    def test_same_device_nested_bind_is_rejected(self):
        nested = self.target / 'foreign'
        nested.mkdir()
        # Both mounts deliberately use the same major:minor device.
        self.table_with(mount_line(nested, root='/unrelated/shared-tree'))
        with mock.patch('os.path.ismount', return_value=False), self.assertRaises(host.Error):
            host.require_unmounted_tree(self.target)

    def test_filesystem_ancestors_and_similarly_named_neighbors_are_allowed(self):
        self.table_with(mount_line(self.root), mount_line(str(self.target) + '-neighbor', identifier=3))
        host.require_unmounted_tree(self.target)

    def test_unrelated_nsfs_namespace_inode_roots_are_valid(self):
        for namespace in ('mnt', 'net', 'uts', 'ipc', 'pid', 'user', 'cgroup', 'time'):
            with self.subTest(namespace=namespace):
                line = f'2 1 0:4 {namespace}:[4026533015] /run/ns-fixture rw - nsfs nsfs rw\n'
                self.table_with(line)
                host.require_unmounted_tree(self.target)

    def test_nsfs_mountpoint_at_or_below_target_still_blocks(self):
        for target in (self.target, self.target / 'namespace'):
            with self.subTest(target=target):
                self.table_with(f'2 1 0:4 mnt:[4026533015] {target} rw - nsfs nsfs rw\n')
                with self.assertRaisesRegex(host.Error, 'mount'):
                    host.require_unmounted_tree(self.target)

    def test_namespace_inode_token_requires_nsfs_and_strict_target_path(self):
        lines = ('2 1 0:4 mnt:[4026533015] /run/ns rw - ext4 /dev/example rw\n',
                 '2 1 0:4 unknown:[4026533015] /run/ns rw - nsfs nsfs rw\n',
                 '2 1 0:4 mnt:[invalid] /run/ns rw - nsfs nsfs rw\n',
                 '2 1 0:4 mnt:[0] /run/ns rw - nsfs nsfs rw\n',
                 '2 1 0:4 mnt:[4026533015] relative-target rw - nsfs nsfs rw\n')
        for line in lines:
            with self.subTest(line=line):
                self.table_with(line)
                with self.assertRaises(host.Error):
                    host.require_unmounted_tree(self.target)

    def test_escaped_space_tab_newline_and_backslash_mount_paths(self):
        for suffix in ('space here', 'tab\there', 'line\nhere', 'slash\\040literal'):
            with self.subTest(suffix=suffix):
                self.table_with(mount_line(self.target / suffix))
                with self.assertRaisesRegex(host.Error, 'nested mount'):
                    host.require_unmounted_tree(self.target)

    def test_file_bind_mount_is_rejected(self):
        target = self.target / 'bound.json'
        target.write_text('preserve')
        self.table_with(mount_line(target))
        with self.assertRaises(host.Error):
            host.require_unmounted_tree(target)

    def test_malformed_or_unavailable_table_fails_closed(self):
        bad_tables = ('', '\n', 'not mountinfo\n',
                      '2 1 8:1 / /selected rw - ext4 /dev/example\n',
                      '2 1 8:1 / /selected rw - ext4 /dev/example rw trailing\n',
                      'x 1 8:1 / /selected rw - ext4 /dev/example rw\n',
                      '2 1 broken / /selected rw - ext4 /dev/example rw\n',
                      r'2 1 8:1 / /bad\999path rw - ext4 /dev/example rw' + '\n',
                      '2 1 8:1 / /bad/../path rw - ext4 /dev/example rw\n',
                      mount_line('/', identifier=2) + mount_line('/other', identifier=2))
        for raw in bad_tables:
            with self.subTest(raw=raw):
                self.table.write_text(raw)
                with self.assertRaises(host.Error):
                    host.require_unmounted_tree(self.target)
        self.table.unlink()
        with self.assertRaises(host.Error):
            host.require_unmounted_tree(self.target)

    def test_mount_added_after_metadata_prevents_recursive_removal(self):
        target = {'path': str(self.target), 'owner': os.getuid(), 'entries': []}
        self.table_with(mount_line(self.target / 'new-bind'))
        def execute_operation(directory, selected, name, expected, execute, absent):
            execute()
        with mock.patch.object(host, 'metadata', return_value=target), \
             mock.patch.object(host, 'operation', side_effect=execute_operation), \
             mock.patch.object(host.shutil, 'rmtree') as remove:
            with self.assertRaises(host.Error):
                host.remove_path(self.root, {}, target)
            remove.assert_not_called()
        self.assertTrue(self.target.exists())

    def test_volume_mount_added_after_inventory_prevents_docker_remove(self):
        mountpoint = self.target / '_data'
        self.table_with(mount_line(mountpoint / 'new-bind'))
        with mock.patch.object(host, 'command') as command:
            with self.assertRaises(host.Error):
                host.remove_docker_resource('volume', {'name': 'sample-app-staging-postgres',
                                                      'mountpoint': str(mountpoint)})
        command.assert_not_called()

    def test_docker_volume_data_mount_blocks_resource_inventory(self):
        name = 'sample-app-staging-postgres'
        mountpoint = Path('/var/lib/docker/volumes') / name / '_data'
        value = {'slug': 'sample-app', 'repository': 'example-org/sample-app'}
        for target in (mountpoint, mountpoint / 'foreign'):
            with self.subTest(target=target):
                self.table_with(mount_line(target, root='/foreign'))
                def command(*args, **kwargs):
                    if args[:3] == ('docker', 'volume', 'ls'):
                        return name
                    return ''
                volume = {'name': name, 'driver': 'local', 'options': {}, 'created_at': 'recorded',
                          'mountpoint': str(mountpoint), 'labels': {host.LABEL: 'sample-app-staging'}}
                with mock.patch.object(host, 'command', side_effect=command), \
                     mock.patch.object(host, 'json_command', return_value=volume), \
                     mock.patch.object(Path, 'is_symlink', return_value=False), \
                     self.assertRaisesRegex(host.Error, 'mount'):
                    host.docker(value)


class TaskArtifactIdentityTests(unittest.TestCase):
    def extra(self, path):
        return {'path': path, 'kind': 'task-artifact', 'evidence_sha256': 'a' * 64, 'fingerprint': None}

    def test_reviewed_artifact_accepts_uppercase_created_suffix(self):
        path = '/root/sample-app-source-upgrade-7XWovUa7'
        self.assertEqual(host.extra_paths({'slug': 'sample-app'}, [self.extra(path)]), [(path, 0)])

    def test_artifact_rejects_foreign_root_child_dots_and_descendants(self):
        for path in ('/root/neighbor-app-source-upgrade-7XWovUa7', '/root/sample-application-source',
                     '/root/sample-app-source.upgrade', '/root/sample-app-source/child',
                     '/root/sample-app-source/../foreign', '/root/sample-app-source//child'):
            with self.subTest(path=path), self.assertRaises(host.Error):
                host.extra_paths({'slug': 'sample-app'}, [self.extra(path)])


class CIUnregisterBarrierTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.directory.chmod(0o700)
        self.selected = {'identity': {'slug': 'sample-app', 'repository': 'example-org/sample-app'},
                         'host': {'units': {'web-app-ci-controller.service': {'UnitFileState': 'enabled'}}}}
        host.write(self.directory / 'host-purged.json', {'plan_sha256': host.digest(self.selected), 'verified': True})
        self.config = {'projects': {'sample-app': {'repository': 'example-org/sample-app'}}}
        self.manage = SimpleNamespace(ctl=SimpleNamespace(load_config=mock.Mock(return_value=self.config)))
        self.result = {'repository': 'example-org/sample-app', 'removed': 'sample-app',
                       'configuration_sha256': 'b' * 64, 'full_validation_required': True, 'empty_pool': False}

    def test_barrier_precedes_unregister_and_full_validation(self):
        events = []
        def api(*args):
            if args[3] == 'inspect':
                events.append('inspect')
                return {'configuration_sha256': 'a' * 64}
            events.append('unregister')
            self.assertIn('--expected-config-sha256', args)
            return self.result
        def drain(*args, **kwargs):
            events.append('drain')
            self.assertIs(args[0], self.manage)
            self.assertEqual(args[1], self.config)
            self.assertEqual(kwargs, {'recovery_path': self.directory / 'ci-drain-recovery.json'})
            return {'stopped': True, 'was_enabled': True}
        def command(*args, **kwargs):
            events.append('validate' if args[-1] == 'validate' else 'enable')
        with mock.patch.object(host, 'ci_manage', return_value=self.manage), \
             mock.patch.object(host, 'drain_and_stop', side_effect=drain), \
             mock.patch.object(host, 'json_command', side_effect=api), \
             mock.patch.object(host, 'command', side_effect=command):
            receipt = host.unregister(self.directory, self.selected)
        self.assertEqual(events, ['inspect', 'drain', 'unregister', 'validate', 'enable'])
        self.assertTrue(receipt['reactivated'])

    def test_frozen_recovery_or_failed_barrier_never_mutates_configuration(self):
        for message in ('CI main remains frozen; reconcile protected recovery.', 'Shared CI workers remain busy.'):
            with self.subTest(message=message), \
                 mock.patch.object(host, 'ci_manage', return_value=self.manage), \
                 mock.patch.object(host, 'drain_and_stop', side_effect=host.Error(message)), \
                 mock.patch.object(host, 'json_command', return_value={'configuration_sha256': 'a' * 64}) as api, \
                 mock.patch.object(host, 'command') as command:
                with self.assertRaisesRegex(host.Error, message):
                    host.unregister(self.directory, self.selected)
                self.assertTrue(all(call.args[3] == 'inspect' for call in api.call_args_list))
                command.assert_not_called()
                self.assertFalse((self.directory / 'ci-project.json').exists())
                self.assertFalse((self.directory / 'ci-removed.json').exists())

    def test_retry_preserves_original_activation_intent_after_controller_disabled(self):
        attempts = iter([host.Error('Unregister outcome uncertain'), self.result])
        def api(*args):
            if args[3] == 'inspect':
                return {'configuration_sha256': 'a' * 64}
            result = next(attempts)
            if isinstance(result, Exception):
                raise result
            self.assertEqual(args[args.index('--expected-config-sha256') + 1], 'a' * 64)
            return result
        with mock.patch.object(host, 'ci_manage', return_value=self.manage), \
             mock.patch.object(host, 'drain_and_stop', side_effect=[{'stopped': True, 'was_enabled': True},
                                                                 {'stopped': True, 'was_enabled': False}]), \
             mock.patch.object(host, 'json_command', side_effect=api), \
             mock.patch.object(host, 'command') as command:
            with self.assertRaises(host.Error):
                host.unregister(self.directory, self.selected)
            receipt = host.unregister(self.directory, self.selected)
        self.assertTrue(receipt['reactivated'])
        command.assert_any_call('systemctl', 'enable', '--now', 'web-app-ci-controller.service')
        self.assertEqual(host.read(self.directory / 'ci-predecessor.json'),
                         {'configuration_sha256': 'a' * 64, 'was_enabled': True})

    def test_missing_stopped_proof_never_invokes_unregister(self):
        with mock.patch.object(host, 'ci_manage', return_value=self.manage), \
             mock.patch.object(host, 'drain_and_stop', return_value={'stopped': False}), \
             mock.patch.object(host, 'json_command', return_value={'configuration_sha256': 'a' * 64}) as api:
            with self.assertRaises(host.Error):
                host.unregister(self.directory, self.selected)
        self.assertEqual(api.call_count, 1)
        self.assertEqual(api.call_args.args[3], 'inspect')


if __name__ == '__main__':
    unittest.main()
