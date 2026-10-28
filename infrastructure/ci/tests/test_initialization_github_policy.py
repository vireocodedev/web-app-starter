"""GitHub policy API boundaries; all identities and remote effects are synthetic."""
import contextlib
import copy
import hashlib
import importlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[3] / 'docs/template-initialization/scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    policy = importlib.import_module('_github_policy')
finally:
    sys.path.pop(0)


class FakeGitHub:
    """HTTP-shaped gh command fake, including trees, commits and protection enforcement."""
    def __init__(self):
        self.repo = 'fixture-owner/sample-app'
        self.protection = None
        self.environments = {}
        self.rules = []
        self.rulesets = []
        self.calls = []
        self.writes = []
        self.state = {'repository_id': 23}
        self.base = 'a' * 40
        self.refs = {'main': self.base}
        self.trees = {'b' * 40: {}}
        self.commits = {self.base: {'sha': self.base, 'tree': {'sha': 'b' * 40}, 'parents': []}}
        self.pulls = {}
        self.fail = None
        self.uncertain = None
        self.clock = 0
        self.stale_readback = False
        self.drop_gate = False
        self.merge_state = None
        self.approvals = False
        self.run_attempt_change = False
        self.foreign_commit = False
        self.app_id = 77
        self.probe_failure_gate = False
        self.check_change = {}
        self.extra_check = False
        self.foreign_push_at_delete = False
        self.uncertain_delete = False
        self.rerun_during_graphql = None

    def result(self, argv, code, data):
        return subprocess.CompletedProcess(argv, 0 if 200 <= code < 300 else 1,
            'HTTP/2.0 ' + str(code) + '\r\nContent-Type: application/json\r\n\r\n' + json.dumps(data), '')

    def command(self, argv, **kwargs):
        assert argv[:2] == ['gh', 'api'], argv
        endpoint = argv[2]
        path = endpoint.removeprefix('repos/' + self.repo)
        method = argv[argv.index('--method') + 1]
        body = json.loads(kwargs['input']) if kwargs.get('input') else None
        self.calls.append((method, path, body))
        if method != 'GET':
            self.writes.append((method, path, copy.deepcopy(body)))
        if self.fail and self.fail[:2] == (method, path):
            return self.result(argv, self.fail[2], {'message': 'private token must not appear'})
        code, data = self.respond(method, path, body)
        if self.uncertain == (method, path):
            self.uncertain = None
            return self.result(argv, 503, {'message': 'private token must not appear'})
        return self.result(argv, code, data)

    def respond(self, method, path, body):
        route = path.split('?')[0]
        if route == '':
            return 200, {'id': 23, 'full_name': self.repo, 'node_id': 'R_fixture23'}
        if path == 'graphql' and 'updateRefs' in body['query']:
            mutation = body['variables']['input']
            update = mutation['refUpdates'][0]
            branch = update['name'].removeprefix('refs/heads/')
            assert mutation['repositoryId'] == 'R_fixture23'
            assert update['force'] is False
            assert update['afterOid'] == '0' * 40
            if self.foreign_push_at_delete:
                self.refs[branch] = 'f' * 40
            if self.refs[branch] != update['beforeOid']:
                return 200, {'errors': [{'message': 'expected beforeOid differs'}]}
            del self.refs[branch]
            if self.uncertain_delete:
                self.uncertain_delete = False
                return 503, {'message': 'private token must not appear'}
            return 200, {'data': {'updateRefs': {'clientMutationId': mutation['clientMutationId']}}}
        if path == 'graphql':
            pull = self.pulls[body['variables']['number']]
            sha = self.refs[pull['head']['ref']]
            failed = 'corrected' not in self.commits[sha].get('message', '')
            state = self.merge_state or ('BLOCKED' if failed else 'CLEAN')
            if self.rerun_during_graphql == ('failing' if failed else 'corrected'):
                self.workflow['run_attempt'] = 2
            return 200, {'data': {'repository': {'pullRequest': {
                'number': pull['number'], 'headRefOid': sha, 'baseRefOid': self.base,
                'mergeable': 'MERGEABLE', 'mergeStateStatus': state,
                'reviewDecision': 'REVIEW_REQUIRED' if failed else None,
                'reviews': {'totalCount': int(self.approvals),
                            'nodes': [{'state': 'APPROVED'}] if self.approvals else []}}}}}
        if route == '/branches/main/protection':
            if method == 'PUT':
                if not self.stale_readback:
                    signatures = (self.protection or {}).get('required_signatures')
                    self.protection = copy.deepcopy(body)
                    for key in ('enforce_admins', 'required_linear_history', 'allow_force_pushes', 'allow_deletions',
                                'block_creations', 'required_conversation_resolution', 'lock_branch', 'allow_fork_syncing'):
                        self.protection[key] = {'enabled': body[key]}
                    if signatures is not None:
                        self.protection['required_signatures'] = signatures
                    self.protection['required_status_checks']['contexts'] = [
                        item['context'] for item in self.protection['required_status_checks']['checks']]
                    if self.drop_gate:
                        self.protection['required_status_checks']['checks'] = []
                        self.protection['required_status_checks']['contexts'] = []
                return 200, self.protection
            return (200, copy.deepcopy(self.protection)) if self.protection else (404, {'message': 'Branch not protected'})
        if route == '/rules/branches/main':
            return 200, self.rules
        if route == '/rulesets':
            return 200, self.rulesets
        if route == '/environments':
            return 200, {'total_count': len(self.environments), 'environments': [
                {'name': name} for name in self.environments]}
        if route.startswith('/environments/'):
            name = route.split('/')[2]
            environment = self.environments.get(name)
            if route.endswith('/deployment-branch-policies'):
                if method == 'POST':
                    environment['policies'].append({'id': len(environment['policies']) + 1, **body})
                    return 200, environment['policies'][-1]
                return 200, {'branch_policies': environment['policies'], 'total_count': len(environment['policies'])}
            if method == 'PUT':
                environment = {'protection_rules': [], 'deployment_branch_policy': body['deployment_branch_policy'], 'policies': []}
                self.environments[name] = environment
                return 200, {key: value for key, value in environment.items() if key != 'policies'}
            return (200, {key: value for key, value in environment.items() if key != 'policies'}) if environment else (404, {'message': 'Not Found'})
        if route.startswith('/git/ref/heads/'):
            branch = route.removeprefix('/git/ref/heads/')
            if branch not in self.refs:
                return 404, {'message': 'Not Found'}
            sha = self.refs[branch]
            if self.foreign_commit and branch != 'main':
                sha = 'f' * 40
            return 200, {'ref': 'refs/heads/' + branch, 'object': {'sha': sha}}
        if route == '/git/refs' and method == 'POST':
            self.refs[body['ref'].removeprefix('refs/heads/')] = body['sha']
            return 201, {'ref': body['ref'], 'object': {'sha': body['sha']}}
        if route.startswith('/git/refs/heads/'):
            branch = route.removeprefix('/git/refs/heads/')
            if method == 'PATCH':
                self.refs[branch] = body['sha']
                return 200, {'ref': 'refs/heads/' + branch, 'object': {'sha': body['sha']}}
            del self.refs[branch]
            return 204, None
        if route == '/git/trees' and method == 'POST':
            tree = copy.deepcopy(self.trees[body['base_tree']])
            for entry in body['tree']:
                if entry.get('sha', '') is None:
                    tree.pop(entry['path'], None)
                else:
                    data = entry['content'].encode()
                    blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
                    tree[entry['path']] = {'path': entry['path'], 'mode': entry['mode'], 'type': entry['type'], 'sha': blob}
            sha = hashlib.sha1(json.dumps(tree, sort_keys=True).encode()).hexdigest()
            self.trees[sha] = tree
            return 201, {'sha': sha}
        if route.startswith('/git/trees/'):
            sha = route.removeprefix('/git/trees/')
            return 200, {'sha': sha, 'tree': list(self.trees[sha].values()), 'truncated': False}
        if route == '/git/commits' and method == 'POST':
            sha = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()
            self.commits[sha] = {'sha': sha, 'tree': {'sha': body['tree']},
                                 'parents': [{'sha': parent} for parent in body['parents']], 'message': body['message']}
            return 201, self.commits[sha]
        if route.startswith('/git/commits/'):
            return 200, self.commits[route.removeprefix('/git/commits/')]
        if route == '/pulls':
            if method == 'POST':
                number = len(self.pulls) + 10
                self.pulls[number] = {'number': number, 'state': 'open', 'merged_at': None,
                    'body': body['body'], 'head': {'ref': body['head'], 'repo': {'full_name': self.repo}},
                    'base': {'ref': 'main', 'repo': {'full_name': self.repo}}}
                return 201, self.pulls[number]
            return 200, list(self.pulls.values())
        if route.startswith('/pulls/'):
            pull = self.pulls[int(route.split('/')[2])]
            if method == 'PATCH':
                pull.update(body)
            result = copy.deepcopy(pull)
            result['head']['sha'] = self.refs[pull['head']['ref']] if pull['head']['ref'] in self.refs else self.state['github_policy_probe']['corrected_sha']
            result['base']['sha'] = self.base
            return 200, result
        if route == '/actions/workflows/ci.yml/runs':
            branch = next(key for key in self.refs if key != 'main')
            sha = self.refs[branch]
            failed = 'corrected' not in self.commits[sha]['message']
            self.probe_failure_gate = failed
            workflow = {'id': 88 if failed else 89, 'run_attempt': 1, 'head_sha': sha,
                'head_branch': branch, 'event': 'pull_request', 'path': '.github/workflows/ci.yml',
                'repository': {'full_name': self.repo}, 'pull_requests': [{'number': next(iter(self.pulls))}],
                'status': 'completed', 'conclusion': 'failure' if failed else 'success', 'check_suite_id': 99}
            self.workflow = workflow
            return 200, {'workflow_runs': [workflow], 'total_count': 1}
        if route.startswith('/actions/runs/'):
            if route.endswith('/jobs'):
                conclusion = self.workflow['conclusion']
                return 200, {'total_count': 2, 'jobs': [
                    {'name': 'CI gate', 'status': 'completed', 'conclusion': conclusion,
                     'check_run_url': 'https://api.github.com/repos/' + self.repo + '/check-runs/101'},
                    {'name': 'Foundation verification', 'status': 'completed', 'conclusion': conclusion}]}
            result = copy.deepcopy(self.workflow)
            if self.run_attempt_change:
                result['run_attempt'] = 2
            return 200, result
        if route == '/check-runs/101':
            return 200, {'id': 101, 'name': 'CI gate', 'status': 'completed',
                'conclusion': 'failure' if self.probe_failure_gate else 'success',
                'head_sha': self.workflow['head_sha'] if hasattr(self, 'workflow') else self.base,
                'check_suite': {'id': 99}, 'app': {'id': self.app_id, 'slug': 'github-actions'}, **self.check_change}
        raise AssertionError((method, path, body))


