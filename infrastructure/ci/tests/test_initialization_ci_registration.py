"""Real registration transactions behind a fake process boundary; no host or API calls."""
import contextlib
import copy
import hashlib
import importlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import test_project_register_resume as registration_tests

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    ci = importlib.import_module('_ci_registration')
    shared = importlib.import_module('_shared')
    operations = importlib.import_module('_operations')
finally:
    sys.path.pop(0)


class InitializationCiRegistrationTests(unittest.TestCase):
    def setUp(self):
        self.fixture = registration_tests.ProjectRegisterResumeTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.manage = registration_tests.manage
        self.fixture.project = {'slug': 'fixture-app', 'repository': 'vireocodedev/fixture-app'}
        self.fixture.project_path.write_text(json.dumps(self.fixture.project))
        self.controller = self.fixture.write_controller()
        self.ctx = SimpleNamespace(env_path=self.fixture.context / 'values.env',
            values={'PROJECT_SLUG': 'fixture-app', 'REPOSITORY': 'vireocodedev/fixture-app',
                    'CI_SOURCE': str(SCRIPTS.parents[2])})
        self.ctx.env_path.write_text('private fixture input\n')
        self.ctx.env_path.chmod(0o600)
        self.identity = {'repository': self.ctx.values['REPOSITORY'], 'slug': 'fixture-app',
            'source': self.ctx.values['CI_SOURCE'], 'source_sha': 'a' * 40,
            'manage_sha256': 'b' * 64,
            'installed_controller_sha256': hashlib.sha256(self.controller.read_bytes()).hexdigest(),
            'boot_id': Path('/proc/sys/kernel/random/boot_id').read_text().strip()}
        shared.update_state(self.ctx, ci_registered=False, preserved={'other': 'observation'},
            ci_configuration_observation=dict(self.identity, configuration_sha256=self.fixture.expected))
        self.validation_count = 0
        self.fail_validation = True
        self.lose_registration_response = False
        self.calls = []
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.stack.enter_context(patch.object(ci, 'run', side_effect=self.process))
        self.stack.enter_context(patch.object(self.manage, 'trusted_executable'))
        self.stack.enter_context(patch.object(ci, 'BASE', self.fixture.base))
        self.stack.enter_context(patch.object(ci, 'ROOT_UID', os.getuid()))
        self.stack.enter_context(patch.object(ci, 'controlled_parents', return_value=True))

    def process(self, arguments, **_kwargs):
        self.calls.append(arguments)
        if str(arguments[2]).endswith('/manage.py'):
            operation = arguments[3]
            flags = dict(zip(arguments[4::2], arguments[5::2]))
            if operation == 'register':
                result = self.manage.register(flags['--project'], flags['--expected-config-sha256'], flags['--journal'])
                if self.lose_registration_response:
                    self.lose_registration_response = False
                    raise shared.InitError('fixture response lost')
            elif operation == 'verify-registration':
                result = self.manage.verify_registration(flags['--project'], flags['--expected-config-sha256'], flags['--journal'])
            else:
                raise AssertionError(operation)
            return subprocess.CompletedProcess(arguments, 0, json.dumps(result), '')
        self.assertEqual(arguments, ['python3', '-B', '/usr/local/lib/web-app-ci/controller.py', 'validate'])
        self.validation_count += 1
        if self.fail_validation:
            receipt = self.fixture.base / 'validation-failure.json'
            receipt.write_text(json.dumps({'passed': False, 'stage': 'first-job-user-probes',
                'user_stage': 'bus-compatibility', 'recorded_at_epoch': int(time.time()),
                'last_completed_check': 'rootless-child-private-docker-cgroup',
                'user_check_count': 146, 'private': 'ghp_private_fixture_sentinel'}))
            receipt.chmod(0o600)
            return subprocess.CompletedProcess(arguments, 1, 'ghp_private_fixture_stdout', 'ghp_private_fixture_stderr')
        return subprocess.CompletedProcess(arguments, 0, 'credential-free-boundary-validation-passed\n', '')

    def step(self, *, expected=None, identity=None):
        ci.register_and_validate(self.ctx, Path(self.ctx.values['CI_SOURCE']),
            expected or self.fixture.expected, self.fixture.project_path,
            lambda *_: copy.deepcopy(identity or self.identity))

    def test_failed_validation_then_identical_retry_keeps_one_proof_and_records_only_verified_completion(self):
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(shared.InitError):
            self.step()
        self.assertIs(shared.read_state(self.ctx)['ci_registered'], False)
        self.assertEqual(self.fixture.proof.call_count, 1)
        self.assertEqual(json.loads(self.fixture.journal.read_text())['phase'], 'verified')
        self.fail_validation = False
        with contextlib.redirect_stdout(io.StringIO()):
            self.step()
        state = shared.read_state(self.ctx)
        self.assertIs(state['ci_registered'], True)
        self.assertEqual(state['preserved'], {'other': 'observation'})
        self.assertEqual(self.fixture.proof.call_count, 1)
        self.assertEqual(self.validation_count, 2)
        self.assertEqual(state['ci_registration_configuration_sha256'], self.manage.ctl.config_digest())

    def test_lost_registration_response_resumes_committed_transaction(self):
        self.lose_registration_response = True
        with self.assertRaises(shared.InitError):
            self.step()
        self.assertIs(shared.read_state(self.ctx)['ci_registered'], False)
        self.assertEqual(self.validation_count, 0)
        self.fail_validation = False
        with contextlib.redirect_stdout(io.StringIO()):
            self.step()
        self.assertEqual(self.fixture.proof.call_count, 1)
        self.assertIs(shared.read_state(self.ctx)['ci_registered'], True)

    def test_failed_progress_publication_can_repeat_validation_without_repeating_registration(self):
        self.fail_validation = False
        original = ci.update_state
        def publish(ctx, **values):
            if values.get('ci_registered') is True:
                raise OSError('fixture interrupted publication')
            return original(ctx, **values)
        with patch.object(ci, 'update_state', side_effect=publish), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(OSError):
                self.step()
        self.assertIs(shared.read_state(self.ctx)['ci_registered'], False)
        with contextlib.redirect_stdout(io.StringIO()):
            self.step()
        self.assertEqual(self.validation_count, 2)
        self.assertEqual(self.fixture.proof.call_count, 1)

    def test_source_boot_controller_configuration_or_observation_changes_reject_before_commands(self):
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(shared.InitError):
            self.step()
        count = len(self.calls)
        for key in ('source_sha', 'boot_id', 'installed_controller_sha256', 'manage_sha256'):
            identity = dict(self.identity, **{key: 'changed'})
            with self.subTest(key=key), self.assertRaises(shared.InitError):
                self.step(identity=identity)
        with self.assertRaises(shared.InitError):
            self.step(expected='c' * 64)
        observation = shared.read_state(self.ctx)['ci_configuration_observation']
        shared.update_state(self.ctx, ci_configuration_observation=dict(observation, configuration_sha256='d' * 64))
        with self.assertRaises(shared.InitError):
            self.step()
        self.assertEqual(len(self.calls), count)

    def test_orphan_journal_is_not_adopted(self):
        self.fixture.journal.write_text('{}')
        self.fixture.journal.chmod(0o600)
        with self.assertRaises(shared.InitError):
            self.step()
        self.assertFalse(self.calls)

    def test_printed_resume_preserves_explicit_hash_when_no_automatic_observation_exists(self):
        state = shared.read_state(self.ctx)
        del state['ci_configuration_observation']
        shared._write_json(self.ctx.env_path.parent / 'progress.json', state)
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(shared.InitError) as raised:
            self.step()
        self.assertIn('--expected-config-sha256 ' + self.fixture.expected, str(raised.exception))
        self.fail_validation = False
        with contextlib.redirect_stdout(io.StringIO()):
            self.step(expected=self.fixture.expected)
        self.assertIs(shared.read_state(self.ctx)['ci_registered'], True)

    def test_successful_validation_without_current_receipts_cannot_record_completion(self):
        self.fail_validation = False
        self.fixture.write_controller(rejection=True)
        self.identity['installed_controller_sha256'] = hashlib.sha256(self.controller.read_bytes()).hexdigest()
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(self.manage.ctl.BoundaryError):
            self.step()
        self.assertIs(shared.read_state(self.ctx)['ci_registered'], False)

    def test_failure_reports_and_console_include_safe_stage_and_resume_but_never_raw_output(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output), self.assertRaises(shared.InitError) as raised:
            self.step()
        message = str(raised.exception)
        self.assertIn('Worker 1: first-job-user-probes/bus-compatibility', message)
        self.assertIn('rootless-child-private-docker-cgroup', message)
        self.assertIn('--env ' + str(self.ctx.env_path), message)
        reports = list(self.fixture.context.glob('ci-registration-failure-*.json'))
        self.assertEqual(len(reports), 1)
        report = json.loads(reports[0].read_text())
        self.assertEqual(report['exit_status'], 1)
        self.assertEqual(report['worker_failures'][0]['user_check_count'], 146)
        self.assertEqual(reports[0].stat().st_mode & 0o777, 0o600)
        self.assertNotIn('ghp_private_fixture', message + output.getvalue() + reports[0].read_text())

    def test_old_failure_receipts_are_not_reported_as_new_failures(self):
        self.fail_validation = False
        self.step()
        receipt = self.fixture.base / 'validation-failure.json'
        receipt.write_text(json.dumps({'passed': False, 'recorded_at_epoch': int(time.time()),
                                      'stage': 'first-job-user-probes', 'user_stage': 'bus-compatibility'}))
        receipt.chmod(0o600)
        with patch.object(ci, 'run', return_value=subprocess.CompletedProcess([], 1, 'secret', 'secret')):
            with self.assertRaises(shared.InitError) as raised:
                ci.command(self.ctx, [], 'validation', timeout=1, attempt={})
        self.assertNotIn('Worker ', str(raised.exception))
        report = json.loads(next(self.fixture.context.glob('ci-registration-failure-*.json')).read_text())
        self.assertEqual(report['worker_failures'], [])

    def test_diagnostic_payload_uses_fixed_values_not_regex_only_or_arbitrary_fields(self):
        summary = ci.failure_summary(5, {'stage': 'ghp_secret_sentinel', 'user_stage': ['invalid'],
            'last_completed_check': 'ghp_secret_sentinel', 'user_check_count': True,
            'docker_result': 'success', 'docker_exit_status': 9999, 'private': 'token'})
        self.assertEqual(summary, {'worker_slot': 5, 'docker_result': 'success'})

    def test_diagnostic_files_reject_symlinks_public_modes_oversize_and_wrong_owner(self):
        path = self.fixture.base / 'validation-failure.json'
        target = self.fixture.context / 'private-diagnostic.json'
        target.write_text('{"passed":false,"recorded_at_epoch":1}')
        target.chmod(0o600)
        path.unlink(missing_ok=True)
        path.symlink_to(target)
        self.assertIsNone(ci.failure_receipt(0))
        path.unlink()
        path.write_bytes(target.read_bytes())
        path.chmod(0o644)
        self.assertIsNone(ci.failure_receipt(0))
        path.chmod(0o600)
        with patch.object(ci, 'ROOT_UID', os.getuid() + 1):
            self.assertIsNone(ci.failure_receipt(0))
        path.write_text('x' * 65537)
        self.assertIsNone(ci.failure_receipt(0))

    def test_timeout_or_interrupt_reports_safe_kind_without_leaking_exception(self):
        for error, kind in ((shared.InitError('private timeout payload'), 'could-not-complete'),
                            (KeyboardInterrupt(), 'interrupted')):
            with self.subTest(kind=kind), patch.object(ci, 'run', side_effect=error):
                with self.assertRaises(shared.InitError) as raised:
                    ci.command(self.ctx, [], 'registration', timeout=1, attempt={})
                self.assertIn(kind, str(raised.exception))
                self.assertNotIn('private timeout payload', str(raised.exception))

    def test_generic_execute_remains_secret_safe_and_does_not_claim_unsaved_private_output(self):
        with patch.object(operations, 'run', return_value=subprocess.CompletedProcess([], 7, 'private_stdout', 'private_stderr')):
            with self.assertRaises(shared.InitError) as raised:
                operations.execute(['tool'])
        message = str(raised.exception)
        self.assertIn('exit 7', message)
        self.assertNotIn('private outcome', message)
        self.assertNotIn('private_stdout', message)
        self.assertNotIn('private_stderr', message)


if __name__ == '__main__':
    unittest.main()
