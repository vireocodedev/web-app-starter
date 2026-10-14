import base64
import copy
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location(
    'github_app_credentials', Path(__file__).resolve().parents[1] / 'ci-runner/github_app.py')
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


class AppError(Exception):
    pass


class GitHubAppTests(unittest.TestCase):
    def setUp(self):
        self.settings = {'app_id': 1, 'installation_id': 2, 'owner': 'Acme'}
        self.protect = mock.Mock()
        self.validate = mock.Mock()
        self.credentials = app.GitHubAppCredentials(
            self.settings, '/root/private-app.pem', self.protect, self.validate, AppError)
        self.installation = {
            'id': 2, 'app_id': 1, 'account': {'type': 'Organization', 'login': 'Acme'},
            'repository_selection': 'selected', 'suspended_at': None,
            'permissions': {'actions': 'read', 'administration': 'write', 'metadata': 'read'},
        }

    def token(self, value='fixture-token', expiry=2000):
        return {'token': value, 'expires_at': datetime.fromtimestamp(
            expiry, timezone.utc).isoformat()}

    def test_jwt_uses_rs256_bounded_clock_and_key_not_secret_in_argv(self):
        with mock.patch.object(app.time, 'time', return_value=1000), mock.patch.object(
                app.subprocess, 'run', return_value=SimpleNamespace(
                    returncode=0, stdout=b'fixture-signature')) as signer:
            jwt = self.credentials.jwt()
        header, payload, signature = jwt.split('.')
        decode = lambda value: json.loads(base64.urlsafe_b64decode(value + '=' * (-len(value) % 4)))
        self.assertEqual(decode(header), {'alg': 'RS256', 'typ': 'JWT'})
        self.assertEqual(decode(payload), {'iat': 940, 'exp': 1540, 'iss': '1'})
        self.protect.assert_called_once_with(Path('/root/private-app.pem'))
        self.assertEqual(signer.call_args.args[0], [
            '/usr/bin/openssl', 'dgst', '-sha256', '-sign', '/root/private-app.pem'])
        self.assertEqual(signer.call_args.kwargs['input'], (header + '.' + payload).encode())

    def test_signing_failure_and_timeout_are_explicit(self):
        for failure in (SimpleNamespace(returncode=1, stdout=b''), subprocess.TimeoutExpired('openssl', 15)):
            with self.subTest(failure=failure), mock.patch.object(
                    app.subprocess, 'run') as signer, self.assertRaisesRegex(AppError, 'github-app-signing-failed'):
                if isinstance(failure, Exception):
                    signer.side_effect = failure
                else:
                    signer.return_value = failure
                self.credentials.jwt()

    def test_token_scoped_per_repository_cached_and_renewed_before_expiry(self):
        now = [1000]
        with mock.patch.object(app.time, 'time', side_effect=lambda: now[0]), mock.patch.object(
                self.credentials, 'jwt', return_value='fixture-jwt'), mock.patch.object(
                self.credentials, 'request', side_effect=[
                    self.installation, self.token(), self.installation, self.token('next', 3000)]) as request:
            self.assertEqual(self.credentials.token_for('Acme/app'), 'fixture-token')
            self.assertEqual(self.credentials.token_for('acme/APP'), 'fixture-token')
            self.assertEqual(request.call_count, 2)
            now[0] = 1941
            self.assertEqual(self.credentials.token_for('Acme/app'), 'next')
        self.assertEqual(request.call_args_list[1].args, (
            'fixture-jwt', '/access_tokens', 'POST',
            {'repositories': ['app'], 'permissions': {'actions': 'read', 'administration': 'write'}}))
        self.assertEqual(request.call_count, 4)

    def test_other_owner_rejected_before_signing_or_network(self):
        with mock.patch.object(self.credentials, 'jwt') as jwt, self.assertRaisesRegex(
                AppError, 'github-app-repository-owner-rejected'):
            self.credentials.token_for('Another/app')
        jwt.assert_not_called()

    def test_installation_identity_permissions_selection_and_suspension(self):
        for field, value in (
                ('id', 3), ('app_id', 3), ('repository_selection', 'all'),
                ('suspended_at', '2026-10-14T00:00:00Z'),
                ('account', {'type': 'User', 'login': 'Acme'}),
                ('account', {'type': 'Organization', 'login': 'Other'}),
                ('permissions', {'actions': 'write', 'administration': 'write'}),
                ('permissions', {'actions': 'read', 'administration': 'write', 'contents': 'write'})):
            installation = copy.deepcopy(self.installation)
            installation[field] = value
            with self.subTest(field=field, value=value), mock.patch.object(
                    self.credentials, 'jwt', return_value='fixture-jwt'), mock.patch.object(
                    self.credentials, 'request', return_value=installation) as request, self.assertRaisesRegex(
                        AppError, 'github-app-installation-policy-rejected'):
                self.credentials.token_for('Acme/app')
            self.assertEqual(request.call_count, 1)

    def test_malformed_expiry_tokens_never_enter_cache(self):
        for token in ({'token': 'fixture'}, {'token': 'fixture', 'expires_at': 'bad'},
                      {'token': 'fixture', 'expires_at': '2030-01-01T00:00:00'},
                      self.token('', 2000), self.token('invalid\nvalue', 2000), self.token('expired', 1050)):
            with self.subTest(token=token), mock.patch.object(app.time, 'time', return_value=1000), \
                    mock.patch.object(self.credentials, 'jwt', return_value='fixture-jwt'), \
                    mock.patch.object(self.credentials, 'request', side_effect=[self.installation, token]), \
                    self.assertRaises(AppError):
                self.credentials.token_for('Acme/app')
            self.assertEqual(self.credentials.tokens, {})

    def test_null_ids_only_allowed_as_dormant_settings(self):
        pending = {'app_id': None, 'installation_id': None, 'owner': 'Acme'}
        self.assertEqual(app.validate_settings(pending, AppError), pending)
        with self.assertRaisesRegex(AppError, 'github-app-not-configured'):
            app.GitHubAppCredentials(pending, '/root/key', self.protect, self.validate, AppError)
        for change in ({'app_id': True}, {'installation_id': None}, {'private_key': 'forbidden'}):
            settings = dict(self.settings, **change)
            with self.subTest(change=change), self.assertRaises(AppError):
                app.validate_settings(settings, AppError)

    def test_failed_token_issue_not_cached_and_no_automatic_retry(self):
        with mock.patch.object(self.credentials, 'jwt', return_value='fixture-jwt'), mock.patch.object(
                self.credentials, 'request', side_effect=[self.installation, AppError('fixture-failure')]) as request, \
                self.assertRaises(AppError):
            self.credentials.token_for('Acme/app')
        self.assertEqual(request.call_count, 2)
        self.assertEqual(self.credentials.tokens, {})

    def test_real_rsa_jwt_signature_verifies_with_openssl(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            key = root / 'key.pem'
            public = root / 'public.pem'
            subprocess.run(['/usr/bin/openssl', 'genpkey', '-algorithm', 'RSA',
                            '-pkeyopt', 'rsa_keygen_bits:2048', '-out', str(key)],
                           capture_output=True, check=True, timeout=30)
            subprocess.run(['/usr/bin/openssl', 'pkey', '-in', str(key), '-pubout', '-out', str(public)],
                           capture_output=True, check=True, timeout=15)
            credentials = app.GitHubAppCredentials(
                self.settings, key, self.protect, self.validate, AppError)
            jwt = credentials.jwt()
            header, claims, signature = jwt.split('.')
            (root / 'message').write_bytes((header + '.' + claims).encode())
            (root / 'signature').write_bytes(base64.urlsafe_b64decode(
                signature + '=' * (-len(signature) % 4)))
            result = subprocess.run(['/usr/bin/openssl', 'dgst', '-sha256', '-verify', str(public),
                                     '-signature', str(root / 'signature'), str(root / 'message')],
                                    capture_output=True, text=True, timeout=15)
            self.assertEqual(result.returncode, 0)
            self.assertIn('Verified OK', result.stdout)

if __name__ == '__main__':
    unittest.main()
