"""Generic-label dispatch must account for actual assignments, not observations."""
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock

from test_worker_pool import ctl, POOL, SchedulerFixture

REPO = 'Acme/app'
NAME = 'web-app-ci-job-' + 'ab' * 16
OTHER = 'web-app-ci-job-' + 'cd' * 16


def snapshot(ids=(), assignments=()):
    return ctl.JobSnapshot(tuple(('2026-10-21', REPO, job) for job in ids), tuple(assignments))


def intent(job=2, runner_id=383, name=NAME, repo=REPO):
    return {'repo': repo, 'runner_id': runner_id, 'runner_name': name, 'job_id': job}


class AssignmentBudgetTests(unittest.TestCase):
    def setUp(self):
        self.config = dict(POOL, projects={'app': {'repository': REPO}})
        self.children = {0: 101}
        self.reservations = {'0': {'repo': REPO, 'job_id': 2}}
        self.assigned = {}

    def candidates(self, observed, state=None):
        with mock.patch.object(ctl, 'read_job_state', return_value=intent() if state is None else state):
            return ctl.dispatch_candidates(self.config, observed, self.children, self.reservations, self.assigned)

    def test_observed_backend2_runner_actually_runs_frontend2_releases_backend2(self):
        self.assertEqual(self.candidates(snapshot([2], [(REPO, 383, NAME, 1)])), ((REPO, 2),))
        self.assertEqual(self.reservations, {'0': {'repo': REPO, 'job_id': 2}})
        self.assertEqual(self.assigned, {0: (REPO, 383, NAME, 1)})

    def test_waiting_runner_still_consumes_one_demand_when_observed_job_taken_elsewhere(self):
        self.assertEqual(self.candidates(snapshot([3], [(REPO, 999, OTHER, 2)])), ())
        self.assertEqual(self.assigned, {})

    def test_missing_intent_or_unregistered_runner_or_wrong_identity_cannot_release_budget(self):
        for state in ({}, intent(runner_id=None), intent(name=OTHER), intent(runner_id=384)):
            with self.subTest(state=state):
                self.assertEqual(self.candidates(snapshot([2, 3], [(REPO, 383, NAME, 1)]), state), ((REPO, 3),))
                self.assertEqual(self.assigned, {})

    def test_stale_snapshot_retains_latch_and_excludes_actual_job_even_after_state_cleanup(self):
        self.candidates(snapshot([2], [(REPO, 383, NAME, 1)]))
        self.assertEqual(self.candidates(snapshot([1, 2]), {}), ((REPO, 2),))
        self.assertEqual(self.assigned, {0: (REPO, 383, NAME, 1)})

    def test_awaiting_claims_prefer_observed_then_oldest_with_repository_isolation(self):
        self.config['projects']['other'] = {'repository': 'Acme/other'}
        self.children[1] = 102
        self.children[2] = 103
        self.reservations.update({'1': {'repo': REPO, 'job_id': 99},
                                  '2': {'repo': 'Acme/other', 'job_id': 1}})
        queue = snapshot([1, 2, 3, 4]).queued + (('2026-10-22', 'Acme/other', 1), ('2026-10-22', 'Acme/other', 2))
        self.assertEqual(self.candidates(ctl.JobSnapshot(queue), {}), ((REPO, 3), (REPO, 4), ('Acme/other', 2)))

    def test_corrupt_protected_intent_or_reservation_mismatch_cannot_release_demand(self):
        with mock.patch.object(ctl, 'read_job_state', side_effect=ctl.BoundaryError('invalid-job-recovery-state')), \
                self.assertRaisesRegex(ctl.BoundaryError, 'invalid-job-recovery-state'):
            ctl.dispatch_candidates(self.config, snapshot([2]), self.children, self.reservations, self.assigned)
        with self.assertRaisesRegex(ctl.BoundaryError, 'slot-intent-reservation-mismatch'):
            self.candidates(snapshot([2]), intent(job=9))
        self.assertEqual(self.assigned, {})


