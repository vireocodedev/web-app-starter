"""Release discovery binds exactly one run to a durable bounded dispatch intent."""
import contextlib
import copy
from datetime import datetime
import importlib.util
import io
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest import mock
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / 'docs/template-initialization/scripts'
spec = importlib.util.spec_from_file_location('run_selection_operations', SCRIPTS / '_operations.py')
operator = importlib.util.module_from_spec(spec)
with mock.patch.object(sys, 'path', [str(SCRIPTS), *sys.path]):
    spec.loader.exec_module(operator)


def fixture(environment='staging'):
    ctx = SimpleNamespace(values={'REPOSITORY': 'vireocodedev/fixture-app',
                                 'RELEASE_BRANCH': 'release/initial-fixture-app', 'MAINTAINER_LOGIN': 'maintainer'})
    intent = {'repository': 'vireocodedev/fixture-app', 'source_sha': 'a' * 40,
              'branch': 'release/initial-fixture-app', 'actor': 'maintainer', 'workflow_id': 15,
              'created_after': '2026-10-27T10:00:00+00:00', 'created_before': '2026-10-27T10:05:00+00:00',
              'state': 'unresolved'}
    state = {'source_sha': 'a' * 40, environment + '_workflow_id': 15,
             environment + '_dispatch_after': intent['created_after'], environment + '_dispatch_intent': intent}
    if environment == 'production':
        state.update(staging_run_id=99, staging_run_attempt=2)
        intent.update(staging_run_id=99, staging_run_attempt=2)
    row = {'id': 100, 'repository': {'full_name': intent['repository']}, 'head_sha': intent['source_sha'],
           'head_branch': intent['branch'], 'event': 'workflow_dispatch', 'workflow_id': 15,
           'path': '.github/workflows/deploy-' + environment + '.yaml', 'actor': {'login': 'maintainer'},
           'created_at': '2026-10-27T10:00:01Z', 'run_attempt': 1, 'status': 'in_progress', 'conclusion': None}
    return ctx, state, row