class GitHubPolicyTests(unittest.TestCase):
    def setUp(self):
        self.github = FakeGitHub()
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.ctx = SimpleNamespace(env_path=Path(directory.name) / 'values.env', values={
            'REPOSITORY': self.github.repo, 'GH_ORG': 'fixture-owner',
            'RELEASE_BRANCH': 'release/initial-sample-app', 'MAINTAINER_LOGIN': 'fixture-admin'})
        self.gate = {'app_id': 77, 'pr_number': 1, 'source_sha': self.github.base, 'run_id': 55, 'run_attempt': 1}
        self.addCleanup(patch.stopall)
        patch.object(policy, 'run', side_effect=self.github.command).start()
        patch.object(policy, 'initial_gate', return_value=self.gate).start()
        patch.object(policy, 'read_state', side_effect=lambda ctx: copy.deepcopy(self.github.state)).start()
        patch.object(policy, 'update_state', side_effect=self.update_state).start()
        patch.object(policy, 'time', SimpleNamespace(monotonic=lambda: self.github.clock, sleep=self.sleep)).start()
        self.output = io.StringIO()
        self.redirect = contextlib.redirect_stdout(self.output)
        self.redirect.__enter__()
        self.addCleanup(self.redirect.__exit__, None, None, None)

    def sleep(self, seconds):
        self.github.clock += max(seconds, 60)

    def update_state(self, ctx, **updates):
        self.github.state.update(copy.deepcopy(updates))
        return self.github.state

    def configure(self):
        return policy.configure_settings(self.ctx, self.gate)

    def proof(self):
        policy.verify_protection(self.ctx, self.gate, self.configure())

    def test_creates_bound_protection_and_environments_without_paid_fields(self):
        self.configure()
        protection = self.github.protection
        self.assertTrue(protection['enforce_admins']['enabled'])
        self.assertTrue(protection['required_status_checks']['strict'])
        self.assertEqual(protection['required_status_checks']['checks'], [{'context': 'CI gate', 'app_id': 77}])
        self.assertEqual(protection['required_pull_request_reviews']['required_approving_review_count'], 0)
        self.assertFalse(protection['allow_force_pushes']['enabled'])
        self.assertFalse(protection['allow_deletions']['enabled'])
        for method, path, body in self.github.writes:
            if path.startswith('/environments/') and method == 'PUT':
                self.assertEqual(set(body), {'deployment_branch_policy'})
                self.assertNotIn('reviewers', body)
                self.assertNotIn('wait_timer', body)
        self.assertEqual(self.github.state['github_policy_settings']['state'], 'verified')

    def test_source_or_attempt_race_cannot_authorize_protection_write(self):
        for field, value in (('source_sha', 'e' * 40), ('run_attempt', 2), ('app_id', 900)):
            with self.subTest(field=field), patch.object(policy, 'initial_gate', return_value={**self.gate, field: value}):
                with self.assertRaisesRegex(policy.InitError, 'changed during policy setup'):
                    self.configure()
                self.assertEqual(self.github.writes, [])

    def test_environment_strengthening_during_ci_recheck_is_not_overwritten(self):
        count = 0
        def recheck(ctx):
            nonlocal count
            count += 1
            if count == 2:
                self.github.environments['staging'] = {'protection_rules': [{'type': 'required_reviewers'}],
                    'deployment_branch_policy': None, 'policies': []}
            return self.gate
        with patch.object(policy, 'initial_gate', side_effect=recheck):
            with self.assertRaisesRegex(policy.InitError, 'reviewer/wait|changed during CI recheck'):
                self.configure()
        self.assertFalse(any(path == '/environments/staging' and method == 'PUT'
                             for method, path, body in self.github.writes))
        self.assertEqual(self.github.environments['staging']['protection_rules'], [{'type': 'required_reviewers'}])

    def test_changed_policy_invalidates_complete_and_interrupted_proofs(self):
        self.proof()
        self.github.protection['required_status_checks']['checks'].append({'context': 'Security', 'app_id': 91})
        with self.assertRaisesRegex(policy.InitError, 'policy changed since this probe began'):
            self.proof()
        self.github.protection['required_status_checks']['checks'].pop()
        self.github.rules = [{'type': 'required_linear_history', 'parameters': {}}]
        with self.assertRaisesRegex(policy.InitError, 'policy changed since this probe began'):
            self.proof()
        self.assertEqual(len(self.github.pulls), 1)

    def test_changed_policy_after_interrupted_cleanup_preserves_branch(self):
        self.github.foreign_push_at_delete = True
        with self.assertRaises(policy.InitError):
            self.proof()
        probe = self.github.state['github_policy_probe']
        self.github.refs[probe['branch']] = probe['corrected_sha']
        self.github.foreign_push_at_delete = False
        self.github.rules = [{'type': 'required_linear_history', 'parameters': {}}]
        with self.assertRaisesRegex(policy.InitError, 'policy changed since this probe began'):
            self.proof()
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'closing')
        self.assertIn(probe['branch'], self.github.refs)

    def test_repeat_is_idempotent(self):
        self.configure()
        self.github.writes.clear()
        self.configure()
        self.assertEqual(self.github.writes, [])

    def test_preserves_stronger_reviews_extra_checks_signatures_and_patterns(self):
        self.configure()
        self.github.protection['required_pull_request_reviews'].update(
            required_approving_review_count=2, require_code_owner_reviews=True, require_last_push_approval=True)
        self.github.protection['required_signatures'] = {'enabled': True}
        self.github.protection['required_conversation_resolution'] = {'enabled': True}
        self.github.protection['required_status_checks']['checks'].append({'context': 'Security', 'app_id': 91})
        self.github.environments['staging']['policies'].append({'id': 9, 'name': 'release/*', 'type': 'branch'})
        result = self.configure()
        self.assertTrue(policy.proof_conflict(result))
        self.assertEqual(self.github.protection['required_pull_request_reviews']['required_approving_review_count'], 2)
        self.assertTrue(self.github.protection['required_signatures']['enabled'])
        self.assertIn({'context': 'Security', 'app_id': 91}, self.github.protection['required_status_checks']['checks'])
        self.assertIn({'id': 9, 'name': 'release/*', 'type': 'branch'}, self.github.environments['staging']['policies'])
        with self.assertRaisesRegex(policy.InitError, 'stronger existing'):
            policy.verify_protection(self.ctx, self.gate, result)
        self.assertNotIn('github_policy_probe', self.github.state)

    def test_unrestricted_environments_remain_unrestricted(self):
        for name in ('staging', 'production'):
            self.github.environments[name] = {'protection_rules': [], 'deployment_branch_policy': None, 'policies': []}
        self.configure()
        self.assertFalse(any(path.startswith('/environments/') for _, path, _ in self.github.writes))

    def test_preflight_conflicts_do_not_write(self):
        for kind in ('wait_timer', 'required_reviewers', 'custom_deployment_protection_rule'):
            with self.subTest(kind=kind):
                self.github.environments['production'] = {'protection_rules': [{'type': kind}], 'policies': [], 'deployment_branch_policy': None}
                with self.assertRaises(policy.InitError):
                    self.configure()
                self.assertEqual(self.github.writes, [])
        self.github.environments = {}
        self.github.rules = [{'type': 'future_rule'}]
        with self.assertRaisesRegex(policy.InitError, 'Unsupported effective'):
            self.configure()
        self.assertEqual(self.github.writes, [])

    def test_existing_protected_branch_environment_is_not_rewritten(self):
        self.github.environments['staging'] = {'protection_rules': [], 'policies': [],
            'deployment_branch_policy': {'protected_branches': True, 'custom_branch_policies': False}}
        with self.assertRaisesRegex(policy.InitError, 'protected-branch-only'):
            self.configure()
        self.assertEqual(self.github.writes, [])

    def test_private_plan_and_auth_errors_are_not_treated_as_absence(self):
        for status in (403, 404, 422):
            with self.subTest(status=status):
                self.github.fail = ('GET', '/branches/main/protection', status)
                with self.assertRaises(policy.InitError) as raised:
                    self.configure()
                self.assertNotIn('private token', str(raised.exception))
                self.assertEqual(self.github.writes, [])

    def test_unsupported_and_conflicting_context_policy_is_preserved(self):
        for current in ({'unrecognized_policy': True}, {'required_status_checks': {'checks': [{'context': 'CI gate', 'app_id': 900}]}}):
            with self.subTest(current=current):
                self.github.protection = current
                with self.assertRaises(policy.InitError):
                    self.configure()
                self.assertEqual(self.github.writes, [])

    def test_missing_gate_readback_fails(self):
        self.github.drop_gate = True
        with self.assertRaisesRegex(policy.InitError, 'read-back'):
            self.configure()
        self.assertEqual(self.github.state['github_policy_settings']['state'], 'applying')

    def test_uncertain_environment_creation_resumes_without_duplicates(self):
        self.github.uncertain = ('PUT', '/environments/staging')
        with self.assertRaises(policy.InitError):
            self.configure()
        self.configure()
        self.assertEqual(sum(path == '/environments/staging' and method == 'PUT' for method, path, _ in self.github.writes), 1)
        self.assertEqual(len(self.github.environments['staging']['policies']), 1)

    def test_gate_source_suite_head_and_app_are_checked(self):
        workflow = {'head_sha': self.github.base, 'check_suite_id': 99}
        job = {'check_run_url': 'https://api.github.com/repos/' + self.github.repo + '/check-runs/101'}
        self.assertEqual(policy.source_app(self.ctx, workflow, job), 77)
        for change in ({'check_suite': {'id': 100}}, {'head_sha': 'f' * 40}, {'app': {'id': 77, 'slug': 'foreign'}},
                       {'conclusion': 'failure'}, {'name': 'Other'}, {'id': 102}):
            self.github.check_change = change
            with self.subTest(change=change), self.assertRaises(policy.InitError):
                policy.source_app(self.ctx, workflow, job)
        self.assertFalse(self.github.writes)

    def test_other_repository_check_run_url_is_rejected(self):
        with self.assertRaises(policy.InitError):
            policy.source_app(self.ctx, {'head_sha': self.github.base, 'check_suite_id': 99},
                {'check_run_url': 'https://api.github.com/repos/other/project/check-runs/101'})
        self.assertFalse(self.github.calls)

    def test_genuine_failed_blocked_then_green_clean_proof_never_merges(self):
        self.proof()
        probe = self.github.state['github_policy_probe']
        self.assertEqual(probe['phase'], 'complete')
        self.assertEqual(probe['blocked']['merge_state'], 'BLOCKED')
        self.assertEqual(probe['green']['merge_state'], 'CLEAN')
        self.assertEqual(probe['green']['approvals'], 0)
        self.assertEqual(self.github.refs, {'main': self.github.base})
        self.assertEqual(self.github.pulls[probe['pr_number']]['state'], 'closed')
        self.assertTrue(all('/merge' not in path for _, path, _ in self.github.writes))
        self.assertTrue(all(pull['merged_at'] is None for pull in self.github.pulls.values()))
        policy.verify_protection(self.ctx, self.gate, self.configure())
        self.assertEqual(len(self.github.pulls), 1)

    def test_uncertain_pr_creation_reconciles_owned_pr(self):
        self.github.uncertain = ('POST', '/pulls')
        with self.assertRaises(policy.InitError):
            self.proof()
        self.assertEqual(len(self.github.pulls), 1)
        self.proof()
        self.assertEqual(len(self.github.pulls), 1)
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'complete')

    def test_interrupted_branch_delete_resumes_closing_phase(self):
        settings = self.configure()
        original = self.github.command
        def command(argv, **kwargs):
            if argv[2] == 'graphql' and 'updateRefs' in json.loads(kwargs.get('input') or '{}').get('query', ''):
                original(argv, **kwargs)
                raise KeyboardInterrupt
            return original(argv, **kwargs)
        with patch.object(policy, 'run', side_effect=command), self.assertRaises(KeyboardInterrupt):
            policy.verify_protection(self.ctx, self.gate, settings)
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'closing')
        policy.verify_protection(self.ctx, self.gate, settings)
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'complete')
        self.assertEqual(len(self.github.pulls), 1)

    def test_atomic_delete_rejects_last_moment_foreign_push(self):
        self.github.foreign_push_at_delete = True
        with self.assertRaisesRegex(policy.InitError, 'Atomic protection branch cleanup'):
            self.proof()
        probe = self.github.state['github_policy_probe']
        self.assertEqual(probe['phase'], 'closing')
        self.assertEqual(self.github.refs[probe['branch']], 'f' * 40)
        self.assertNotEqual(self.github.state['github_policy_probe']['phase'], 'complete')

    def test_uncertain_atomic_delete_resumes_without_recreating_branch(self):
        self.github.uncertain_delete = True
        with self.assertRaises(policy.InitError):
            self.proof()
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'closing')
        self.assertEqual(self.github.refs, {'main': self.github.base})
        self.proof()
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'complete')
        self.assertEqual(len(self.github.pulls), 1)

    def test_rerun_while_graphql_computes_mergeability_invalidates_proof(self):
        self.github.rerun_during_graphql = 'failing'
        with self.assertRaisesRegex(policy.InitError, 'attempt changed before recording proof'):
            self.proof()
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'failing')
        self.assertNotIn('blocked', self.github.state['github_policy_probe'])

    def test_corrected_rerun_during_mergeability_cannot_be_journaled_green(self):
        self.github.rerun_during_graphql = 'corrected'
        with self.assertRaisesRegex(policy.InitError, 'attempt changed before recording proof'):
            self.proof()
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'corrected')
        self.assertNotIn('green', self.github.state['github_policy_probe'])

    def assert_environment_change_during_proof_is_rejected(self, *, delete_environment):
        settings = self.configure()
        original = self.github.respond
        changed_at = None
        def respond(method, path, body):
            nonlocal changed_at
            result = original(method, path, body)
            if (path == 'graphql' and 'updateRefs' not in body['query']
                    and not self.github.probe_failure_gate and changed_at is None):
                if delete_environment:
                    del self.github.environments['production']
                else:
                    self.github.environments['production']['policies'].clear()
                changed_at = len(self.github.writes)
            return result
        with patch.object(self.github, 'respond', side_effect=respond):
            with self.assertRaisesRegex(policy.InitError, 'production environment or selected release branch policy changed'):
                policy.verify_protection(self.ctx, self.gate, settings)
        probe = self.github.state['github_policy_probe']
        self.assertEqual(probe['phase'], 'green')
        self.assertIn(probe['branch'], self.github.refs)
        self.assertEqual(self.github.pulls[probe['pr_number']]['state'], 'open')
        self.assertIsNotNone(changed_at)
        self.assertFalse(any(path.startswith('/environments/')
                             for method, path, body in self.github.writes[changed_at:]))
        self.assertNotEqual(self.github.state['github_policy_probe']['phase'], 'complete')

    def test_environment_deleted_during_green_proof_is_not_recreated_or_accepted(self):
        self.assert_environment_change_during_proof_is_rejected(delete_environment=True)

    def test_release_policy_removed_during_green_proof_is_not_repaired_or_accepted(self):
        self.assert_environment_change_during_proof_is_rejected(delete_environment=False)

    def test_rerun_attempt_change_is_not_accepted(self):
        self.github.run_attempt_change = True
        with self.assertRaisesRegex(policy.InitError, 'identity changed'):
            self.proof()
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'failing')
        self.assertTrue(any(branch != 'main' for branch in self.github.refs))

    def test_unstable_corrected_run_is_not_green_proof(self):
        original = self.github.respond
        def respond(method, path, body):
            if path == 'graphql' and not self.github.probe_failure_gate:
                self.github.merge_state = 'UNSTABLE'
            return original(method, path, body)
        with patch.object(self.github, 'respond', side_effect=respond), self.assertRaisesRegex(policy.InitError, 'not mergeable'):
            self.proof()
        self.assertEqual(self.github.state['github_policy_probe']['phase'], 'corrected')
        self.assertTrue(all(pull['state'] == 'open' for pull in self.github.pulls.values()))

    def test_foreign_branch_change_is_not_deleted(self):
        self.github.uncertain = ('POST', '/git/refs')
        with self.assertRaises(policy.InitError):
            self.proof()
        self.github.foreign_commit = True
        with self.assertRaisesRegex(policy.InitError, 'unowned'):
            self.proof()
        self.assertFalse(any(method == 'DELETE' for method, _, _ in self.github.writes))

    def test_receipt_origin_or_identity_failure_performs_zero_writes(self):
        for stage in ('context', 'verify_github'):
            with self.subTest(stage=stage), patch.object(policy, 'context', return_value=self.ctx), \
                    patch.object(policy, 'verify_github', return_value={}), \
                    patch.object(policy, stage, side_effect=policy.InitError('Identity verification failed')):
                with self.assertRaises(policy.InitError):
                    policy.configure(SimpleNamespace(verify_protection=True))
                self.assertEqual(self.github.writes, [])

    def test_settings_only_is_explicitly_incomplete_and_resume_includes_env(self):
        with patch.object(policy, 'context', return_value=self.ctx), \
                patch.object(policy, 'verify_github'), patch.object(policy, 'initial_gate', return_value=self.gate):
            policy.configure(SimpleNamespace(verify_protection=False))
        self.assertNotIn('github_policy_probe', self.github.state)
        self.assertIn('enforcement proof is incomplete', self.output.getvalue())
        self.github.fail = ('GET', '/branches/main/protection', 403)
        with patch.object(policy, 'context', return_value=self.ctx), \
                patch.object(policy, 'verify_github'), patch.object(policy, 'initial_gate', return_value=self.gate):
            with self.assertRaisesRegex(policy.InitError, '--env .*values.env --verify-protection'):
                policy.configure(SimpleNamespace(verify_protection=True))

    def test_help_has_no_remote_effect(self):
        result = subprocess.run([sys.executable, '-B', str(SCRIPTS / '12_2_configure_github_policy.py'), '--help'],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('--verify-protection', result.stdout)
        self.assertFalse(self.github.calls)


if __name__ == '__main__':
    unittest.main()
