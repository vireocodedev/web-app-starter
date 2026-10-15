import hashlib
import io
import json
from pathlib import Path
import subprocess
import shutil
import sys
import tempfile
import unittest
from unittest import mock
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from protocol import GitHub, ReleaseError, bearer, decode, pair, repository

SHA = 'a' * 40
REPO = 'vireocodedev/web-app-starter'
PAIR = {'repository': REPO, 'source_sha': SHA,
        'frontend': 'ghcr.io/' + REPO + '-frontend@sha256:' + 'b' * 64,
        'backend': 'ghcr.io/' + REPO + '-backend@sha256:' + 'c' * 64}


class ProtocolTests(unittest.TestCase):
    def test_real_isolated_helpers_ignore_checkout_module_shadowing(self):
        source = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for helper in ('client.py', 'protocol.py', 'smoke_images.py'):
                shutil.copyfile(source / helper, root / helper)
            marker = root / 'shadow-executed'
            shadow = "from pathlib import Path\nPath(" + repr(str(marker)) + ").write_text('executed')\n"
            for module in ('subprocess', 'json', 'argparse', 'tempfile', 'http', 'urllib'):
                (root / (module + '.py')).write_text(shadow)
            for helper in ('client.py', 'smoke_images.py'):
                result = subprocess.run([sys.executable, '-I', '-S', str(root / helper), '--help'],
                                        cwd=root, capture_output=True, timeout=15)
                self.assertEqual(result.returncode, 0, result.stderr.decode())
                self.assertFalse(marker.exists())

    def test_staging_privileged_helpers_run_only_in_fresh_isolated_jobs(self):
        workflows = Path(__file__).resolve().parents[3] / '.github/workflows'
        staging = (workflows / 'deploy-staging.yaml').read_text()
        build = staging.split('  build:\n', 1)[1].split('  release:\n', 1)[0]
        release = staging.split('  release:\n', 1)[1].split('  deploy:\n', 1)[0]
        self.assertNotIn('packages: write', build)
        self.assertNotIn('client.py', build)
        self.assertIn('needs: build', release)
        self.assertIn('packages: write', release)
        self.assertNotIn('npm run', release)
        self.assertNotIn('./gradlew', release)
        self.assertIn('python3 -I -S infrastructure/release/smoke_images.py', release)
        for name in ('deploy-staging.yaml', 'deploy-production.yaml'):
            for line in (workflows / name).read_text().splitlines():
                if 'python3 ' in line and 'client.py' in line:
                    self.assertIn('python3 -I -S ', line)

    def test_pair_is_strict_and_never_accepts_tags_or_another_package(self):
        self.assertEqual(pair(PAIR, REPO, SHA), PAIR)
        for change in ({'source_sha': 'd' * 40}, {'backend': 'ghcr.io/' + REPO + '-backend:latest'},
                       {'frontend': 'ghcr.io/elsewhere/app@sha256:' + 'f' * 64},
                       {'extra': 'field'}, {'repository': 'elsewhere/app'}):
            with self.subTest(change=change), self.assertRaises(ReleaseError):
                pair(dict(PAIR, **change), REPO, SHA)

    def test_bearer_is_opaque_bounded_and_excludes_controls(self):
        for token in ('ghs_' + 'a' * 40, 'ghs_' + 'b' * 255, 'opaque.' + 'X' * 1024):
            self.assertEqual(bearer(token), token)
        for token in ('short', 'x' * 16385, 'x' * 40 + '\n', 'x' * 40 + '\x7f', None):
            with self.assertRaisesRegex(ReleaseError, 'invalid-bearer'):
                bearer(token)

    def test_duplicate_keys_and_repository_traversal_rejected(self):
        with self.assertRaisesRegex(ReleaseError, 'duplicate'):
            decode('{"source":1,"source":2}')
        for repo in ('owner/../../escape', 'OWNER/app', 'https://github.com/owner/app', 'owner/app?ref=main'):
            with self.assertRaises(ReleaseError):
                repository(repo)

    def test_artifact_digest_members_and_redirect_host_are_checked(self):
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w') as archive:
            archive.writestr('request.cms', b'encrypted')
        data = output.getvalue()
        artifact = {'id': 3, 'name': 'deploy-request-1', 'expired': False,
                    'size_in_bytes': len(data), 'digest': 'sha256:' + hashlib.sha256(data).hexdigest()}
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = data
        api = GitHub('opaque-' + 'x' * 40)
        with mock.patch.object(api, 'request', side_effect=[
                {'total_count': 1, 'artifacts': [artifact]},
                'https://example.blob.core.windows.net/archive?sig=redacted']), \
                mock.patch('urllib.request.build_opener') as opener:
            opener.return_value.open.return_value = response
            self.assertEqual(api.artifact(REPO, 1, 'deploy-request-1', 'request.cms'), b'encrypted')
            self.assertIsInstance(opener.return_value.open.call_args.args[0], str)
        for location in ('http://example.blob.core.windows.net/file', 'https://evil.example/file',
                         'https://token@example.blob.core.windows.net/file'):
            with self.subTest(location=location), mock.patch.object(api, 'request', side_effect=[
                    {'total_count': 1, 'artifacts': [artifact]}, location]), \
                    self.assertRaisesRegex(ReleaseError, 'host-rejected'):
                api.artifact(REPO, 1, 'deploy-request-1', 'request.cms')
        with mock.patch.object(api, 'request', side_effect=[
                {'total_count': 1, 'artifacts': [dict(artifact, digest='sha256:' + '0' * 64)]},
                'https://example.blob.core.windows.net/archive']), \
                mock.patch('urllib.request.build_opener') as opener, \
                self.assertRaisesRegex(ReleaseError, 'digest-mismatch'):
            opener.return_value.open.return_value = response
            api.artifact(REPO, 1, 'deploy-request-1', 'request.cms')

    def test_real_cms_roundtrip_and_tamper_detection_for_long_opaque_token(self):
        with tempfile.TemporaryDirectory() as directory:
            key, cert = Path(directory) / 'key', Path(directory) / 'cert'
            result = subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-nodes',
                                     '-days', '1', '-subj', '/CN=fixture', '-keyout', str(key), '-out', str(cert)],
                                    capture_output=True, timeout=15)
            self.assertEqual(result.returncode, 0)
            raw = json.dumps({'token': 'opaque.' + 'x' * 1024, 'pair': PAIR}).encode()
            encrypted = subprocess.run(
                ['openssl', 'cms', '-encrypt', '-binary', '-aes-256-gcm', '-outform', 'DER',
                 '-recip', str(cert), '-keyopt', 'rsa_padding_mode:oaep', '-keyopt', 'rsa_oaep_md:sha256'],
                input=raw, capture_output=True, timeout=15)
            self.assertEqual(encrypted.returncode, 0)
            args = ['openssl', 'cms', '-decrypt', '-binary', '-inform', 'DER', '-inkey', str(key)]
            decrypted = subprocess.run(args, input=encrypted.stdout, capture_output=True, timeout=15)
            self.assertEqual(decrypted.returncode, 0)
            self.assertEqual(decrypted.stdout, raw)
            damaged = bytearray(encrypted.stdout)
            damaged[-1] ^= 1
            rejected = subprocess.run(args, input=damaged, capture_output=True, timeout=15)
            self.assertNotEqual(rejected.returncode, 0)


if __name__ == '__main__':
    unittest.main()
