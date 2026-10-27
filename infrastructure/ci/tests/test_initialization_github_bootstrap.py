"""Consumer GitHub bootstrap boundaries; no live GitHub requests."""
import copy
import importlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    bootstrap = importlib.import_module('_github_bootstrap')
finally:
    sys.path.pop(0)


class GitHubFake:
    def __init__(self):
        self.base = 'repos/fixture-owner/sample-app/actions/permissions'
        self.settings = {'enabled': False, 'allowed_actions': 'selected', 'sha_pinning_required': True}
        self.selected = {'github_owned_allowed': False, 'verified_allowed': False,
                         'patterns_allowed': ['trusted/existing@*']}
        self.workflow = {'default_workflow_permissions': 'write', 'can_approve_pull_request_reviews': True}
        self.calls = []
        self.fail = None
        self.stale = False
        self.dropped_pattern = False

    def api(self, path, *, method='GET', body=None):
        self.calls.append((method, path, copy.deepcopy(body)))
        if self.fail == (method, path):
            raise bootstrap.InitError('HTTP 403 organization policy')
        target = {'': self.settings, '/selected-actions': self.selected, '/workflow': self.workflow}[path.removeprefix(self.base)]
        if method == 'PUT':
            if not self.stale:
                target.clear()
                target.update(copy.deepcopy(body))
                if self.dropped_pattern and path.endswith('/selected-actions'):
                    target['patterns_allowed'].remove('trusted/existing@*')
            return None
        return copy.deepcopy(target)

    def writes(self):
        return [call for call in self.calls if call[0] != 'GET']


class ActionsBootstrapTests(unittest.TestCase):
    def setUp(self):
        self.fake = GitHubFake()
        self.ctx = SimpleNamespace(values={'REPOSITORY': 'fixture-owner/sample-app'})
        self.pin = 'actions/checkout@' + 'a' * 40
        self.identity = patch.object(bootstrap, 'verify_github', return_value={'repository_id': 23}).start()
        self.required = patch.object(bootstrap, 'required_actions', return_value=[self.pin]).start()
        self.api = patch.object(bootstrap, 'api', side_effect=self.fake.api).start()
        self.state = patch.object(bootstrap, 'update_state').start()
        self.addCleanup(patch.stopall)

    def test_preserves_selections_pins_and_enforces_safe_tokens(self):
        bootstrap.ensure_actions(self.ctx)
        self.identity.assert_called_once_with(self.ctx, 'resume')
        self.assertEqual(self.fake.selected['patterns_allowed'], [self.pin, 'trusted/existing@*'])
        self.assertFalse(self.fake.selected['github_owned_allowed'])
        self.assertTrue(self.fake.settings['sha_pinning_required'])
        self.assertTrue(self.fake.settings['enabled'])
        self.assertEqual(self.fake.workflow, {'default_workflow_permissions': 'read', 'can_approve_pull_request_reviews': False})
        self.assertEqual(self.fake.writes()[0][1], self.fake.base + '/workflow')
        self.assertEqual(self.state.call_args.kwargs['github_actions_verified']['repository_id'], 23)
        self.assertTrue(all('/orgs/' not in call[1] for call in self.fake.calls))

    def test_retry_is_read_only_when_already_configured(self):
        bootstrap.ensure_actions(self.ctx)
        self.fake.calls.clear()
        bootstrap.ensure_actions(self.ctx)
        self.assertEqual(self.fake.writes(), [])

    def test_preserves_all_policy_and_selected_allow_flags(self):
        for allowed in ('all', 'selected'):
            with self.subTest(allowed=allowed):
                self.fake = GitHubFake()
                self.api.side_effect = self.fake.api
                self.fake.settings['allowed_actions'] = allowed
                self.fake.selected['verified_allowed'] = True
                self.fake.selected['github_owned_allowed'] = True
                bootstrap.ensure_actions(self.ctx)
                self.assertEqual(self.fake.settings['allowed_actions'], allowed)
                self.assertTrue(self.fake.selected['verified_allowed'])
                self.assertTrue(self.fake.selected['github_owned_allowed'])

    def test_local_only_adds_only_pinned_actions(self):
        self.fake.settings['allowed_actions'] = 'local_only'
        bootstrap.ensure_actions(self.ctx)
        self.assertEqual(self.fake.settings['allowed_actions'], 'selected')
        self.assertEqual(self.fake.selected['patterns_allowed'], [self.pin, 'trusted/existing@*'])

    def test_stale_readback_and_lost_existing_selection_fail_without_receipt(self):
        for attribute in ('stale', 'dropped_pattern'):
            with self.subTest(attribute=attribute):
                self.fake = GitHubFake()
                setattr(self.fake, attribute, True)
                self.api.side_effect = self.fake.api
                self.state.reset_mock()
                with self.assertRaises(bootstrap.InitError):
                    bootstrap.ensure_actions(self.ctx)
                self.state.assert_not_called()

    def test_auth_or_org_conflict_never_writes_success_receipt(self):
        self.fake.fail = ('PUT', self.fake.base)
        with self.assertRaisesRegex(bootstrap.InitError, '403'):
            bootstrap.ensure_actions(self.ctx)
        self.state.assert_not_called()
        self.identity.side_effect = bootstrap.InitError('wrong identity')
        self.fake.calls.clear()
        with self.assertRaisesRegex(bootstrap.InitError, 'wrong identity'):
            bootstrap.ensure_actions(self.ctx)
        self.assertEqual(self.fake.calls, [])

    def test_incomplete_selected_inventory_stops_before_mutation(self):
        del self.fake.selected['verified_allowed']
        with self.assertRaisesRegex(bootstrap.InitError, 'incomplete'):
            bootstrap.ensure_actions(self.ctx)
        self.assertEqual(self.fake.writes(), [])


