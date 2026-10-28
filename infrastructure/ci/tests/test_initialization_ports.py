"""Port selection preserves protected consumer state; host probing is read-only."""
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
import _ports as ports
import _shared as shared


class DeploymentPortTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.directory.chmod(0o700)
        self.env = self.directory / 'values.env'
        self.env.write_text((SCRIPTS.parent / '.env.example').read_text().replace(
            'your-github-login', 'fixture-owner').replace('admin@example.com', 'admin@vireocode.com'))
        self.env.chmod(0o600)
        self.ctx = shared.load_context(SimpleNamespace(env=self.env), require_verified=False)
        self.current = tuple(int(self.ctx.values[key]) for key in ports.PORT_KEYS)
        self.addCleanup(patch.stopall)
        patch.object(ports, 'require_consumer').start()
        self.output = io.StringIO()
        redirect = contextlib.redirect_stdout(self.output)
        redirect.__enter__()
        self.addCleanup(redirect.__exit__, None, None, None)

    def select(self, used=(), namespace=False):
        with patch.object(ports, 'inventory', return_value={'ports': list(used), 'namespace_exists': namespace}):
            ports.select(self.ctx)

    def test_free_selected_ports_are_byte_identical_even_with_receipt(self):
        (self.directory / 'verification.json').write_text('existing receipt')
        original = self.env.read_bytes()
        self.select()
        self.assertEqual(self.env.read_bytes(), original)

    def test_listener_or_stopped_reservation_selects_next_quartet_only(self):
        original = self.env.read_bytes()
        self.select((18280, 18480))
        values = shared.read_values(self.env)
        self.assertEqual(tuple(int(values[key]) for key in ports.PORT_KEYS), (18680, 18681, 18780, 18781))
        expected = original
        for key, old in zip(ports.PORT_KEYS, self.current):
            expected = expected.replace(f'{key}={old}'.encode(), f'{key}={values[key]}'.encode())
        self.assertEqual(self.env.read_bytes(), expected)
        self.assertEqual(self.env.stat().st_mode & 0o777, 0o600)

    def test_recorded_state_blocks_reassignment_without_erasing_anything(self):
        for name in ('verification.json', 'progress.json', 'result.json'):
            target = self.directory / name
            target.write_text('preserve this')
            before = self.env.read_bytes()
            with self.subTest(name=name), self.assertRaisesRegex(ports.InitError, 'invalidate'):
                self.select((self.current[0],))
            self.assertEqual(self.env.read_bytes(), before)
            self.assertEqual(target.read_text(), 'preserve this')
            target.unlink()

    def test_existing_namespace_and_exhausted_range_preserve_values(self):
        before = self.env.read_bytes()
        with self.assertRaisesRegex(ports.InitError, 'namespace'):
            self.select(namespace=True)
        with self.assertRaisesRegex(ports.InitError, 'No available'):
            ports.choose(self.current, set(range(1024, 65536)))
        self.assertEqual(self.env.read_bytes(), before)

    def test_strict_ssh_fixed_code_and_json_inputs(self):
        with patch.object(ports, 'run', return_value=SimpleNamespace(stdout='{"ports":[],"namespace_exists":false}')) as command:
            ports.inventory(self.ctx)
        argv = command.call_args.args[0]
        self.assertIn('StrictHostKeyChecking=yes', argv)
        self.assertIn('BatchMode=yes', argv)
        self.assertEqual(json.loads(command.call_args.kwargs['input']), {
            key: self.ctx.values[key] for key in ('PROJECT_SLUG', 'RELEASE_SOURCE')})
        self.assertNotIn(self.ctx.values['PROJECT_SLUG'], argv[-1])

    def test_malformed_host_inventory_is_not_treated_as_free(self):
        for value in ('{}', '{"ports":[true],"namespace_exists":false}',
                      '{"ports":[65536],"namespace_exists":false}', 'not JSON'):
            with self.subTest(value=value), patch.object(ports, 'run', return_value=SimpleNamespace(stdout=value)), self.assertRaises(ports.InitError):
                ports.inventory(self.ctx)

    def test_concurrent_env_edit_is_preserved(self):
        original = self.env.read_bytes()
        def observe(ctx):
            self.env.write_bytes(original + b'# concurrent edit\n')
            return {'ports': [self.current[0]], 'namespace_exists': False}
        with patch.object(ports, 'inventory', side_effect=observe), self.assertRaisesRegex(ports.InitError, 'changed during'):
            ports.select(self.ctx)
        self.assertEqual(self.env.read_bytes(), original + b'# concurrent edit\n')
        self.assertEqual(list(self.directory.glob('.values-ports-*')), [])

    def test_actual_host_probe_includes_stopped_runtime_reservations(self):
        # Execute the shipped fixed program with only its host/process boundaries substituted.
        import pathlib
        root = self.directory / 'host'
        runtime = root / 'etc/web-app-deploy/other/runtime.json'
        runtime.parent.mkdir(parents=True)
        for directory in (runtime.parent, runtime.parent.parent):
            directory.chmod(0o700)
        runtime.write_text(json.dumps({'environments': {
            'staging': {'frontend_port': 18480, 'backend_port': 18481},
            'production': {'frontend_port': 18580, 'backend_port': 18581}}}))
        runtime.chmod(0o600)
        real_path, real_lstat = Path, Path.lstat
        def path(value):
            return root / str(value).lstrip('/')
        def lstat(item):
            data = list(real_lstat(item))
            data[4] = 0  # owned by the simulated operator
            return os.stat_result(data)
        output = io.StringIO()
        with patch.object(pathlib, 'Path', side_effect=path), patch.object(real_path, 'lstat', lstat), \
                patch('os.geteuid', return_value=0), patch('subprocess.check_output', return_value='LISTEN 0 128 0.0.0.0:18280 0.0.0.0:*\n'), \
                patch.object(sys, 'stdin', io.StringIO(json.dumps(self.ctx.values))), contextlib.redirect_stdout(output):
            exec(compile(ports.PROBE, '<host-port-probe>', 'exec'), {})
        observed = json.loads(output.getvalue())
        self.assertEqual(observed, {'ports': [18280, 18480, 18481, 18580, 18581], 'namespace_exists': False})