class DiscoverySnapshotTests(unittest.TestCase):
    def discover(self, jobs, second=None):
        calls = []
        def api(_token, _repo, suffix):
            calls.append(suffix)
            if suffix.startswith('actions/runs?'):
                return {'workflow_runs': [{'id': 10, 'event': 'pull_request'}]}
            return {'jobs': jobs}
        with mock.patch.object(ctl, 'load_config', return_value=dict(POOL, projects={'app': {'repository': REPO}})), \
                mock.patch.object(ctl, 'api', side_effect=api):
            result = ctl.discover_jobs('fixture')
        return result, calls

    def test_completed_assignment_overrides_stale_queued_copy_without_extra_per_slot_requests(self):
        queued = {'id': 2, 'status': 'queued', 'labels': sorted(ctl.LABELS), 'created_at': '2026-10-21'}
        for status in ('in_progress', 'completed'):
            with self.subTest(status=status):
                result, calls = self.discover([queued, dict(queued, status=status, runner_id=383, runner_name=NAME)])
                self.assertEqual(result, snapshot([], [(REPO, 383, NAME, 2)]))
                self.assertEqual(len(calls), 3)  # Two run listings, one deduplicated jobs request.
                with self.assertRaises(AttributeError):
                    result.assignments = ()

    def test_malformed_assignment_and_conflicting_ephemeral_job_identity_fail_closed(self):
        assigned = {'id': 1, 'status': 'in_progress', 'runner_id': 383, 'runner_name': NAME}
        for jobs, code in (([dict(assigned, runner_id=True)], 'invalid-discovery-runner'),
                           ([assigned, dict(assigned, id=2)], 'conflicting-discovery-assignment'),
                           ([assigned, dict(assigned, runner_name=OTHER)], 'conflicting-discovery-assignment'),
                           ([dict(assigned, id=True)], 'invalid-discovery-job')):
            with self.subTest(jobs=jobs), self.assertRaisesRegex(ctl.BoundaryError, code):
                self.discover(jobs)

    def test_protected_state_schema_rejects_unknown_fields_bool_ids_and_json(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'state.json'
            with mock.patch.object(ctl, 'STATE', path), \
                    mock.patch.object(ctl, 'protected_file', side_effect=lambda item: item.read_text()):
                for text in ('[', '[]', json.dumps(dict(intent(), runner_id=True)), json.dumps(dict(intent(), extra='bad'))):
                    path.write_text(text)
                    with self.subTest(text=text), self.assertRaisesRegex(ctl.BoundaryError, 'invalid-job-recovery-state'):
                        ctl.read_job_state(dict(POOL, projects={'app': {'repository': REPO}}))
                path.unlink()
                self.assertEqual(ctl.read_job_state(POOL), {})


class LiveDispatchTests(SchedulerFixture, unittest.TestCase):
    def clock(self, limit):
        self.now = 0
        def sleep(seconds):
            self.now += seconds
            if self.now >= limit:
                ctl.STOP = True
        self.stack.enter_context(mock.patch.object(ctl.time, 'monotonic', side_effect=lambda: self.now))
        self.stack.enter_context(mock.patch.object(ctl.time, 'sleep', side_effect=sleep))

    def test_real_wrong_assignment_gets_waiting_backend_admitted_next_poll(self):
        self.clock(16)
        polls = []
        def discover(_token):
            polls.append(self.now)
            return snapshot([2]) if self.now == 0 else snapshot([2], [(REPO, 383, NAME, 1)])
        with mock.patch.object(ctl, 'discover_jobs', side_effect=discover), \
                mock.patch.object(ctl, 'read_job_state', return_value=intent()), \
                mock.patch.object(os, 'fork', side_effect=[101, 102]) as fork, \
                mock.patch.object(os, 'waitpid', return_value=(0, 0)), mock.patch.object(os, 'kill'):
            ctl.serve(self.config)
        self.assertEqual(polls, [0, 15])
        self.assertEqual(fork.call_count, 2)
        persisted = [row[1] for row in self.events if row[0] == 'persist']
        self.assertIn({'0': {'repo': REPO, 'job_id': 2}, '1': {'repo': REPO, 'job_id': 2}}, persisted)

    def test_waiting_duplicate_budget_never_creates_another_jit_runner(self):
        self.clock(46)
        with mock.patch.object(ctl, 'discover_jobs', return_value=snapshot([2])) as discover, \
                mock.patch.object(os, 'fork', return_value=101) as fork, \
                mock.patch.object(os, 'waitpid', return_value=(0, 0)), mock.patch.object(os, 'kill'):
            ctl.serve(self.config)
        self.assertEqual(discover.call_count, 4)  # Active tail retains 15s cadence.
        self.assertEqual(fork.call_count, 1)

    def test_reaping_resets_idle_backoff_and_clears_assignment_latch_before_slot_reuse(self):
        self.clock(46)
        polls = []
        states = []
        def discover(_token):
            polls.append(self.now)
            if self.now == 0:
                return snapshot([2])
            if self.now == 15:
                return snapshot([], [(REPO, 383, NAME, 1)])
            return snapshot([1])
        def state(_config):
            states.append(self.now)
            return intent() if self.now < 20 else intent(job=1, runner_id=None)
        def wait(pid, flags):
            return (101, 0) if pid == 101 and flags == os.WNOHANG and self.now == 20 else (0, 0)
        with mock.patch.object(ctl, 'discover_jobs', side_effect=discover), \
                mock.patch.object(ctl, 'read_job_state', side_effect=state), \
                mock.patch.object(os, 'fork', side_effect=[101, 102]) as fork, \
                mock.patch.object(os, 'waitpid', side_effect=wait), mock.patch.object(os, 'kill'):
            ctl.serve(self.config)
        self.assertEqual(polls, [0, 15, 30, 45])
        self.assertEqual(fork.call_count, 2)
        self.assertEqual(states, [15, 45])
