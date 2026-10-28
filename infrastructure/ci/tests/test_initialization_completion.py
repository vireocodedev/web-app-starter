"""Strict completion assertions reject partial, mixed-source and changed evidence."""
from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    import _completion as completion
    from _shared import InitError
    spec = importlib.util.spec_from_file_location('completion_result', SCRIPTS / '19_1_record_result.py')
    recorder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(recorder)
    wrapper_spec = importlib.util.spec_from_file_location('completion_finalize', SCRIPTS / '19_2_finalize_initialization.py')
    finalizer = importlib.util.module_from_spec(wrapper_spec)
    wrapper_spec.loader.exec_module(finalizer)
finally:
    sys.path.pop(0)


class CompletionTests(unittest.TestCase):
    def setUp(self):
        self.source = 'a' * 40
        self.values = {'REPOSITORY': 'example/sample-app', 'PROJECT_SLUG': 'sample-app',
                       'STAGING_HOSTNAME': 'sample-staging.example.com', 'PRODUCTION_HOSTNAME': 'sample.example.com'}
        pair = {'source_sha': self.source, 'repository': self.values['REPOSITORY'],
                'frontend': 'ghcr.io/example/sample-app-frontend@sha256:' + 'b' * 64,
                'backend': 'ghcr.io/example/sample-app-backend@sha256:' + 'c' * 64}
        self.progress = {'repository': self.values['REPOSITORY'], 'env_sha256': 'd' * 64,
            'repository_id': 10, 'staging_workflow_id': 11, 'production_workflow_id': 12,
            'source_sha': self.source, 'release_source_sha': self.source, 'staging_source_sha': self.source,
            'production_source_sha': self.source, 'staging_run_id': 21, 'staging_run_attempt': 1,
            'production_run_id': 22, 'production_run_attempt': 2, 'staging_pair': pair,
            'retrieved_backup_sha256': 'e' * 64, 'restored_backup_sha256': 'e' * 64,
            'retrieved_copy_restored': True, 'backup_schedule': {
                'source_sha': self.source, 'runtime_sha256': 'f' * 64, 'installation_sha256': '1' * 64,
                'runtime_config_sha256': '2' * 64, 'retention_days': 30,
                'timer': 'web-app-backup-sample-app.timer', 'schedule': '*-*-* 03:00:00 Europe/Zagreb',
                'persistent': True, 'service': 'web-app-backup-sample-app.service',
                'staging_scheduled': False, 'next_fire': 'Thu 2026-10-29 03:00:00 CET',
                'scheduled_execution_observed': False, 'checked_at': '2026-10-28T10:00:00+00:00'}}
        self.acceptance = {'schema_version': 1, 'source_sha': self.source, 'environments': {}, 'manual': {
            'local_application': {'status': 'passed', 'evidence': 'Earlier local launch, login, reload and logout observed; carried forward, not retested at this release SHA.'},
            'ide': {'status': 'not-applicable', 'evidence': 'Headless environment; terminal launch verified instead.'},
            'artwork': {'status': 'deferred', 'evidence': 'Approved template artwork remains pending product design.'}}}
        for environment in ('staging', 'production'):
            run_id, attempt = self.progress[environment + '_run_id'], self.progress[environment + '_run_attempt']
            self.acceptance['environments'][environment] = {
                'deployment_receipt': {'state': 'success', 'environment': environment, 'run_id': run_id,
                                       'run_attempt': attempt, 'pair': deepcopy(pair)},
                'provisioning_receipt': {'state': 'success', 'backend': pair['backend']},
                'https': {'origin': 'https://' + self.values[environment.upper() + '_HOSTNAME'],
                          'run_id': run_id, 'run_attempt': attempt, 'observed_at': '2026-10-28T10:05:00Z',
                          'checks': dict.fromkeys(completion.CHECKS, True)}}
        self.refresh()

    def refresh(self):
        self.raw = json.dumps(self.progress, indent=2).encode() + b'\n'
        self.progress_hash = hashlib.sha256(self.raw).hexdigest()
        self.report = {'repository': self.values['REPOSITORY'], 'scope': 'full', 'env_sha256': 'd' * 64,
            'observations': {key: deepcopy(self.progress[key]) for key in recorder.OBSERVATIONS if key in self.progress},
            'completion': completion.build_completion(self.acceptance, self.values, self.progress, self.progress_hash)}

    def validate(self):
        return completion.validate_completion(self.report, self.values, self.progress, self.progress_hash)

    def test_complete_requires_real_checks_but_future_timer_observation_can_remain_pending(self):
        result = self.validate()
        self.assertEqual(result['state'], 'complete')
        self.assertFalse(self.progress['backup_schedule']['scheduled_execution_observed'])
        result['acceptance']['manual']['artwork']['status'] = 'accepted'
        self.assertEqual(self.report['completion']['acceptance']['manual']['artwork']['status'], 'deferred')

    def test_partial_report_is_not_deletion_eligible(self):
        self.report.pop('completion')
        with self.assertRaises(InitError):
            self.validate()

    def test_local_report_is_not_complete(self):
        self.report['scope'] = 'local'
        with self.assertRaises(InitError):
            self.validate()

    def test_every_https_check_is_mandatory_and_true(self):
        for environment in ('staging', 'production'):
            for check in completion.CHECKS:
                for value in (None, False, 1, 'true'):
                    with self.subTest(environment=environment, check=check, value=value):
                        self.refresh()
                        checks = self.report['completion']['acceptance']['environments'][environment]['https']['checks']
                        if value is None:
                            checks.pop(check)
                        else:
                            checks[check] = value
                        with self.assertRaises(InitError):
                            self.validate()

    def test_all_source_identities_must_match(self):
        for key in ('source_sha', 'release_source_sha', 'staging_source_sha', 'production_source_sha'):
            with self.subTest(key=key):
                previous = self.progress[key]
                self.progress[key] = '9' * 40
                self.refresh()
                with self.assertRaises(InitError):
                    self.validate()
                self.progress[key] = previous

    def test_positive_ids_reject_boolean_zero_and_string(self):
        for key in ('repository_id', 'staging_workflow_id', 'production_workflow_id', 'staging_run_id',
                    'staging_run_attempt', 'production_run_id', 'production_run_attempt'):
            for value in (True, False, 0, -1, '1'):
                with self.subTest(key=key, value=value):
                    previous = self.progress[key]
                    self.progress[key] = value
                    self.refresh()
                    with self.assertRaises(InitError):
                        self.validate()
                    self.progress[key] = previous

    def test_deployment_pair_run_attempt_environment_and_state_are_bound(self):
        for environment in ('staging', 'production'):
            for key, value in (('run_id', 999), ('run_attempt', True), ('environment', 'other'), ('state', 'started'),
                               ('pair', dict(self.progress['staging_pair'], backend='ghcr.io/example/sample-app-backend:latest'))):
                with self.subTest(environment=environment, key=key):
                    self.refresh()
                    self.report['completion']['acceptance']['environments'][environment]['deployment_receipt'][key] = value
                    with self.assertRaises(InitError):
                        self.validate()

    def test_provisioning_requires_successful_matching_backend(self):
        for key, value in (('state', 'started'), ('backend', 'ghcr.io/example/sample-app-backend:latest')):
            self.refresh()
            self.report['completion']['acceptance']['environments']['production']['provisioning_receipt'][key] = value
            with self.assertRaises(InitError):
                self.validate()

    def test_https_origin_attempt_timestamp_and_run_are_bound(self):
        for key, value in (('origin', 'https://other.example.com'), ('run_id', True), ('run_attempt', 99),
                           ('observed_at', '2026-10-28T10:00:00'), ('observed_at', 'yesterday')):
            self.refresh()
            self.report['completion']['acceptance']['environments']['staging']['https'][key] = value
            with self.assertRaises(InitError):
                self.validate()

    def test_manual_acceptance_requires_actual_status_and_bounded_explanation(self):
        for key in ('local_application', 'ide', 'artwork'):
            for item in ({'status': 'pending', 'evidence': 'Not observed'}, {'status': 'passed', 'evidence': ''},
                         {'status': 'passed', 'evidence': 'x' * 801}):
                self.refresh()
                self.report['completion']['acceptance']['manual'][key] = item
                with self.assertRaises(InitError):
                    self.validate()

    def test_explicit_user_authorization_can_waive_only_the_ide_check(self):
        waived = {'status': 'waived', 'evidence': 'Developer explicitly waived the VS Code debugger acceptance check.',
                  'user_authorized': True}
        self.report['completion']['acceptance']['manual']['ide'] = waived
        self.assertEqual(self.validate()['acceptance']['manual']['ide'], waived)
        for key in ('local_application', 'artwork'):
            for extra in ({}, {'user_authorized': True}):
                with self.subTest(key=key, extra=extra):
                    self.refresh()
                    self.report['completion']['acceptance']['manual'][key] = {
                        'status': 'waived', 'evidence': waived['evidence'], **extra}
                    with self.assertRaises(InitError):
                        self.validate()

    def test_ide_waiver_requires_bounded_evidence_and_exact_true_authorization(self):
        base = {'status': 'waived', 'evidence': 'Developer explicitly waived debugger acceptance.',
                'user_authorized': True}
        cases = [dict(base, evidence=value) for value in ('', '   ', 'x' * 801, 'waived\nby developer', None)]
        cases += [dict(base, user_authorized=value) for value in (False, None, 1, 'true')]
        cases += [{key: value for key, value in base.items() if key != missing}
                  for missing in ('evidence', 'user_authorized')]
        for item in cases:
            with self.subTest(item=item):
                self.refresh()
                self.report['completion']['acceptance']['manual']['ide'] = item
                with self.assertRaises(InitError):
                    self.validate()

    def test_ide_waiver_does_not_waive_local_application_or_https_checks(self):
        self.acceptance['manual']['ide'] = {
            'status': 'waived', 'evidence': 'Developer explicitly waived debugger acceptance.',
            'user_authorized': True}
        self.refresh()
        self.report['completion']['acceptance']['manual']['local_application']['status'] = 'pending'
        with self.assertRaises(InitError):
            self.validate()
        for environment in ('staging', 'production'):
            for check in completion.CHECKS:
                for missing in (True, False):
                    with self.subTest(environment=environment, check=check, missing=missing):
                        self.refresh()
                        checks = self.report['completion']['acceptance']['environments'][environment]['https']['checks']
                        if missing:
                            checks.pop(check)
                        else:
                            checks[check] = False
                        with self.assertRaises(InitError):
                            self.validate()

    def test_existing_ide_statuses_keep_their_original_fields(self):
        for status in ('passed', 'not-applicable'):
            with self.subTest(status=status):
                self.refresh()
                item = self.report['completion']['acceptance']['manual']['ide']
                item['status'] = status
                self.assertEqual(self.validate()['state'], 'complete')
                item['user_authorized'] = True
                with self.assertRaises(InitError):
                    self.validate()

    def test_restore_requires_exact_checksum_and_true_retrieved_copy(self):
        for key, value in (('retrieved_backup_sha256', 'bad'), ('restored_backup_sha256', '9' * 64),
                           ('retrieved_copy_restored', 1)):
            previous = self.progress[key]
            self.progress[key] = value
            self.refresh()
            with self.assertRaises(InitError):
                self.validate()
            self.progress[key] = previous

    def test_schedule_policy_and_source_are_exact(self):
        for key, value in (('schedule', '*-*-* 03:00:00 UTC'), ('persistent', 1), ('retention_days', True),
                           ('retention_days', 7), ('staging_scheduled', True), ('source_sha', '9' * 40),
                           ('next_fire', 'n/a'), ('checked_at', 'invalid'), ('runtime_sha256', 'bad')):
            schedule = self.progress['backup_schedule']
            previous = schedule[key]
            schedule[key] = value
            self.refresh()
            with self.assertRaises(InitError):
                self.validate()
            schedule[key] = previous

    def test_progress_hash_is_exact_bytes_not_semantic_json(self):
        self.progress_hash = hashlib.sha256(json.dumps(self.progress).encode()).hexdigest()
        with self.assertRaises(InitError):
            self.validate()

    def test_changed_observation_invalidates_report(self):
        self.report['observations']['production_run_id'] += 1
        with self.assertRaises(InitError):
            self.validate()

    def test_unknown_acceptance_fields_do_not_enter_report(self):
        self.report['completion']['acceptance']['password'] = 'must-never-copy'
        with self.assertRaises(InitError) as raised:
            self.validate()
        self.assertNotIn('must-never-copy', str(raised.exception))

    def test_protected_acceptance_reader_rejects_duplicate_json_keys(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.chmod(0o700)
            path = root / 'acceptance.json'
            path.write_text('{"schema_version":1,"schema_version":1}')
            path.chmod(0o600)
            with self.assertRaises(InitError):
                completion.read_acceptance(path)

    def test_plain_report_remains_partial_and_requires_no_acceptance_or_progress_file(self):
        with tempfile.TemporaryDirectory() as directory:
            ctx = SimpleNamespace(env_path=Path(directory) / 'values.env', scope='local', values=self.values)
            with patch.object(recorder, 'require_consumer'), patch.object(recorder, 'read_state', return_value=self.progress), \
                    patch.object(recorder, 'env_hash', return_value='d' * 64), patch('builtins.print'):
                recorder.record(ctx)
            result = json.loads((ctx.env_path.parent / 'result.json').read_bytes())
            self.assertNotIn('completion', result)
            self.assertEqual(result['observations']['backup_schedule'], self.progress['backup_schedule'])

    def test_invalid_complete_writer_preserves_previous_result(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.chmod(0o700)
            (root / 'progress.json').write_bytes(self.raw)
            (root / 'progress.json').chmod(0o600)
            acceptance = root / 'acceptance.json'
            invalid = deepcopy(self.acceptance)
            invalid['environments']['production']['https']['checks']['login'] = False
            acceptance.write_text(json.dumps(invalid))
            acceptance.chmod(0o600)
            previous = root / 'result.json'
            previous.write_bytes(b'{"partial": true}\n')
            previous.chmod(0o600)
            ctx = SimpleNamespace(env_path=root / 'values.env', scope='full', values=self.values)
            with patch.object(recorder, 'require_consumer'), patch.object(recorder, 'read_state', return_value=self.progress), \
                    patch.object(recorder, 'env_hash', return_value='d' * 64), patch('builtins.print'):
                with self.assertRaises(InitError):
                    recorder.record(ctx, complete=True, acceptance_file=acceptance)
            self.assertEqual(previous.read_bytes(), b'{"partial": true}\n')

    def test_numbered_finalize_step_always_requests_strict_recording(self):
        context = SimpleNamespace()
        record = Mock()
        spec = Mock()
        module = SimpleNamespace(record=record)
        acceptance = Path('/private/acceptance.json')
        with patch.object(sys, 'argv', ['19_2_finalize_initialization.py', '--env', '/private/values.env',
                                     '--acceptance-file', str(acceptance)]), \
                patch.object(finalizer, 'load_context', return_value=context) as load, \
                patch.object(finalizer.importlib.util, 'spec_from_file_location', return_value=spec), \
                patch.object(finalizer.importlib.util, 'module_from_spec', return_value=module):
            finalizer.main()
        self.assertEqual(load.call_args.args[0].env, Path('/private/values.env'))
        spec.loader.exec_module.assert_called_once_with(module)
        record.assert_called_once_with(context, complete=True, acceptance_file=acceptance)

    def test_finalize_help_is_inert(self):
        with patch.object(sys, 'argv', ['19_2_finalize_initialization.py', '--help']), \
                patch.object(finalizer, 'load_context') as load, patch('sys.stdout'):
            with self.assertRaises(SystemExit) as raised:
                finalizer.main()
        self.assertEqual(raised.exception.code, 0)
        load.assert_not_called()

    def test_finalize_requires_acceptance_before_loading_any_context(self):
        with patch.object(sys, 'argv', ['19_2_finalize_initialization.py']), \
                patch.object(finalizer, 'load_context') as load, patch('sys.stderr'):
            with self.assertRaises(SystemExit) as raised:
                finalizer.main()
        self.assertEqual(raised.exception.code, 2)
        load.assert_not_called()

    def test_prepare_mode_creates_only_a_private_unverified_template_at_default_path(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.chmod(0o700)
            env = root / 'values.env'
            env.write_text('protected input')
            env.chmod(0o600)
            (root / 'progress.json').write_bytes(self.raw)
            (root / 'result.json').write_bytes(b'previous result')
            ctx = SimpleNamespace(env_path=env, scope='full', values=self.values)
            with patch.object(finalizer, 'require_consumer'), \
                    patch.object(finalizer, 'read_state', return_value=self.progress), patch('builtins.print') as output:
                finalizer.prepare_acceptance(ctx)
            path = root / 'acceptance.json'
            output.assert_called_once_with(path)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            prepared = json.loads(path.read_bytes())
            self.assertEqual(set(prepared), {'schema_version', 'source_sha', 'environments', 'manual'})
            self.assertEqual(prepared['source_sha'], self.source)
            for environment in ('staging', 'production'):
                item = prepared['environments'][environment]
                self.assertEqual(item['deployment_receipt']['state'], 'unverified')
                self.assertEqual(item['provisioning_receipt']['state'], 'unverified')
                self.assertEqual(item['deployment_receipt']['run_id'], self.progress[environment + '_run_id'])
                self.assertEqual(item['deployment_receipt']['pair'], self.progress['staging_pair'])
                self.assertEqual(item['https']['origin'], 'https://' + self.values[environment.upper() + '_HOSTNAME'])
                self.assertEqual(set(item['https']['checks']), completion.CHECKS)
                self.assertTrue(all(value is False for value in item['https']['checks'].values()))
            self.assertTrue(all(item == {'status': 'pending', 'evidence': ''} for item in prepared['manual'].values()))
            self.assertEqual((root / 'progress.json').read_bytes(), self.raw)
            self.assertEqual((root / 'result.json').read_bytes(), b'previous result')
            self.report['completion']['acceptance'] = prepared
            with self.assertRaises(InitError):
                self.validate()

    def test_prepare_mode_does_not_overwrite_existing_acceptance_or_follow_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.chmod(0o700)
            env = root / 'values.env'
            env.write_text('protected input')
            env.chmod(0o600)
            path = root / 'acceptance.json'
            path.write_bytes(b'original acceptance')
            ctx = SimpleNamespace(env_path=env, scope='full', values=self.values)
            with patch.object(finalizer, 'require_consumer'), \
                    patch.object(finalizer, 'read_state', return_value=self.progress):
                with self.assertRaises(FileExistsError):
                    finalizer.prepare_acceptance(ctx)
                self.assertEqual(path.read_bytes(), b'original acceptance')
                path.unlink()
                path.symlink_to(env)
                with self.assertRaises(FileExistsError):
                    finalizer.prepare_acceptance(ctx)
                self.assertEqual(env.read_text(), 'protected input')

    def test_prepare_mode_never_loads_the_completion_writer(self):
        context = SimpleNamespace()
        with patch.object(sys, 'argv', ['19_2_finalize_initialization.py', '--prepare-acceptance']), \
                patch.object(finalizer, 'load_context', return_value=context), \
                patch.object(finalizer, 'prepare_acceptance') as prepare, \
                patch.object(finalizer.importlib.util, 'spec_from_file_location') as load_writer:
            finalizer.main()
        prepare.assert_called_once_with(context)
        load_writer.assert_not_called()

    def test_prepare_and_finalize_modes_are_mutually_exclusive(self):
        with patch.object(sys, 'argv', ['19_2_finalize_initialization.py', '--prepare-acceptance',
                                      '--acceptance-file', '/private/acceptance.json']), \
                patch.object(finalizer, 'load_context') as load, patch('sys.stderr'):
            with self.assertRaises(SystemExit) as raised:
                finalizer.main()
        self.assertEqual(raised.exception.code, 2)
        load.assert_not_called()

    def test_prepare_requires_full_scope_and_reconciled_release_observations(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.chmod(0o700)
            env = root / 'values.env'
            env.write_text('protected input')
            env.chmod(0o600)
            ctx = SimpleNamespace(env_path=env, scope='local', values=self.values)
            with patch.object(finalizer, 'require_consumer'), \
                    patch.object(finalizer, 'read_state', return_value={}):
                with self.assertRaises(InitError):
                    finalizer.prepare_acceptance(ctx)
                ctx.scope = 'full'
                with self.assertRaises(InitError):
                    finalizer.prepare_acceptance(ctx)
            self.assertFalse((root / 'acceptance.json').exists())

    def test_complete_writer_embeds_validated_acceptance_and_exact_progress_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.chmod(0o700)
            (root / 'progress.json').write_bytes(self.raw)
            (root / 'progress.json').chmod(0o600)
            acceptance = root / 'acceptance.json'
            acceptance.write_text(json.dumps(self.acceptance))
            acceptance.chmod(0o600)
            ctx = SimpleNamespace(env_path=root / 'values.env', scope='full', values=self.values)
            with patch.object(recorder, 'require_consumer'), patch.object(recorder, 'read_state', return_value=self.progress), \
                    patch.object(recorder, 'env_hash', return_value='d' * 64), patch('builtins.print'):
                recorder.record(ctx, complete=True, acceptance_file=acceptance)
            result = json.loads((root / 'result.json').read_bytes())
            self.assertEqual(completion.validate_completion(result, self.values, self.progress, self.progress_hash)['state'], 'complete')
            self.assertEqual((root / 'result.json').stat().st_mode & 0o777, 0o600)


if __name__ == '__main__':
    unittest.main()
