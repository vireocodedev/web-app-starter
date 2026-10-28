"""Stage 7 reconciles lost DELETE outcomes while retaining live prerequisites."""
from contextlib import ExitStack
from types import SimpleNamespace
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

SOURCE = Path(__file__).resolve().parents[3] / 'docs/project-deletion/scripts'
sys.path.insert(0, str(SOURCE))
import _state as state
import _github as github
import _deletion as deletion


class RepositoryStageResumeTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.directory.chmod(0o700)
        self.identity = {'repository': 'example-org/sample-app', 'repository_id': 101,
                         'slug': 'sample-app', 'org': 'example-org'}
        # No packages existed at planning; late names must still block DELETE.
        self.selected = {'identity': self.identity, 'github': {'app_repositories': [101, 102], 'packages': []}}
        self.snapshot = {'identity': self.identity}
        self.args = SimpleNamespace(plan_sha256=state.digest(self.selected))
        state.write(self.directory / 'providers.json', {'plan_sha256': state.digest(self.selected), 'verified': True})
        self.exists = True
        self.remote_id = 101
        self.remote_name = self.identity['repository']
        self.lose_delete_response = False
        self.delete_count = 0
        self.events = []
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        def patch(owner, name, **options):
            return self.stack.enter_context(mock.patch.object(owner, name, **options))
        patch(deletion, 'load', return_value=(self.directory, self.snapshot))
        patch(deletion, 'plan', return_value=self.selected)
        self.host = patch(deletion, 'host', side_effect=self.host_verify)
        self.dns = patch(deletion.dns, 'verify', side_effect=lambda *args: self.events.append('dns'))
        self.authority = patch(github, 'authority')
        self.repositories = patch(github, 'repositories', side_effect=self.repository_inventory)
        self.get = patch(github, 'get', side_effect=self.repository_get)
        self.packages = patch(github, 'packages', side_effect=lambda *args: self.events.append('packages') or [])
        self.selections = patch(github, 'selections', return_value=[102])
        self.api = patch(github, 'api', side_effect=self.request)
        self.remove_resources = patch(github, 'remove_resources')

    def host_verify(self, *args):
        self.events.append('host')
        return {'verified': True}

    def repository_inventory(self, identity):
        return ([{'id': self.remote_id, 'full_name': self.remote_name}] if self.exists else [])

    def repository_get(self, path):
        self.assertEqual(path, 'repos/' + self.identity['repository'])
        return {'id': self.remote_id, 'full_name': self.remote_name,
                'private': True, 'permissions': {'admin': True}}

    def request(self, path, method='GET'):
        self.assertEqual((path, method), ('repos/' + self.identity['repository'], 'DELETE'))
        self.events.append('DELETE')
        self.delete_count += 1
        self.exists = False
        if self.lose_delete_response:
            self.lose_delete_response = False
            raise state.Error('GitHub request outcome uncertain')
        return 204, None, ''

    def run_stage(self):
        deletion.perform(self.args, 'repository')

    def test_lost_delete_response_reconciles_without_surviving_repository(self):
        self.lose_delete_response = True
        with self.assertRaisesRegex(state.Error, 'outcome uncertain'):
            self.run_stage()
        self.assertFalse(self.exists)
        self.assertEqual(state.read(self.directory / 'journal.json')['operations']['repository']['phase'], 'started')
        self.run_stage()
        self.assertEqual(self.delete_count, 1)
        self.assertEqual(self.events[:4], ['host', 'dns', 'packages', 'DELETE'])
        self.assertEqual(self.host.call_count, 2)
        self.assertEqual(self.dns.call_count, 2)
        self.remove_resources.assert_not_called()
        self.assertTrue(state.read(self.directory / 'repository.json')['verified'])
        self.assertEqual(state.read(self.directory / 'journal.json')['operations']['repository']['phase'], 'verified')

    def test_completed_stage_replay_rechecks_providers_without_another_delete(self):
        self.run_stage()
        self.run_stage()
        self.assertEqual(self.delete_count, 1)
        self.assertEqual(self.packages.call_count, 2)
        self.assertEqual(self.selections.call_count, 2)
        self.assertEqual(self.host.call_count, 2)
        self.assertEqual(self.dns.call_count, 2)
        self.remove_resources.assert_not_called()

    def test_same_name_replacement_after_uncertain_delete_is_preserved(self):
        self.lose_delete_response = True
        with self.assertRaises(state.Error):
            self.run_stage()
        self.exists = True
        self.remote_id = 999
        with self.assertRaisesRegex(state.Error, 'renamed, replaced'):
            self.run_stage()
        self.assertEqual(self.delete_count, 1)
        self.assertTrue(self.exists)
        self.assertFalse((self.directory / 'repository.json').exists())

    def test_renamed_original_repository_is_never_treated_as_absent(self):
        self.remote_name = 'example-org/renamed-app'
        with self.assertRaisesRegex(state.Error, 'renamed, replaced'):
            self.run_stage()
        self.assertEqual(self.delete_count, 0)

    def test_name_changed_between_inventory_and_direct_read_is_rejected(self):
        self.get.side_effect = None
        self.get.return_value = {'id': 101, 'full_name': 'example-org/renamed-app',
                                 'private': True, 'permissions': {'admin': True}}
        with self.assertRaises(state.Error):
            self.run_stage()
        self.assertEqual(self.delete_count, 0)

    def test_both_late_package_names_block_without_adoption_or_deletion(self):
        for component in ('frontend', 'backend'):
            with self.subTest(component=component):
                self.packages.side_effect = None
                self.packages.return_value = [{'name': 'sample-app-' + component, 'id': 999}]
                with self.assertRaisesRegex(state.Error, 'package name exists or reappeared'):
                    self.run_stage()
                self.assertEqual(self.delete_count, 0)
                self.assertTrue(self.exists)
                self.assertFalse((self.directory / 'journal.json').exists())
                self.remove_resources.assert_not_called()

    def test_package_reappearance_also_blocks_completed_stage_replay(self):
        self.run_stage()
        self.packages.side_effect = None
        self.packages.return_value = [{'name': 'sample-app-backend', 'id': 999}]
        with self.assertRaises(state.Error):
            self.run_stage()
        self.assertEqual(self.delete_count, 1)

    def test_provider_receipt_remains_required_even_when_repository_absent(self):
        self.exists = False
        (self.directory / 'providers.json').unlink()
        with self.assertRaises(state.Error):
            self.run_stage()
        self.host.assert_not_called()
        self.packages.assert_not_called()
        self.api.assert_not_called()
        self.assertFalse((self.directory / 'journal.json').exists())

    def test_live_host_or_dns_failure_blocks_delete(self):
        for owner in (self.host, self.dns):
            with self.subTest(owner=owner):
                original = owner.side_effect
                owner.side_effect = state.Error('Current prerequisite failed')
                with self.assertRaises(state.Error):
                    self.run_stage()
                owner.side_effect = original
                self.assertEqual(self.delete_count, 0)
                self.assertFalse((self.directory / 'journal.json').exists())

    def test_exact_preserved_app_selection_is_required(self):
        for selection in ([], [101, 102], [102, 103]):
            with self.subTest(selection=selection):
                self.selections.return_value = selection
                with self.assertRaisesRegex(state.Error, 'exact preserved manifest'):
                    self.run_stage()
                self.assertEqual(self.delete_count, 0)

    def test_inaccessible_organization_inventory_does_not_establish_absence(self):
        self.exists = False
        self.repositories.side_effect = state.Error('Required accessible GitHub inventory is unavailable; 404 is not absence.')
        with self.assertRaisesRegex(state.Error, '404 is not absence'):
            self.run_stage()
        self.assertEqual(self.delete_count, 0)
        self.assertFalse((self.directory / 'repository.json').exists())

    def test_invalid_package_inventory_blocks_delete(self):
        self.packages.side_effect = None
        self.packages.return_value = [{'id': 999}]
        with self.assertRaisesRegex(state.Error, 'inventory is invalid'):
            self.run_stage()
        self.assertEqual(self.delete_count, 0)


if __name__ == '__main__':
    unittest.main()
