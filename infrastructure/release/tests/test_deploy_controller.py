import copy
from datetime import datetime, timezone
import hashlib
from pathlib import Path
import sys
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import controller
from protocol import ReleaseError
from test_release_protocol import PAIR, REPO, SHA


class AuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.config = {'repository': REPO, 'repository_id': 12, 'actors': ['brunotot'],
                       'workflow_ids': {'staging': 20, 'production': 21},
                       'trusted_sha256': {path: hashlib.sha256(b'trusted').hexdigest()
                                          for path in controller.TRUSTED}}
        self.run = {'id': 30, 'run_attempt': 1, 'event': 'workflow_dispatch', 'status': 'in_progress',
                    'workflow_id': 20, 'path': '.github/workflows/deploy-staging.yaml',
                    'repository': {'id': 12}, 'head_repository': {'id': 12},
                    'actor': {'login': 'brunotot'}, 'triggering_actor': {'login': 'brunotot'},
                    'head_sha': SHA, 'run_started_at': datetime.now(timezone.utc).isoformat()}
        self.ticket = {'run_id': 30, 'run_attempt': 1, 'environment': 'staging',
                       'pair': PAIR, 'deployment_id': 40, 'staging_run_id': None,
                       'token': 'opaque-' + 'x' * 40}

    def test_actual_manual_run_identity_not_candidate_or_labels(self):
        controller.validate_run(self.config, self.run, 'staging')
        for change in ({'event': 'pull_request'}, {'status': 'completed'}, {'workflow_id': 99},
                       {'path': '.github/workflows/untrusted.yaml'}, {'head_repository': {'id': 999}},
                       {'actor': {'login': 'outside'}}, {'triggering_actor': {'login': 'outside'}},
                       {'run_started_at': '2020-01-01T00:00:00Z'}, {'head_sha': 'branch-name'}):
            with self.subTest(change=change), self.assertRaises(ReleaseError):
                controller.validate_run(self.config, dict(self.run, **change), 'staging')

    def deployment(self):
        return {'environment': 'staging', 'sha': SHA, 'creator': {'login': 'github-actions[bot]'},
                'payload': {key: self.ticket[key] for key in ('run_id', 'run_attempt', 'pair', 'staging_run_id')}}

    def test_deployment_must_match_request_and_private_repository(self):
        api = mock.Mock()
        api.request.side_effect = [{'id': 12, 'private': True}, self.deployment()]
        controller.validate_ticket(self.config, self.run, 'staging', self.ticket, api)
        for change in ({'run_id': 999}, {'run_attempt': 2}, {'environment': 'production'},
                       {'deployment_id': True}, {'unexpected': 'field'}):
            with self.subTest(change=change), self.assertRaises(ReleaseError):
                controller.validate_ticket(self.config, self.run, 'staging', dict(self.ticket, **change), api)
        for deployment in (dict(self.deployment(), sha='f' * 40),
                           dict(self.deployment(), payload={}),
                           dict(self.deployment(), environment='production')):
            api.request.side_effect = [{'id': 12, 'private': True}, deployment]
            with self.assertRaisesRegex(ReleaseError, 'deployment-identity'):
                controller.validate_ticket(self.config, self.run, 'staging', self.ticket, api)

    def test_unreviewed_workflow_or_client_never_reaches_executor(self):
        api = mock.Mock()
        api.file.return_value = b'trusted'
        api.request.return_value = {'total_count': 1, 'jobs': [
            {'name': 'Request staging deployment', 'status': 'in_progress'}]}
        controller.validate_source(self.config, self.run, 'staging', self.ticket, api)
        api.file.return_value = b'changed'
        with self.assertRaisesRegex(ReleaseError, 'unreviewed-workflow'):
            controller.validate_source(self.config, self.run, 'staging', self.ticket, api)
        api.file.return_value = b'trusted'
        api.request.return_value = {'total_count': 1, 'jobs': [
            {'name': 'Request staging deployment', 'status': 'completed'}]}
        with self.assertRaisesRegex(ReleaseError, 'actual-request-job'):
            controller.validate_source(self.config, self.run, 'staging', self.ticket, api)

    def test_production_requires_a_successful_host_verified_staging_pair(self):
        run = dict(self.run, workflow_id=21, path='.github/workflows/deploy-production.yaml')
        ticket = dict(self.ticket, environment='production', staging_run_id=29)
        config = dict(self.config, state='/root/fixture')
        api = mock.Mock()
        api.file.return_value = b'trusted'
        api.request.side_effect = [{'total_count': 1, 'jobs': [
            {'name': 'Request production deployment', 'status': 'in_progress'}]},
            {'workflow_id': 20, 'path': '.github/workflows/deploy-staging.yaml',
             'event': 'workflow_dispatch', 'conclusion': 'success', 'head_sha': SHA, 'run_attempt': 1}]
        protected = mock.Mock()
        protected.read_bytes.return_value = b'{"pair":{},"state":"success"}'
        with mock.patch.object(controller, 'protected', return_value=protected), \
                self.assertRaisesRegex(ReleaseError, 'not-host-verified'):
            controller.validate_source(config, run, 'production', ticket, api)

    def test_rejected_staging_run_cannot_starve_other_runs_or_production(self):
        api = mock.Mock()
        api.request.side_effect = [
            {'total_count': 2, 'workflow_runs': [{'id': 31}, {'id': 30}]},
            {'total_count': 1, 'workflow_runs': [{'id': 40}]},
        ]
        with mock.patch.object(controller, 'process', side_effect=[
                ReleaseError('manual-run-identity-rejected'), None, None]) as process, \
                mock.patch('builtins.print'):
            controller.poll(self.config, api)
        self.assertEqual([(call.args[2]['id'], call.args[3]) for call in process.call_args_list],
                         [(30, 'staging'), (31, 'staging'), (40, 'production')])

    def test_staging_inventory_error_does_not_starve_production(self):
        api = mock.Mock()
        api.request.side_effect = [
            ReleaseError('github-http-403'),
            {'total_count': 1, 'workflow_runs': [{'id': 40}]},
        ]
        with mock.patch.object(controller, 'process') as process, mock.patch('builtins.print'):
            controller.poll(self.config, api)
        self.assertEqual(process.call_args.args[3], 'production')


if __name__ == '__main__':
    unittest.main()
