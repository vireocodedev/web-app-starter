"""Initialization PR retries and delayed Actions registration, without GitHub writes."""
import contextlib
import copy
import importlib
import io
import json
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    operations = importlib.import_module('_operations')
finally:
    sys.path.pop(0)


class InitializationPrTests(unittest.TestCase):
    def setUp(self):
        self.repo = 'vireocodedev/fixture-app'
        self.sha = 'a' * 40
        self.ctx = SimpleNamespace(root=SCRIPTS.parents[2],
                                   env_path=Path('/private/fixture/values.env'),
                                   values={'REPOSITORY': self.repo})
        self.pr = {'number': 7, 'state': 'open',
                   'html_url': 'https://github.com/' + self.repo + '/pull/7',
                   'head': {'ref': 'initialization/setup', 'sha': self.sha,
                            'repo': {'full_name': self.repo}},
                   'base': {'ref': 'main', 'repo': {'full_name': self.repo}}}
        self.workflow = {'id': 123, 'run_attempt': 1, 'head_sha': self.sha,
                         'head_branch': 'initialization/setup', 'event': 'pull_request',
                         'path': '.github/workflows/ci.yml',
                         'repository': {'full_name': self.repo},
                         'pull_requests': [{'number': 7}],
                         'status': 'completed', 'conclusion': 'success'}
        self.gate = {'name': 'CI gate', 'status': 'completed', 'conclusion': 'success'}
        self.pr_exists = False
        self.created = 0
        self.startup_polls = 0
        self.startup_delay = 2
        self.run_queries = 0
        self.run_states = ['queued', 'in_progress', 'completed']
        self.clock = 0
        self.sleep_increment = 10
        self.api_error = None
        self.changed_head = False
        self.cancel = False
        self.calls = []
        self.create_error = False
        self.duplicate_pr = False
        self.run_change = {}
        self.rerun_at_jobs = False
        self.change_head_at_jobs = False
        self.incomplete_jobs = False
        self.addCleanup(patch.stopall)
        patch.object(operations, 'context', return_value=self.ctx).start()
        patch.object(operations, 'run', side_effect=self.command).start()

    def command(self, argv, **kwargs):
        self.calls.append(list(argv))
        if argv[:3] == ['gh', 'pr', 'create']:
            self.created += 1
            self.pr_exists = True
            return subprocess.CompletedProcess(argv, 1 if self.create_error else 0, self.pr['html_url'] + '\n', '')
        if argv[:3] == ['gh', 'pr', 'checks']:
            return subprocess.CompletedProcess(argv, 1, '', 'no checks reported on the branch')
        if argv[:2] != ['gh', 'api']:
            self.fail('Unexpected command: ' + repr(argv))
        suffix = argv[2].removeprefix('repos/' + self.repo)
        if self.api_error:
            return subprocess.CompletedProcess(argv, 1, '', self.api_error)
        if suffix.startswith('/pulls?'):
            result = [self.pr] * (2 if self.duplicate_pr else 1) if self.pr_exists else []
        elif suffix == '/pulls/7':
            result = copy.deepcopy(self.pr)
            if self.changed_head:
                result['head']['sha'] = 'b' * 40
        elif suffix.startswith('/actions/workflows/ci.yml/runs?'):
            self.startup_polls += 1
            result = {'workflow_runs': [] if self.startup_polls <= self.startup_delay
                      else [self.workflow]}
        elif suffix == '/actions/runs/123':
            result = copy.deepcopy(self.workflow)
            result.update(self.run_change)
            index = min(self.run_queries, len(self.run_states) - 1)
            result['status'] = self.run_states[index]
            self.run_queries += 1
        elif suffix == '/actions/runs/123/attempts/1/jobs?per_page=100':
            if self.rerun_at_jobs:
                self.workflow['run_attempt'] = 2
            if self.change_head_at_jobs:
                self.changed_head = True
            result = {'total_count': 101 if self.incomplete_jobs else (1 if self.gate else 0),
                      'jobs': [self.gate] if self.gate else []}
        else:
            self.fail('Unexpected API path: ' + suffix)
        return subprocess.CompletedProcess(argv, 0, json.dumps(result), '')

    def sleep(self, seconds):
        if self.cancel:
            raise KeyboardInterrupt
        self.clock += self.sleep_increment

    def invoke(self):
        with patch.object(operations, 'time', SimpleNamespace(monotonic=lambda: self.clock, sleep=self.sleep), create=True), \
                contextlib.redirect_stdout(io.StringIO()) as output:
            operations.open_initialization_pr(SimpleNamespace())
        return output.getvalue()

    def test_delayed_run_registration_then_complete_ci_succeeds(self):
        output = self.invoke()
        self.assertEqual(self.created, 1)
        self.assertEqual(self.startup_polls, 3)
        self.assertEqual(self.run_queries, 4)
        self.assertIn(self.pr['html_url'], output)
        self.assertIn('Waiting', output)
        self.assertIn('CI gate succeeded', output)
        self.assertFalse(any(argv[:3] == ['gh', 'pr', 'checks'] for argv in self.calls))

    def test_existing_pr_is_resumed_without_creation(self):
        self.pr_exists = True
        self.invoke()
        self.assertEqual(self.created, 0)

    def test_startup_timeout_preserves_pr_and_can_resume(self):
        self.startup_delay = 100
        self.sleep_increment = 300
        with self.assertRaisesRegex(operations.InitError, 'Actions|CI run'):
            self.invoke()
        self.assertEqual(self.created, 1)
        self.startup_delay = 0
        self.invoke()
        self.assertEqual(self.created, 1)

    def test_authentication_errors_are_not_retried_or_printed_raw(self):
        self.api_error = 'private diagnostic: token=must-not-be-printed'
        with self.assertRaises(operations.InitError) as raised:
            self.invoke()
        self.assertNotIn('must-not-be-printed', str(raised.exception))
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.created, 0)

    def test_failed_or_cancelled_run_is_not_success(self):
        for conclusion in ('failure', 'cancelled', 'timed_out', 'skipped'):
            with self.subTest(conclusion=conclusion):
                self.workflow['conclusion'] = conclusion
                self.run_states = ['completed']
                with self.assertRaisesRegex(operations.InitError, 'rerun all jobs'):
                    self.invoke()

    def test_missing_or_unsuccessful_gate_is_not_success(self):
        self.run_states = ['completed']
        for gate in (None, {'name': 'CI gate', 'status': 'completed', 'conclusion': 'skipped'},
                     {'name': 'CI gate', 'status': 'completed', 'conclusion': 'failure'}):
            with self.subTest(gate=gate):
                self.gate = gate
                with self.assertRaisesRegex(operations.InitError, 'CI gate'):
                    self.invoke()

    def test_changed_pr_head_stops_observation(self):
        self.changed_head = True
        with self.assertRaisesRegex(operations.InitError, 'changed|identity'):
            self.invoke()
        self.assertEqual(self.run_queries, 0)

    def test_other_pr_source_event_workflow_and_repository_do_not_match(self):
        for field, value in (('head_sha', 'b' * 40), ('event', 'push'),
                             ('path', '.github/workflows/deploy-staging.yaml'),
                             ('head_branch', 'other'), ('pull_requests', [{'number': 8}]),
                             ('repository', {'full_name': 'vireocodedev/other'})):
            with self.subTest(field=field):
                previous = self.workflow[field]
                self.workflow[field] = value
                self.sleep_increment = 300
                with self.assertRaisesRegex(operations.InitError, 'Actions|CI run'):
                    self.invoke()
                self.workflow[field] = previous
                self.assertEqual(self.run_queries, 0)

    def test_interruption_preserves_pr_and_rerun_resumes(self):
        self.cancel = True
        with self.assertRaisesRegex(operations.InitError, 'resume|Resume'):
            self.invoke()
        self.assertEqual(self.created, 1)
        self.cancel = False
        self.startup_delay = 0
        self.invoke()
        self.assertEqual(self.created, 1)

    def test_uncertain_pr_creation_is_reconciled_on_retry(self):
        self.create_error = True
        with self.assertRaisesRegex(operations.InitError, 'Resume with:'):
            self.invoke()
        self.assertEqual(self.created, 1)
        self.create_error = False
        self.invoke()
        self.assertEqual(self.created, 1)

    def test_ambiguous_open_prs_are_not_changed(self):
        self.pr_exists = True
        self.duplicate_pr = True
        with self.assertRaisesRegex(operations.InitError, 'one open initialization PR'):
            self.invoke()
        self.assertEqual(self.created, 0)
        self.assertEqual(self.startup_polls, 0)

    def test_different_pr_repository_or_branches_are_not_followed(self):
        self.pr_exists = True
        for side, field, value in (('head', 'ref', 'other'), ('base', 'ref', 'other'),
                                   ('head', 'repo', {'full_name': 'elsewhere/fixture-app'}),
                                   ('base', 'repo', {'full_name': 'elsewhere/fixture-app'})):
            previous = self.pr[side][field]
            self.pr[side][field] = value
            with self.subTest(side=side, field=field), self.assertRaisesRegex(operations.InitError, 'identity'):
                self.invoke()
            self.pr[side][field] = previous
            self.assertEqual(self.created, 0)
            self.assertEqual(self.startup_polls, 0)

    def test_run_identity_and_attempt_changes_stop_watching(self):
        for change in ({'run_attempt': 2}, {'head_sha': 'b' * 40}, {'id': 124}):
            self.run_change = change
            with self.subTest(change=change), self.assertRaisesRegex(operations.InitError, 'identity or attempt changed'):
                self.invoke()

    def test_rerun_during_gate_inspection_is_not_accepted(self):
        self.rerun_at_jobs = True
        self.run_states = ['completed']
        with self.assertRaisesRegex(operations.InitError, 'attempt changed'):
            self.invoke()

    def test_source_change_during_gate_inspection_is_not_accepted(self):
        self.change_head_at_jobs = True
        self.run_states = ['completed']
        with self.assertRaisesRegex(operations.InitError, 'identity changed'):
            self.invoke()

    def test_truncated_job_list_does_not_prove_gate_success(self):
        self.incomplete_jobs = True
        self.run_states = ['completed']
        with self.assertRaisesRegex(operations.InitError, 'CI gate'):
            self.invoke()

    def test_running_ci_has_a_bounded_wait(self):
        self.startup_delay = 0
        self.run_states = ['in_progress']
        self.sleep_increment = 3600
        with self.assertRaisesRegex(operations.InitError, 'resume|Resume'):
            self.invoke()
        self.assertEqual(self.created, 1)
        self.assertLessEqual(self.run_queries, 2)


if __name__ == '__main__':
    unittest.main()
