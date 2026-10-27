"""Automatic registration hashes remain bound to the observed host and source."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / 'docs/template-initialization/scripts'
spec = importlib.util.spec_from_file_location('ci_capture_operations', SCRIPTS / '_operations.py')
operator = importlib.util.module_from_spec(spec)
with mock.patch.object(sys, 'path', [str(SCRIPTS), *sys.path]):
    spec.loader.exec_module(operator)


class ConfigurationCaptureTests(unittest.TestCase):
    def setUp(self):
        self.ctx = SimpleNamespace(values={'REPOSITORY': 'vireocodedev/fixture-app', 'PROJECT_SLUG': 'fixture-app'})
        self.source = Path('/root/web-app-starter')
        self.identity = {'repository': 'vireocodedev/fixture-app', 'slug': 'fixture-app',
                         'source': str(self.source), 'source_sha': 'a' * 40,
                         'manage_sha256': 'b' * 64, 'installed_controller_sha256': 'c' * 64,
                         'boot_id': 'ed26772a-edcf-4ef0-b4c6-8f5856583580'}
        self.inspect = {'installed': True, 'configuration_sha256': 'd' * 64,
                        'controller_active_state': 'inactive', 'controller_unit_file_state': 'disabled',
                        'registration_recovery_required': False}

    def test_capture_records_only_valid_stopped_source_bound_observation(self):
        with mock.patch.object(operator, 'context', return_value=self.ctx), \
                mock.patch.object(operator, 'ci_source', return_value=self.source), \
                mock.patch.object(operator, 'ci_observation_identity', return_value=self.identity), \
                mock.patch.object(operator, 'execute', side_effect=['', json.dumps(self.inspect)]) as execute, \
                mock.patch.object(operator, 'update_state') as update, contextlib.redirect_stdout(io.StringIO()):
            operator.stop_and_inspect_ci(SimpleNamespace())
        self.assertEqual(execute.call_args_list[0].args[0],
                         ['systemctl', 'disable', '--now', 'web-app-ci-controller.service'])
        update.assert_called_once_with(self.ctx, ci_registered=False,
            ci_configuration_observation=dict(self.identity, configuration_sha256='d' * 64))

    def test_failed_or_unsafe_observation_preserves_progress(self):
        for changed in ({'installed': False}, {'configuration_sha256': None}, {'configuration_sha256': 'z' * 64},
                        {'controller_active_state': 'active'}, {'controller_unit_file_state': 'enabled'},
                        {'registration_recovery_required': True}):
            with self.subTest(changed=changed), \
                    mock.patch.object(operator, 'context', return_value=self.ctx), \
                    mock.patch.object(operator, 'ci_source', return_value=self.source), \
                    mock.patch.object(operator, 'execute', side_effect=['', json.dumps(dict(self.inspect, **changed))]), \
                    mock.patch.object(operator, 'update_state') as update, self.assertRaises(operator.InitError):
                operator.stop_and_inspect_ci(SimpleNamespace())
            update.assert_not_called()

    def test_recorded_hash_rejects_changed_boot_source_or_consumer(self):
        recorded = dict(self.identity, configuration_sha256='d' * 64)
        for key in self.identity:
            with self.subTest(key=key), mock.patch.object(operator, 'read_state', return_value={
                    'ci_configuration_observation': recorded}), \
                    mock.patch.object(operator, 'ci_observation_identity', return_value=dict(self.identity, **{key: 'changed'})), \
                    self.assertRaisesRegex(operator.InitError, 'changed'):
                operator.registration_configuration(self.ctx, self.source, None)
        with mock.patch.object(operator, 'read_state', return_value={'ci_configuration_observation': recorded}), \
                mock.patch.object(operator, 'ci_observation_identity', return_value=self.identity):
            self.assertEqual(operator.registration_configuration(self.ctx, self.source, None), 'd' * 64)

    def test_missing_capture_stops_but_valid_explicit_override_preserves_public_contract(self):
        with mock.patch.object(operator, 'read_state', return_value={}), self.assertRaisesRegex(operator.InitError, '11.3'):
            operator.registration_configuration(self.ctx, self.source, None)
        with mock.patch.object(operator, 'ci_observation_identity') as identity:
            self.assertEqual(operator.registration_configuration(self.ctx, self.source, 'e' * 64), 'e' * 64)
            identity.assert_not_called()
        for invalid in ('', 'g' * 64, 'a' * 63, 123):
            with self.subTest(invalid=invalid), self.assertRaises(operator.InitError):
                operator.registration_configuration(self.ctx, self.source, invalid)

    def test_registration_passes_captured_hash_to_existing_lifecycle_guard(self):
        path = mock.Mock()
        path.lstat.return_value = SimpleNamespace(st_uid=0, st_mode=0o100600)
        path.is_symlink.return_value = False
        path.read_text.return_value = json.dumps({'slug': 'fixture-app', 'repository': 'vireocodedev/fixture-app'})
        path.__str__ = mock.Mock(return_value='/root/project-registration-fixture-app.json')
        with mock.patch.object(operator, 'context', return_value=self.ctx), \
                mock.patch.object(operator, 'ci_source', return_value=self.source), \
                mock.patch.object(operator, 'registration_configuration', return_value='d' * 64), \
                mock.patch.object(operator, 'registration_path', return_value=path), \
                mock.patch.object(operator, 'execute') as execute, mock.patch.object(operator, 'update_state') as update:
            operator.register_and_validate_ci(SimpleNamespace(expected_config_sha256=None))
        self.assertIn('--expected-config-sha256', execute.call_args_list[0].args[0])
        self.assertEqual(execute.call_args_list[0].args[0][-1], 'd' * 64)
        self.assertEqual(execute.call_args_list[1].args[0][-1], 'validate')
        update.assert_called_once_with(self.ctx, ci_registered=True, ci_registration_predecessor_sha256='d' * 64)


if __name__ == '__main__':
    unittest.main()
