"""Explicit GitHub authentication boundaries; no real login or credential changes."""
import contextlib
import importlib
import importlib.util
import io
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    shared = importlib.import_module('_shared')
    specification = importlib.util.spec_from_file_location(
        'initialization_authentication_step', SCRIPTS / '2_3_authenticate_github.py')
    authentication = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(authentication)
finally:
    sys.path.pop(0)


class AuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.ctx = SimpleNamespace(values={'MAINTAINER_LOGIN': 'fixture-maintainer'})
        self.commands = []
        self.status = 0
        self.responses = []
        self.context = patch.object(authentication, 'load_context', return_value=self.ctx).start()
        self.run = patch.object(authentication, 'run', side_effect=self.command).start()
        self.api = patch.object(authentication, 'github_api', side_effect=self.response).start()
        self.addCleanup(patch.stopall)

    def command(self, argv, **kwargs):
        self.commands.append((list(argv), kwargs))
        status = self.status if argv[:3] == ['gh', 'auth', 'status'] else 0
        return subprocess.CompletedProcess(argv, status, 'private-status-output', 'private-status-error')

    def response(self, endpoint, include=False):
        expected_endpoint, expected_include, value = self.responses.pop(0)
        self.assertEqual((endpoint, include), (expected_endpoint, expected_include))
        return value

    def account(self, scopes='repo, read:org, read:user', *, login='fixture-maintainer'):
        self.responses.extend([
            ('user', False, {'login': login}),
            ('user', True, 'HTTP/2.0 200\r\nX-OAuth-Scopes: ' + scopes + '\r\n\r\n{}'),
        ])

    def invoke(self, *, login=False):
        argv = ['2_3_authenticate_github.py', '--env', '/tmp/fixture-authentication-values.env']
        if login:
            argv.append('--login')
        output = io.StringIO()
        with patch.object(sys, 'argv', argv), contextlib.redirect_stdout(output):
            authentication.main()
        self.assertEqual(self.responses, [])
        self.context.assert_called_once()
        self.assertFalse(self.context.call_args.kwargs['require_verified'])
        return output.getvalue()

    def mutations(self):
        return [argv for argv, _ in self.commands if argv[:3] != ['gh', 'auth', 'status']]

    def test_existing_full_scope_login_does_not_change_authentication(self):
        self.account(login='FIXTURE-MAINTAINER')
        output = self.invoke()
        self.assertEqual(self.mutations(), [])
        self.assertIn('authenticated', output)
        self.assertNotIn('private-status', output)

    def test_user_scope_already_covers_read_user_without_mutation(self):
        self.account(scopes='repo, read:org, user')
        self.invoke(login=True)
        self.assertEqual(self.mutations(), [])

    def test_missing_scope_without_explicit_login_fails_with_actionable_instruction(self):
        self.account(scopes='repo, read:org')
        with self.assertRaisesRegex(authentication.InitError, 'read:user.*--login'):
            self.invoke()
        self.assertEqual(self.mutations(), [])

    def test_explicit_login_refreshes_only_missing_scope_and_reads_back_identity(self):
        self.account(scopes='repo, read:org')
        self.account()
        self.invoke(login=True)
        self.assertEqual(self.mutations(), [
            ['gh', 'auth', 'refresh', '--hostname', 'github.com', '--scopes', 'read:user'],
        ])
        refresh = [options for argv, options in self.commands if argv[:3] == ['gh', 'auth', 'refresh']]
        self.assertIsNone(refresh[0]['timeout'])
        self.assertEqual(self.api.call_count, 4)

    def test_changed_account_after_refresh_stops(self):
        self.account(scopes='repo, read:org')
        self.account(login='different-maintainer')
        with self.assertRaisesRegex(authentication.InitError, 'Refreshed GitHub account/scope differs'):
            self.invoke(login=True)
        self.assertEqual(len(self.mutations()), 1)

    def test_initial_wrong_account_never_refreshes_even_with_login_option(self):
        self.responses = [('user', False, {'login': 'different-maintainer'})]
        with self.assertRaisesRegex(authentication.InitError, 'Active GitHub account differs'):
            self.invoke(login=True)
        self.assertEqual(self.mutations(), [])
        self.assertEqual(self.api.call_count, 1)

    def test_unauthenticated_explicit_login_requests_all_required_scopes(self):
        self.status = 1
        self.account()
        self.invoke(login=True)
        self.assertEqual(self.mutations(), [
            ['gh', 'auth', 'login', '--hostname', 'github.com', '--web', '--scopes', 'repo,read:org,read:user'],
        ])
        login = [options for argv, options in self.commands if argv[:3] == ['gh', 'auth', 'login']]
        self.assertIsNone(login[0]['timeout'])

    def test_unauthenticated_default_fails_without_login_or_api_request(self):
        self.status = 1
        with self.assertRaisesRegex(authentication.InitError, 'unauthenticated.*--login'):
            self.invoke()
        self.assertEqual(self.mutations(), [])
        self.api.assert_not_called()

    def test_scope_still_missing_after_refresh_fails_instead_of_assuming_success(self):
        self.account(scopes='repo, read:org')
        self.account(scopes='repo, read:org')
        with self.assertRaisesRegex(authentication.InitError, 'Refreshed GitHub account/scope differs'):
            self.invoke(login=True)
        self.assertEqual(len(self.mutations()), 1)
        self.assertEqual(self.api.call_count, 4)

    def test_missing_scope_header_fails_closed_without_refresh(self):
        self.responses = [('user', False, {'login': 'fixture-maintainer'}),
                          ('user', True, 'HTTP/2.0 200\r\n\r\n{}')]
        with self.assertRaisesRegex(authentication.InitError, 'read:user'):
            self.invoke()
        self.assertEqual(self.mutations(), [])

    def test_failed_api_response_does_not_expose_private_stdout_or_stderr(self):
        # Retain the real captured API/run boundary: a process failure must not
        # accidentally turn its authenticated response body into a chat/log error.
        failure = subprocess.CompletedProcess([], 1, 'private-api-response', 'private-api-credential')
        output, error_output = io.StringIO(), io.StringIO()
        with patch.object(authentication, 'github_api', shared.github_api), \
                patch.object(shared.subprocess, 'run', return_value=failure), \
                patch.object(sys, 'argv', ['2_3_authenticate_github.py']), \
                contextlib.redirect_stdout(output), contextlib.redirect_stderr(error_output):
            with self.assertRaises(authentication.InitError) as raised:
                authentication.main()
        combined = str(raised.exception) + output.getvalue() + error_output.getvalue()
        self.assertIn('gh failed', combined)
        self.assertNotIn('private-api-response', combined)
        self.assertNotIn('private-api-credential', combined)
        self.assertEqual(self.mutations(), [])