class BootstrapAdapterTests(unittest.TestCase):
    def test_global_endpoint_and_json_stdin(self):
        response = subprocess.CompletedProcess([], 0, 'HTTP/2.0 204\r\n\r\n', '')
        with patch.object(bootstrap, 'run', return_value=response) as command:
            self.assertIsNone(bootstrap.api('user/installations/123/repositories/45', method='PUT', body={'enabled': True}))
        argv = command.call_args.args[0]
        self.assertEqual(argv[2], 'user/installations/123/repositories/45')
        self.assertEqual(json.loads(command.call_args.kwargs['input']), {'enabled': True})
        self.assertNotIn('True', argv)

    def test_access_failure_does_not_expose_authenticated_body(self):
        for code in (401, 403, 422, 503):
            with self.subTest(code=code):
                response = subprocess.CompletedProcess([], 1, 'HTTP/2.0 ' + str(code) + '\n\nprivate-secret', 'private-secret')
                with patch.object(bootstrap, 'run', return_value=response):
                    with self.assertRaises(bootstrap.InitError) as raised:
                        bootstrap.api('repos/fixture-owner/sample-app/actions/permissions', method='PUT')
                self.assertIn(str(code), str(raised.exception))
                self.assertNotIn('private-secret', str(raised.exception))

    def test_workflow_inventory_uses_only_checked_in_pinned_references(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            workflows = root / '.github/workflows'
            workflows.mkdir(parents=True)
            checked = workflows / 'ci.yml'
            pin = 'actions/checkout@' + 'a' * 40
            checked.write_text('steps:\n  - uses: ' + pin + ' # reviewed\n  - uses: ./local-action\n')
            (workflows / 'untracked.yml').write_text('  - uses: malicious/action@main\n')
            response = subprocess.CompletedProcess([], 0, '.github/workflows/ci.yml\n', '')
            with patch.object(bootstrap, 'run', return_value=response):
                self.assertEqual(bootstrap.required_actions(SimpleNamespace(root=root)), [pin])
                checked.write_text('  - uses: actions/checkout@main\n')
                with self.assertRaisesRegex(bootstrap.InitError, 'full commit SHAs'):
                    bootstrap.required_actions(SimpleNamespace(root=root))