class RunSelectionTests(unittest.TestCase):
    def test_dispatch_persists_five_minute_upper_bound_before_mutation(self):
        ctx, state, _ = fixture()
        state.pop('staging_dispatch_intent')
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'update_state') as update:
            operator.begin_dispatch(ctx, 'staging')
        intent = update.call_args.kwargs['staging_dispatch_intent']
        self.assertEqual((datetime.fromisoformat(intent['created_before'])
                          - datetime.fromisoformat(intent['created_after'])).total_seconds(), 300)

    def test_pagination_filters_all_identity_fields_including_upper_bound(self):
        ctx, state, row = fixture()
        variants = [dict(row, id=number + 1, **changed) for number, changed in enumerate([
            {'head_sha': 'b' * 40}, {'head_branch': 'main'}, {'event': 'push'}, {'workflow_id': 16},
            {'repository': {'full_name': 'vireocodedev/another-app'}}, {'actor': {'login': 'other'}},
            {'path': '.github/workflows/deploy-production.yaml'}, {'created_at': '2026-10-27T09:59:59Z'},
            {'created_at': '2026-10-27T10:05:01Z'}])]
        first = [dict(row, id=number + 1000, actor={'login': 'other'}) for number in range(100)]
        with mock.patch.object(operator, 'gh_json', side_effect=[{'total_count': 110, 'workflow_runs': first},
                 {'total_count': 110, 'workflow_runs': [*variants, row]}]) as api:
            self.assertEqual(operator.matching_dispatch_runs(ctx, 'staging', state['staging_dispatch_intent']), [100])
        query = parse_qs(urlsplit(api.call_args_list[0].args[1]).query)
        self.assertEqual(query['created'], ['2026-10-27T10:00:00+00:00..2026-10-27T10:05:00+00:00'])
        self.assertEqual(query['actor'], ['maintainer'])
        self.assertEqual(parse_qs(urlsplit(api.call_args_list[1].args[1]).query)['page'], ['2'])

    def test_unique_selection_records_binding_before_watch_and_supports_both_environments(self):
        for environment in ('staging', 'production'):
            ctx, state, row = fixture(environment)
            events = []
            def api(ctx, suffix):
                return {'total_count': 1, 'workflow_runs': [row]} if '/workflows/' in suffix else row
            def update(ctx, **values):
                events.append('record')
                state.update(values)
            with self.subTest(environment=environment), \
                    mock.patch.object(operator, 'context', return_value=ctx), \
                    mock.patch.object(operator, 'read_state', side_effect=lambda ctx: copy.deepcopy(state)), \
                    mock.patch.object(operator, 'update_state', side_effect=update), \
                    mock.patch.object(operator, 'gh_json', side_effect=api), \
                    mock.patch.object(operator, 'watch_release', side_effect=lambda *args: events.append('watch')), \
                    mock.patch.object(operator, 'public_health'), contextlib.redirect_stdout(io.StringIO()):
                if environment == 'production':
                    operator.watch_production(SimpleNamespace(run_id=None, reconcile_only=False))
                    self.assertEqual(events, ['record', 'watch'])
                else:
                    self.assertEqual(operator.select_dispatch_run(ctx, environment), 100)
            self.assertEqual(state[environment + '_dispatch_intent']['run_id'], 100)
            self.assertEqual(state[environment + '_dispatch_intent']['run_attempt'], 1)

    def test_multiple_matching_runs_fail_without_recording_or_newest_heuristic(self):
        ctx, state, row = fixture()
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', return_value={'total_count': 2,
                    'workflow_runs': [row, dict(row, id=200)]}), \
                mock.patch.object(operator, 'update_state') as update, \
                self.assertRaisesRegex(operator.InitError, 'Multiple'):
            operator.select_dispatch_run(ctx, 'staging')
        update.assert_not_called()

    def test_zero_results_wait_bounded_then_preserve_intent(self):
        ctx, state, _ = fixture()
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', return_value={'total_count': 0, 'workflow_runs': []}), \
                mock.patch.object(operator.time, 'monotonic', side_effect=[0, 301]), \
                mock.patch.object(operator, 'update_state') as update, \
                self.assertRaisesRegex(operator.InitError, 'do not redispatch'):
            operator.select_dispatch_run(ctx, 'staging')
        update.assert_not_called()

    def test_missing_inventory_can_appear_during_bounded_startup_wait(self):
        ctx, state, row = fixture()
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'matching_dispatch_runs', side_effect=[[], [100]]), \
                mock.patch.object(operator, 'gh_json', return_value=row), \
                mock.patch.object(operator.time, 'monotonic', side_effect=[0, 10]), \
                mock.patch.object(operator.time, 'sleep') as sleep, \
                mock.patch.object(operator, 'update_state'), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(operator.select_dispatch_run(ctx, 'staging'), 100)
        sleep.assert_called_once_with(10)

    def test_inventory_errors_caps_and_truncation_never_select_or_retry_mutation(self):
        ctx, state, row = fixture()
        for response in ({'total_count': 1000, 'workflow_runs': [row]}, {'total_count': 2, 'workflow_runs': [row]},
                         {'total_count': 1, 'workflow_runs': []}, {'workflow_runs': [row]}):
            with self.subTest(response=response), mock.patch.object(operator, 'gh_json', return_value=response), \
                    self.assertRaises(operator.InitError):
                operator.matching_dispatch_runs(ctx, 'staging', state['staging_dispatch_intent'])
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', side_effect=operator.InitError('API unavailable')), \
                mock.patch.object(operator, 'update_state') as update, \
                self.assertRaisesRegex(operator.InitError, 'API unavailable'):
            operator.select_dispatch_run(ctx, 'staging')
        update.assert_not_called()

    def test_shrinking_paginated_inventory_cannot_hide_another_matching_run(self):
        ctx, state, row = fixture()
        # A deletion shifts the hidden second match onto the already-read first
        # page. The shrinking final count still equals the number of seen IDs.
        first = [row, *[dict(row, id=number + 1000, actor={'login': 'other'}) for number in range(99)]]
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', side_effect=[{'total_count': 101, 'workflow_runs': first},
                    {'total_count': 100, 'workflow_runs': []}]), \
                mock.patch.object(operator, 'update_state') as update, \
                self.assertRaisesRegex(operator.InitError, 'inventory changed'):
            operator.select_dispatch_run(ctx, 'staging')
        update.assert_not_called()

    def test_selected_attempt_cannot_change_before_watch_or_reconciliation(self):
        for operation in ('watch', 'reconcile'):
            ctx, state, row = fixture()
            selected = dict(row, run_attempt=1)
            rerun = dict(row, run_attempt=2, status='completed', conclusion='success')
            def update(ctx, **values):
                state.update(values)
            with self.subTest(operation=operation), \
                    mock.patch.object(operator, 'read_state', side_effect=lambda ctx: copy.deepcopy(state)), \
                    mock.patch.object(operator, 'update_state', side_effect=update) as record, \
                    mock.patch.object(operator, 'gh_json', side_effect=[selected, rerun]), \
                    mock.patch.object(operator, 'execute') as execute, contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(operator.select_dispatch_run(ctx, 'staging', 100), 100)
                with self.assertRaisesRegex(operator.InitError, 'Recorded workflow attempt changed'):
                    if operation == 'watch':
                        operator.watch_release(ctx, 'staging', 100)
                    else:
                        operator.reconcile_dispatch(ctx, 'staging', 100)
                self.assertEqual(record.call_count, 1)
            execute.assert_not_called()
            self.assertEqual(state['staging_dispatch_intent']['run_attempt'], 1)
            self.assertEqual(state['staging_dispatch_intent']['state'], 'observed')
            self.assertNotIn('staging_run_id', state)

    def test_explicit_selection_acknowledges_new_attempt_before_normal_watch(self):
        ctx, state, row = fixture()
        state['staging_dispatch_intent'].update(run_id=100, run_attempt=1)
        rerun = dict(row, run_attempt=2, status='completed', conclusion='success',
                     html_url='https://github.com/vireocodedev/fixture-app/actions/runs/100')
        with mock.patch.object(operator, 'read_state', side_effect=lambda ctx: copy.deepcopy(state)), \
                mock.patch.object(operator, 'update_state', side_effect=lambda ctx, **values: state.update(values)), \
                mock.patch.object(operator, 'gh_json', return_value=rerun), \
                mock.patch.object(operator, 'execute') as execute, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(operator.select_dispatch_run(ctx, 'staging', 100), 100)
            self.assertEqual(state['staging_dispatch_intent']['run_attempt'], 2)
            operator.watch_release(ctx, 'staging', 100)
        execute.assert_called_once()
        self.assertEqual(state['staging_run_attempt'], 2)
        self.assertEqual(state['staging_dispatch_intent']['state'], 'completed')

    def test_bound_run_is_preferred_and_automatic_attempt_changes_require_explicit_acknowledgement(self):
        ctx, state, row = fixture()
        state['staging_dispatch_intent'].update(run_id=100, run_attempt=1)
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', return_value=row) as api, \
                mock.patch.object(operator, 'matching_dispatch_runs') as inventory, \
                mock.patch.object(operator, 'update_state'), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(operator.select_dispatch_run(ctx, 'staging'), 100)
            api.assert_called_once_with(ctx, '/actions/runs/100')
            inventory.assert_not_called()
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', return_value=dict(row, run_attempt=2)), \
                mock.patch.object(operator, 'update_state') as update:
            with self.assertRaisesRegex(operator.InitError, 'attempt changed'):
                operator.select_dispatch_run(ctx, 'staging')
            update.assert_not_called()
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(operator.select_dispatch_run(ctx, 'staging', 100), 100)

    def test_legacy_intent_requires_explicit_id_and_preserves_reconciliation(self):
        ctx, state, row = fixture()
        state['staging_dispatch_intent'].pop('created_before')
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', return_value=row), \
                mock.patch.object(operator, 'update_state') as update:
            with self.assertRaisesRegex(operator.InitError, 'older dispatch'):
                operator.select_dispatch_run(ctx, 'staging')
            update.assert_not_called()
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(operator.select_dispatch_run(ctx, 'staging', 100), 100)
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', return_value=dict(row, created_at='2026-10-27T10:06:00Z')), \
                contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(operator.observe_run(ctx, 'staging', 100)['id'], 100)

    def test_even_explicit_id_cannot_bypass_new_upper_window(self):
        ctx, state, row = fixture()
        with mock.patch.object(operator, 'read_state', return_value=state), \
                mock.patch.object(operator, 'gh_json', return_value=dict(row, created_at='2026-10-27T10:05:01Z')), \
                mock.patch.object(operator, 'update_state') as update, \
                self.assertRaisesRegex(operator.InitError, 'identity mismatch'):
            operator.select_dispatch_run(ctx, 'staging', 100)
        update.assert_not_called()


if __name__ == '__main__':
    unittest.main()
