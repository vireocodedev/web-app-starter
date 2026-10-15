import importlib.util
import http.client
import json
from pathlib import Path
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location(
    'smoke_images', Path(__file__).resolve().parents[1] / 'smoke_images.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeContractTests(unittest.TestCase):
    def test_identity_uses_only_user_labels_and_rejects_root_variants(self):
        for user in ('', 'root', '0', '0:1000', 'root:101'):
            with self.subTest(user=user), mock.patch.object(smoke, 'docker', return_value=json.dumps(
                    {'user': user, 'labels': {'org.opencontainers.image.revision': 'a' * 40}})) as docker, \
                    self.assertRaisesRegex(RuntimeError, 'non-root'):
                smoke.image_identity('fixture', 'a' * 40)
            self.assertNotIn('.Config.Env', docker.call_args.args[3])
        with mock.patch.object(smoke, 'docker', return_value=json.dumps(
                {'user': '101:101', 'labels': {'org.opencontainers.image.revision': 'a' * 40}})):
            smoke.image_identity('fixture', 'a' * 40)

    def test_identity_rejects_wrong_source(self):
        with mock.patch.object(smoke, 'docker', return_value=json.dumps(
                {'user': '101:101', 'labels': {'org.opencontainers.image.revision': 'wrong'}})), \
                self.assertRaisesRegex(RuntimeError, 'source label mismatch'):
            smoke.image_identity('fixture', 'a' * 40)

    def test_redirects_are_not_health_success(self):
        handler = smoke.RejectRedirect()
        with self.assertRaisesRegex(RuntimeError, 'redirect rejected'):
            handler.redirect_request(None, None, 302, 'fixture', {}, 'http://unexpected')

    def test_startup_connection_resets_retry_within_deadline(self):
        for error in (ConnectionResetError(), http.client.RemoteDisconnected()):
            response = mock.MagicMock()
            response.__enter__.return_value.status = 200
            response.__enter__.return_value.read.return_value = b'ok'
            opener = mock.Mock()
            opener.open.side_effect = [error, response]
            with self.subTest(error=type(error).__name__), \
                    mock.patch.object(smoke.urllib.request, 'build_opener', return_value=opener), \
                    mock.patch.object(smoke.time, 'sleep'):
                self.assertEqual(smoke.probe('http://fixture', 200), b'ok')
                self.assertEqual(opener.open.call_count, 2)

    def test_probe_deadline_still_fails(self):
        with mock.patch.object(smoke.time, 'monotonic', side_effect=[0, 1]), \
                self.assertRaisesRegex(RuntimeError, 'expected status'):
            smoke.probe('http://fixture', 200, timeout=1)

    def test_image_healthcheck_must_reach_healthy(self):
        with mock.patch.object(smoke, 'docker', side_effect=['starting', 'healthy']), \
                mock.patch.object(smoke.time, 'sleep'):
            smoke.healthy('fixture')
        with mock.patch.object(smoke, 'docker', return_value='unhealthy'), \
                self.assertRaisesRegex(RuntimeError, 'healthcheck failed'):
            smoke.healthy('fixture')
        with mock.patch.object(smoke.time, 'monotonic', side_effect=[0, 1]), \
                self.assertRaisesRegex(RuntimeError, 'healthcheck timed out'):
            smoke.healthy('fixture', timeout=1)


if __name__ == '__main__':
    unittest.main()
