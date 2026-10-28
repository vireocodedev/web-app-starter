"""The intake preview exposes validated nonsecret inputs without changing state."""
import contextlib
import importlib.util
import io
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / 'docs/template-initialization/scripts'


class InitializationIntakePreviewTests(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('initialization_values_preview', SCRIPTS / '1_1_prepare_values.py')
        self.module = importlib.util.module_from_spec(spec)
        with mock.patch.object(sys, 'path', [str(SCRIPTS), *sys.path]):
            spec.loader.exec_module(self.module)
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'values.env'
        self.path.parent.chmod(0o700)
        values = (ROOT / 'docs/template-initialization/.env.example').read_text()
        values = values.replace('MAINTAINER_LOGIN=your-github-login', 'MAINTAINER_LOGIN=fixture-maintainer')
        values = values.replace('INITIAL_EMAIL=admin@example.com', 'INITIAL_EMAIL=developer@fixture.invalid')
        self.path.write_text(values)
        self.path.chmod(0o600)

    def invoke(self, *options):
        self.output = io.StringIO()
        with mock.patch.object(sys, 'argv', ['1_1_prepare_values.py', '--env', str(self.path), *options]), \
                contextlib.redirect_stdout(self.output):
            self.module.main()
        return self.output.getvalue()

    def test_preview_prints_every_validated_input_and_changes_no_files(self):
        before = self.path.read_bytes()
        expected = self.module.read_values(self.path)
        self.assertEqual(len(expected), 22)
        actual = dict(line.split('=', 1) for line in self.invoke('--show-values').splitlines())
        self.assertEqual(actual, expected)
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)
        self.assertEqual([path.name for path in self.path.parent.iterdir()], ['values.env'])

    def test_unknown_sensitive_input_is_rejected_before_any_preview(self):
        with self.path.open('a') as stream:
            stream.write('\nSECRET_TOKEN=do-not-disclose-this-value\n')
        with self.assertRaises(self.module.InitError):
            self.invoke('--show-values')
        self.assertEqual(self.output.getvalue(), '')

    def test_invalid_known_values_do_not_produce_a_preview(self):
        self.path.write_text(self.path.read_text().replace('developer@fixture.invalid', 'admin@example.com'))
        with self.assertRaises(self.module.InitError):
            self.invoke('--show-values')
        self.assertEqual(self.output.getvalue(), '')

    def test_existing_values_are_not_recreated(self):
        before = self.path.read_bytes()
        with self.assertRaises(self.module.InitError):
            self.invoke()
        self.assertEqual(self.path.read_bytes(), before)

    def test_preview_and_check_are_mutually_exclusive(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as stopped:
            self.invoke('--show-values', '--check')
        self.assertEqual(stopped.exception.code, 2)


if __name__ == '__main__':
    unittest.main()
