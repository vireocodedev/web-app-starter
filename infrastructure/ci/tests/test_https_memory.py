"""Exercise real HTTPS connections without GitHub, host changes or credentials."""
import contextlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
from pathlib import Path
import ssl
import subprocess
import tempfile
import threading
import unittest
from unittest import mock
import urllib.request
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('memory_controller', ROOT / 'ci-runner/controller.py')
ctl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ctl)
release_spec = importlib.util.spec_from_file_location('memory_release_protocol', ROOT.parent / 'release/protocol.py')
release = importlib.util.module_from_spec(release_spec)
release_spec.loader.exec_module(release)


class HTTPSMemoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.temporary.cleanup)
        root = Path(cls.temporary.name)
        cls.certificate = root / 'certificate.pem'
        key = root / 'key.pem'
        subprocess.run(
            ['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
             '-subj', '/CN=fixture.invalid', '-addext', 'subjectAltName=IP:127.0.0.1',
             '-keyout', str(key), '-out', str(cls.certificate)],
            check=True, capture_output=True, timeout=15)

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path.endswith('/redirect'):
                    self.send_response(302)
                    self.send_header('Location', '/unexpected')
                    self.end_headers()
                else:
                    body = b'{"fixture":true}'
                    self.send_response(200)
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)

            def log_message(self, *_args):
                pass

        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        server_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        server_context.load_cert_chain(cls.certificate, key)
        cls.server.socket = server_context.wrap_socket(cls.server.socket, server_side=True)
        thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        thread.start()
        cls.addClassCleanup(thread.join, 5)
        cls.addClassCleanup(cls.server.server_close)
        cls.addClassCleanup(cls.server.shutdown)

    def setUp(self):
        self.module = ctl.app_module()
        cache = getattr(self.module, 'https_context', None)
        if cache:
            cache.cache_clear()
            self.addCleanup(cache.cache_clear)
        release._transport.https_context.cache_clear()
        self.addCleanup(release._transport.https_context.cache_clear)
        self.host = '127.0.0.1'
        self.contexts = []
        original_context = ssl.create_default_context
        original_request = urllib.request.Request

        def context():
            value = original_context()
            value.load_verify_locations(self.certificate)
            self.contexts.append(value)
            return value

        def request(url, *args, **kwargs):
            suffix = urllib.parse.urlsplit(url).path
            return original_request(f'https://{self.host}:{self.server.server_port}' + suffix, *args, **kwargs)

        self.patches = contextlib.ExitStack()
        self.addCleanup(self.patches.close)
        for patch in (
                mock.patch.object(ssl, 'create_default_context', side_effect=context),
                mock.patch.object(ssl, '_create_default_https_context', side_effect=context),
                mock.patch.object(urllib.request, 'Request', side_effect=request),
                mock.patch.object(ctl, 'load_config', return_value={}),
                mock.patch.object(ctl, 'repositories', return_value=('Fixture/project',))):
            self.patches.enter_context(patch)

    def test_actual_ci_requests_load_the_verified_trust_store_once(self):
        for _ in range(4):
            self.assertEqual(ctl.api('fixture-only-token', 'Fixture/project', 'actions/runs'), {'fixture': True})
        self.assertEqual(len(self.contexts), 1, 'Every request must not allocate another native TLS trust store.')
        self.assertTrue(self.contexts[0].check_hostname)
        self.assertEqual(self.contexts[0].verify_mode, ssl.CERT_REQUIRED)

    def test_actual_app_requests_load_the_verified_trust_store_once(self):
        credentials = self.module.GitHubAppCredentials(
            {'app_id': 1, 'installation_id': 2, 'owner': 'Fixture'}, '/unused-fixture-key',
            lambda _path: None, lambda _repo: None, ctl.BoundaryError)
        for _ in range(4):
            self.assertEqual(credentials.request('fixture-only-jwt', ''), {'fixture': True})
        self.assertEqual(len(self.contexts), 1)

    def test_deployment_polling_uses_the_same_bounded_verified_transport(self):
        api = release.GitHub('fixture-only-token-' + 'x' * 30)
        for _ in range(4):
            self.assertEqual(api.request('/repos/fixture/project'), {'fixture': True})
        self.assertEqual(len(self.contexts), 1)
        self.assertTrue(self.contexts[0].check_hostname)
        self.assertEqual(self.contexts[0].verify_mode, ssl.CERT_REQUIRED)

    def test_hostname_verification_and_redirect_rejection_remain_enabled(self):
        self.host = 'localhost'
        with self.assertRaisesRegex(ctl.BoundaryError, 'github-api-unavailable'):
            ctl.api('fixture-only-token', 'Fixture/project', 'actions/runs')
        self.host = '127.0.0.1'
        with self.assertRaisesRegex(ctl.BoundaryError, 'github-api-redirect-rejected'):
            ctl.api('fixture-only-token', 'Fixture/project', 'actions/redirect')


if __name__ == '__main__':
    unittest.main()
