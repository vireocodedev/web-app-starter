"""Metadata-only host signer inventory and deletion's injected read boundary."""
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock
import urllib.error

SOURCE = Path(__file__).resolve().parents[3] / 'docs/project-deletion/scripts'
sys.path.insert(0, str(SOURCE))
sys.path.insert(0, str(SOURCE.parents[2] / 'infrastructure/release'))
import _app_inventory as inventory
import _host as host
import _github as github
import _deletion as deletion
import protocol


def repository(identifier, owner='example-org'):
    return {'id': identifier, 'full_name': owner + '/repo-' + str(identifier),
            'owner': {'login': owner, 'type': 'Organization'}}


class MetadataInventoryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.settings = Path(self.temporary.name) / 'settings.json'
        self.settings.write_text(json.dumps({'app_id': 302, 'installation_id': 301, 'owner': 'example-org'}))
        self.identity = {'app_id': 302, 'app_installation_id': 301, 'org': 'example-org'}
        self.installation = {'id': 301, 'app_id': 302, 'account': {'login': 'example-org', 'type': 'Organization'},
            'repository_selection': 'selected', 'suspended_at': None, 'target_type': 'Organization',
            'permissions': dict(inventory.CI_PERMISSIONS)}
        self.token = 'ghs_' + 'private-test-only-' * 5
        self.mint = {'token': self.token, 'expires_at': (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
                     'permissions': {'metadata': 'read'}, 'repository_selection': 'selected'}
        self.credentials = SimpleNamespace(jwt=mock.Mock(return_value='private-test-jwt'), request=mock.Mock(side_effect=self.credential_request))
        self.signer = SimpleNamespace(GitHubAppCredentials=mock.Mock(return_value=self.credentials))
        self.controller = SimpleNamespace(protected=mock.Mock(return_value=self.settings))
        self.pages = {1: {'total_count': 2, 'repositories': [repository(101), repository(102)]}}
        self.calls = []
        self.owners = mock.patch.object(inventory, 'owners', return_value=(self.controller, self.signer, protocol))
        self.owners.start()
        self.addCleanup(self.owners.stop)
        self.transport = mock.patch.object(inventory, 'token_request', side_effect=self.token_request)
        self.request = self.transport.start()
        self.addCleanup(self.transport.stop)

    def credential_request(self, jwt, suffix, method='GET', payload=None):
        self.assertEqual(jwt, 'private-test-jwt')
        if suffix == '':
            return self.installation
        self.assertEqual((suffix, method, payload), ('/access_tokens', 'POST', {'permissions': {'metadata': 'read'}}))
        return self.mint

    def token_request(self, owner, token, path, method='GET'):
        self.assertIs(owner, protocol)
        self.assertEqual(token, self.token)
        self.calls.append((path, method))
        if method == 'DELETE':
            self.assertEqual(path, '/installation/token')
            return None
        return self.pages[int(path.rsplit('=', 1)[1])]

    def test_minimal_unfiltered_token_is_revoked_and_only_identity_ids_exported(self):
        result = inventory.inspect(self.identity)
        self.assertEqual(result, {'schema_version': 1, 'app_id': 302, 'installation_id': 301,
            'owner': 'example-org', 'repository_selection': 'selected', 'repository_ids': [101, 102]})
        self.controller.protected.assert_called_once_with(inventory.SETTINGS)
        args = self.signer.GitHubAppCredentials.call_args.args
        self.assertEqual(args[1], inventory.KEY)
        self.assertIs(args[2], self.controller.protected)
        self.assertEqual(self.credentials.request.call_args_list[-1].args[3], {'permissions': {'metadata': 'read'}})
        self.assertEqual(self.calls[-1], ('/installation/token', 'DELETE'))
        encoded = json.dumps(result)
        self.assertNotIn(self.token, encoded)
        self.assertNotIn('private-test-jwt', encoded)
        self.assertNotIn('repo-101', encoded)

    def test_installation_identity_and_existing_permission_policy_fail_before_mint(self):
        invalid = [('id', 999), ('id', True), ('app_id', 999), ('repository_selection', 'all'),
                   ('suspended_at', 'today'), ('target_type', 'User'),
                   ('account', {'login': 'foreign-org', 'type': 'Organization'}),
                   ('permissions', {'metadata': 'read'}),
                   ('permissions', dict(inventory.CI_PERMISSIONS, contents='read'))]
        original = copy.deepcopy(self.installation)
        for field, value in invalid:
            with self.subTest(field=field, value=value):
                self.installation = dict(original, **{field: value})
                self.credentials.request.reset_mock()
                with self.assertRaises(inventory.Error):
                    inventory.inspect(self.identity)
                self.assertEqual(self.credentials.request.call_count, 1)
        self.request.assert_not_called()

    def test_historical_settings_mismatch_never_mints(self):
        self.identity['app_id'] = 999
        with self.assertRaises(inventory.Error):
            inventory.inspect(self.identity)
        self.credentials.jwt.assert_not_called()
        self.request.assert_not_called()

    def test_bad_mint_policy_or_expiry_still_revokes_our_token(self):
        original = dict(self.mint)
        for field, value in [('permissions', dict(metadata='read', contents='read')),
                             ('repository_selection', 'all'), ('expires_at', 'invalid'),
                             ('expires_at', '2030-01-01T00:00:00'),
                             ('expires_at', '2000-01-01T00:00:00+00:00')]:
            with self.subTest(field=field, value=value):
                self.mint = dict(original, **{field: value})
                self.calls.clear()
                with self.assertRaises(inventory.Error):
                    inventory.inspect(self.identity)
                self.assertEqual(self.calls, [('/installation/token', 'DELETE')])

    def test_complete_pagination_and_exact_multiple_empty_final_page(self):
        self.pages = {1: {'total_count': 100, 'repositories': [repository(i) for i in range(1, 101)]},
                      2: {'total_count': 100, 'repositories': []}}
        self.assertEqual(inventory.inspect(self.identity)['repository_ids'], list(range(1, 101)))
        self.assertEqual(len(self.calls), 3)

    def test_drifting_duplicate_invalid_or_foreign_repository_inventory_is_rejected_and_revoked(self):
        bad = [({'total_count': 2, 'repositories': [repository(101), repository(101)]}, None),
               ({'total_count': 1, 'repositories': [repository(True)]}, None),
               ({'total_count': 1, 'repositories': [repository(-1)]}, None),
               ({'total_count': 1, 'repositories': [repository(101, 'foreign')]}, None),
               ({'total_count': True, 'repositories': []}, None),
               ({'total_count': 2, 'repositories': [repository(101)]}, None),
               ({'total_count': 100, 'repositories': [repository(i) for i in range(1, 101)]},
                {'total_count': 101, 'repositories': [repository(101)]})]
        for first, second in bad:
            with self.subTest(first=first):
                self.pages = {1: first, 2: second}
                self.calls.clear()
                with self.assertRaises(inventory.Error):
                    inventory.inspect(self.identity)
                self.assertEqual(self.calls[-1], ('/installation/token', 'DELETE'))

    def test_inventory_transport_failure_revokes_without_exporting_a_result(self):
        def fail(protocol, token, path, method='GET'):
            if method == 'DELETE':
                return None
            raise inventory.Error('App inventory failed')
        self.request.side_effect = fail
        with self.assertRaises(inventory.Error):
            inventory.inspect(self.identity)
        self.assertEqual(self.request.call_args.args[2:], ('/installation/token', 'DELETE'))

    def test_revocation_failure_prevents_successful_inventory(self):
        def fail_revoke(owner, token, path, method='GET'):
            if method == 'DELETE':
                raise inventory.Error('Token revocation not confirmed')
            return self.pages[1]
        self.request.side_effect = fail_revoke
        with self.assertRaisesRegex(inventory.Error, 'revocation not confirmed'):
            inventory.inspect(self.identity)


class FixedEndpointTransportTests(unittest.TestCase):
    def test_no_endpoint_for_content_selection_mutation_or_foreign_host(self):
        for path, method in [('/repos/example-org/sample/contents/x', 'GET'),
                             ('/installation/repositories', 'POST'), ('/installation/token', 'GET'),
                             ('https://foreign.invalid/installation/repositories', 'GET')]:
            with self.subTest(path=path), mock.patch.object(protocol, 'https_opener') as opener:
                with self.assertRaises(inventory.Error):
                    inventory.token_request(protocol, 'x' * 40, path, method)
                opener.assert_not_called()

    def test_redirect_and_http_failure_are_sanitized(self):
        for status in (302, 401, 403, 404):
            with self.subTest(status=status), mock.patch.object(protocol, 'https_opener') as opener:
                opener.return_value.open.side_effect = urllib.error.HTTPError('https://api.github.com', status, 'PRIVATE BODY', {}, None)
                with self.assertRaises(inventory.Error) as raised:
                    inventory.token_request(protocol, 'x' * 40, '/installation/repositories?per_page=100&page=1')
                self.assertNotIn('PRIVATE BODY', str(raised.exception))
                self.assertIsInstance(opener.call_args.args[0], protocol.NoRedirect)

    def test_only_confirmed_204_empty_body_revokes(self):
        for status, body in ((200, b''), (204, b'body'), (204, b'')):
            with self.subTest(status=status, body=body), mock.patch.object(protocol, 'https_opener') as opener:
                response = opener.return_value.open.return_value.__enter__.return_value
                response.status, response.read.return_value = status, body
                if status == 204 and not body:
                    self.assertIsNone(inventory.token_request(protocol, 'x' * 40, '/installation/token', 'DELETE'))
                else:
                    with self.assertRaises(inventory.Error):
                        inventory.token_request(protocol, 'x' * 40, '/installation/token', 'DELETE')


class InventoryWiringTests(unittest.TestCase):
    def test_host_action_is_read_only_before_plan_and_checks_plan_when_present(self):
        identity = {'ci_source': str(host.ROOT)}
        request = {'schema_version': 1, 'action': 'app-inventory', 'identity': identity, 'extras': [], 'plan': None}
        with mock.patch.object(host, 'identity', return_value=identity), mock.patch.object(host, 'canonical') as canonical, \
             mock.patch.object(inventory, 'inspect', return_value={'repository_ids': [101, 102]}) as inspect, \
             mock.patch.object(host, 'context') as context, mock.patch.object(host, 'check_plan') as check:
            self.assertEqual(host.dispatch(request), {'repository_ids': [101, 102]})
            check.assert_not_called()
            selected = {'identity': identity, 'extras': []}
            request['plan'] = selected
            host.dispatch(request)
            check.assert_called_once_with(selected)
            self.assertEqual(canonical.call_count, 2)
            self.assertEqual(inspect.call_count, 2)
            context.assert_not_called()

    def test_workstation_rejects_extra_credentials_or_changed_inventory_identity(self):
        identity = {'app_id': 302, 'app_installation_id': 301, 'org': 'example-org'}
        result = {'schema_version': 1, 'app_id': 302, 'installation_id': 301, 'owner': 'example-org',
                  'repository_selection': 'selected', 'repository_ids': [101, 102]}
        self.assertEqual(github.selections(identity, lambda value: result), [101, 102])
        for field, value in [('app_id', True), ('installation_id', 999), ('owner', 'foreign'),
                             ('repository_selection', 'all'), ('repository_ids', [True]),
                             ('repository_ids', [101, 101]), ('repository_ids', [102, 101]),
                             ('token', 'never-export-credentials')]:
            with self.subTest(field=field):
                invalid = dict(result, **{field: value})
                with self.assertRaises(github.Error):
                    github.selections(identity, lambda identity: invalid)

    def test_provider_cleanup_preserves_app_selection_without_mutation(self):
        identity = {'repository_id': 101, 'repository': 'example-org/sample-app', 'slug': 'sample-app'}
        selected = {'identity': identity, 'github': {'packages': [], 'app_repositories': [101, 102],
                                                     'preserved_repositories': [102]}}
        with mock.patch.object(github, 'authority'), mock.patch.object(github, 'repository'), \
             mock.patch.object(github, 'packages', return_value=[]), \
             mock.patch.object(github, 'selections', return_value=[101, 102]), \
             mock.patch.object(github, 'repositories', return_value=[{'id': 101}, {'id': 102}]), \
             mock.patch.object(github, 'api') as api, mock.patch.object(github, 'operation') as operation:
            github.remove_resources(Path('/private'), selected, mock.Mock())
        api.assert_not_called()
        operation.assert_not_called()

    def test_orchestrator_injects_typed_reader_and_rejects_other_identity(self):
        snapshot = {'identity': {'repository_id': 101}}
        selected = {'identity': snapshot['identity'], 'extras': []}
        with mock.patch.object(deletion, 'host', return_value={'repository_ids': [101, 102]}) as host_call:
            reader = deletion.app_reader(snapshot, selected)
            self.assertEqual(reader(snapshot['identity']), {'repository_ids': [101, 102]})
            host_call.assert_called_once_with(snapshot, 'app-inventory', selected)
            with self.assertRaises(deletion.Error):
                reader({'repository_id': 999})


if __name__ == '__main__':
    unittest.main()
