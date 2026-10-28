"""Deletion contracts: immutable identity, uncertain outcomes and protected neighbors."""
from contextlib import ExitStack
from types import SimpleNamespace
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

SOURCE = Path(__file__).resolve().parents[3] / 'docs/project-deletion/scripts'
sys.path.insert(0, str(SOURCE))
import _state as state
import _github as github
import _dns as dns
import _host as host
import _deletion as deletion
import _completion as completion


def identity():
    return {'repository': 'example-org/sample-app', 'repository_id': 101, 'slug': 'sample-app', 'org': 'example-org',
            'maintainer': 'operator', 'operator_ssh': 'root@192.0.2.10', 'operator_ipv4': '192.0.2.10',
            'ci_source': '/root/web-app-starter', 'source_sha': 'a' * 40,
            'hostnames': {'staging': 'sample-staging.example.com', 'production': 'sample.example.com'},
            'ports': {'staging': {'frontend': 18280, 'backend': 18281}, 'production': {'frontend': 18380, 'backend': 18381}},
            'dns_zone': 'example.com', 'dns_zone_id': '5', 'dns_project_id': '6',
            'env_sha256': 'b' * 64, 'archive_sha256': 'c' * 64,
            'workflow_ids': {'staging': 201, 'production': 202}, 'app_installation_id': 301, 'app_id': 302}


def selected():
    return {'schema_version': 1, 'identity': identity(), 'host': {'identity': {'machine_id_sha256': 'd' * 64},
            'tool': {'source_sha': 'e' * 40}, 'docker': {'preserved_containers': ['neighbor']},
            'ci': {'projects': {'sample-app': {'repository': 'example-org/sample-app'}, 'neighbor': {'repository': 'example-org/neighbor'}},
                   'preserved_settings_sha256': 'f' * 64},
            'units': {'web-app-ci-controller.service': {'UnitFileState': 'enabled'}}},
            'github': {'packages': [{'name': 'sample-app-frontend', 'id': 401}], 'app_repositories': [101, 102],
                       'preserved_repositories': [102], 'actions': {'enabled': True, 'allowed_actions': 'all'}},
            'dns': [], 'extras': [], 'policy': 'purge-host-and-github-preserve-local', 'tool': {}}


class IdentityTests(unittest.TestCase):
    def test_exact_numeric_consumer_identity(self):
        self.assertEqual(state.identity(identity())['repository_id'], 101)
        for replacement in (0, -1, True, '101'):
            value = identity()
            value['repository_id'] = replacement
            with self.subTest(replacement=replacement), self.assertRaises(state.Error):
                state.identity(value)

    def test_template_and_slug_mismatch_rejected(self):
        for repository, slug, org in [('vireocodedev/web-app-starter', 'web-app-starter', 'vireocodedev'),
                                      ('example-org/foreign-app', 'sample-app', 'example-org')]:
            value = identity()
            value.update(repository=repository, slug=slug, org=org)
            with self.assertRaises(state.Error):
                state.identity(value)

    def test_duplicate_json_fields_rejected(self):
        with self.assertRaises(state.Error):
            json.loads('{"id":1,"id":2}', object_pairs_hook=state.unique)

    def test_exact_plan_hash_required(self):
        plan = selected()
        with mock.patch.object(state, 'read', return_value=plan):
            self.assertEqual(state.plan(Path('/private'), state.digest(plan)), plan)
            with self.assertRaises(state.Error):
                state.plan(Path('/private'), '0' * 64)
            plan['unexpected'] = True
            with self.assertRaises(state.Error):
                state.plan(Path('/private'), state.digest(plan))

    def test_help_is_inert_without_input_or_authentication(self):
        for script in sorted(SOURCE.glob('[0-9]*.py')):
            with self.subTest(script=script.name):
                result = subprocess.run([sys.executable, '-B', str(script), '--help'], capture_output=True, timeout=15,
                                        env={'PATH': os.environ['PATH'], 'HOME': '/nonexistent'})
                self.assertEqual(result.returncode, 0, result.stderr.decode())
                self.assertIn(b'--env', result.stdout)

    def test_identity_not_repeated_in_deletion_reference(self):
        example = (SOURCE.parent / '.env.example').read_text()
        keys = {line.split('=', 1)[0] for line in example.splitlines() if line and not line.startswith('#')}
        self.assertEqual(keys, {'STATE_DIRECTORY', 'INITIALIZATION_SNAPSHOT'})


class HistoricalImportTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.root.chmod(0o700)
        self.initial = self.root / 'initialization'
        self.initial.mkdir(mode=0o700)
        self.env = self.initial / 'values.env'
        self.env.write_text('historical literal values')
        self.env.chmod(0o600)
        original = identity()
        self.env_hash = hashlib.sha256(self.env.read_bytes()).hexdigest()
        self.values = {'REPOSITORY': original['repository'], 'PROJECT_SLUG': original['slug'], 'GH_ORG': original['org'],
            'MAINTAINER_LOGIN': original['maintainer'], 'OPERATOR_SSH': original['operator_ssh'],
            'OPERATOR_IPV4': original['operator_ipv4'], 'CI_SOURCE': original['ci_source'],
            'DNS_ZONE': original['dns_zone'], 'DNS_ZONE_ID': original['dns_zone_id'],
            'DNS_PROJECT_ID': original['dns_project_id'], 'DNS_TOKEN_FILE': '/private/dns-token.env'}
        for environment in ('staging', 'production'):
            self.values[environment.upper() + '_HOSTNAME'] = original['hostnames'][environment]
            for component in ('frontend', 'backend'):
                self.values[environment.upper() + '_' + component.upper() + '_PORT'] = str(original['ports'][environment][component])
        pair = {'repository': original['repository'], 'source_sha': original['source_sha'],
            'frontend': 'ghcr.io/' + original['repository'] + '-frontend@sha256:' + 'f' * 64,
            'backend': 'ghcr.io/' + original['repository'] + '-backend@sha256:' + 'e' * 64}
        self.progress = {'repository': original['repository'], 'repository_id': 101, 'env_sha256': self.env_hash,
            'source_sha': original['source_sha'], 'release_source_sha': original['source_sha'],
            'staging_source_sha': original['source_sha'], 'production_source_sha': original['source_sha'],
            'staging_workflow_id': 201, 'production_workflow_id': 202,
            'staging_run_id': 401, 'production_run_id': 402, 'staging_run_attempt': 1, 'production_run_attempt': 1,
            'staging_pair': pair, 'retrieved_backup_sha256': 'd' * 64, 'restored_backup_sha256': 'd' * 64,
            'retrieved_copy_restored': True, 'ci_app_access_verified': {'app_id': 302, 'installation_id': 301},
            'backup_schedule': {'source_sha': original['source_sha'], 'runtime_sha256': 'b' * 64,
                'installation_sha256': 'c' * 64, 'runtime_config_sha256': 'd' * 64, 'retention_days': 30,
                'timer': 'web-app-backup-sample-app.timer', 'service': 'web-app-backup-sample-app.service',
                'schedule': '*-*-* 03:00:00 Europe/Zagreb', 'persistent': True, 'staging_scheduled': False,
                'next_fire': 'Thu 2026-10-29 03:00:00 CET', 'scheduled_execution_observed': False,
                'checked_at': '2026-10-28T12:00:00+00:00'}}
        acceptance = {'schema_version': 1, 'source_sha': original['source_sha'], 'environments': {}, 'manual': {
            'local_application': {'status': 'passed', 'evidence': 'Actual local login, reload and logout observed earlier; carried forward without claiming a new release-SHA check.'},
            'ide': {'status': 'not-applicable', 'evidence': 'Headless environment; terminal launch verified instead.'},
            'artwork': {'status': 'deferred', 'evidence': 'Template artwork retained pending a design decision.'}}}
        for environment in ('staging', 'production'):
            run = self.progress[environment + '_run_id']
            acceptance['environments'][environment] = {
                'deployment_receipt': {'state': 'success', 'environment': environment, 'run_id': run, 'run_attempt': 1,
                                       'pair': copy.deepcopy(pair)},
                'provisioning_receipt': {'state': 'success', 'backend': pair['backend']},
                'https': {'origin': 'https://' + self.values[environment.upper() + '_HOSTNAME'],
                          'run_id': run, 'run_attempt': 1, 'observed_at': '2026-10-28T12:05:00Z',
                          'checks': dict.fromkeys(completion.CHECKS, True)}}
        state.write(self.initial / 'progress.json', self.progress)
        progress_sha256 = hashlib.sha256((self.initial / 'progress.json').read_bytes()).hexdigest()
        self.result = {'repository': original['repository'], 'env_sha256': self.env_hash, 'scope': 'full',
            'observations': {key: copy.deepcopy(value) for key, value in self.progress.items()
                             if key not in ('repository', 'env_sha256', 'ci_app_access_verified')},
            'completion': completion.build_completion(acceptance, self.values, self.progress, progress_sha256)}
        completion.validate_completion(self.result, self.values, self.progress, progress_sha256)
        state.write(self.initial / 'result.json', self.result)
        state.write(self.initial / 'verification.json', {'scope': 'full', 'repository': original['repository'],
            'env_sha256': self.env_hash, 'verified_at': 1, 'evidence': {'github': {'repository_id': 101}}})
        self.context = SimpleNamespace(env_path=self.env, values=self.values)
        self.args = SimpleNamespace(initialization_env=self.env, env=self.root / 'deletion/values.env')

    def import_initialization(self):
        with mock.patch.object(deletion, 'load_context', return_value=self.context) as load_context, \
                mock.patch('builtins.print'):
            deletion.import_initialization(self.args)
        return load_context

    def load_snapshot(self):
        def context(args, **kwargs):
            self.assertFalse(kwargs['require_verified'])
            return SimpleNamespace(env_path=args.env, values=self.values)
        with mock.patch.object(state, 'load_context', side_effect=context):
            return state.load(self.args)

    def test_expired_initialization_receipt_is_historical_not_a_new_preflight(self):
        load_context = self.import_initialization()
        load_context.assert_called_once()
        self.assertFalse(load_context.call_args.kwargs['require_verified'])
        self.assertTrue((self.root / 'deletion/snapshot.json').exists())
        self.assertEqual((self.root / 'deletion/initialization/values.env').read_bytes(), self.env.read_bytes())
        reference = self.args.env.read_text()
        self.assertNotIn('PROJECT_SLUG', reference)
        self.assertNotIn('REPOSITORY', reference)
        directory, snapshot = self.load_snapshot()
        self.assertEqual(directory, self.root / 'deletion')
        self.assertEqual(snapshot['identity']['repository_id'], 101)

    def test_partial_result_is_rejected_before_creating_any_deletion_files(self):
        self.result.pop('completion')
        state.write(self.initial / 'result.json', self.result)
        with self.assertRaises(state.Error):
            self.import_initialization()
        self.assertFalse(self.args.env.parent.exists())

    def test_explicit_ide_waiver_remains_valid_on_import_and_snapshot_load(self):
        waived = {'status': 'waived', 'evidence': 'Developer explicitly waived VS Code debugger acceptance.',
                  'user_authorized': True}
        self.result['completion']['acceptance']['manual']['ide'] = waived
        state.write(self.initial / 'result.json', self.result)
        self.import_initialization()
        directory, snapshot = self.load_snapshot()
        archived = state.read(directory / 'initialization/result.json')
        self.assertEqual(archived['completion']['acceptance']['manual']['ide'], waived)
        self.assertEqual(snapshot['identity']['repository_id'], 101)

    def test_ide_waiver_without_user_authorization_cannot_authorize_deletion(self):
        self.result['completion']['acceptance']['manual']['ide'] = {
            'status': 'waived', 'evidence': 'Debugger acceptance was omitted.'}
        state.write(self.initial / 'result.json', self.result)
        with self.assertRaises(state.Error):
            self.import_initialization()
        self.assertFalse(self.args.env.parent.exists())

    def test_invalid_complete_acceptance_is_rejected_before_any_writes(self):
        self.result['completion']['acceptance']['environments']['production']['https']['checks']['login'] = False
        state.write(self.initial / 'result.json', self.result)
        with self.assertRaises(state.Error):
            self.import_initialization()
        self.assertFalse(self.args.env.parent.exists())

    def test_progress_changed_after_completion_cannot_be_imported(self):
        self.progress['later_observation'] = 'changed'
        state.write(self.initial / 'progress.json', self.progress)
        with self.assertRaises(state.Error):
            self.import_initialization()
        self.assertFalse(self.args.env.parent.exists())

    def test_each_load_rejects_changed_archive_bytes(self):
        self.import_initialization()
        archived = self.args.env.parent / 'initialization/progress.json'
        archived.write_bytes(archived.read_bytes() + b'\n')
        with self.assertRaises(state.Error):
            self.load_snapshot()

    def reseal_archive_manifest(self, name):
        directory = self.args.env.parent
        snapshot = state.read(directory / 'snapshot.json')
        snapshot['archives'][name] = hashlib.sha256((directory / 'initialization' / name).read_bytes()).hexdigest()
        snapshot['identity']['archive_sha256'] = state.digest(snapshot['archives'])
        state.write(directory / 'snapshot.json', snapshot)

    def test_each_load_revalidates_completion_despite_resealed_progress_manifest(self):
        self.import_initialization()
        archived = self.args.env.parent / 'initialization/progress.json'
        value = state.read(archived)
        value['later_observation'] = 'changed'
        state.write(archived, value)
        self.reseal_archive_manifest('progress.json')
        with self.assertRaises(state.Error):
            self.load_snapshot()

    def test_each_load_revalidates_acceptance_despite_resealed_result_manifest(self):
        self.import_initialization()
        archived = self.args.env.parent / 'initialization/result.json'
        value = state.read(archived)
        value['completion']['state'] = 'partial'
        state.write(archived, value)
        self.reseal_archive_manifest('result.json')
        with self.assertRaises(state.Error):
            self.load_snapshot()


class JournalTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name)
        self.path.chmod(0o700)
        self.addCleanup(self.directory.cleanup)

    def test_lost_delete_response_reconciles_without_second_delete(self):
        exists = [True]
        def uncertain():
            exists[0] = False
            raise state.Error('lost response')
        with self.assertRaises(state.Error):
            state.operation(self.path, selected(), 'delete', {'id': 1}, uncertain, lambda: not exists[0])
        called = mock.Mock()
        state.operation(self.path, selected(), 'delete', {'id': 1}, called, lambda: not exists[0])
        called.assert_not_called()
        self.assertEqual(state.read(self.path / 'journal.json')['operations']['delete']['phase'], 'verified')

    def test_changed_journal_plan_or_target_rejected(self):
        state.operation(self.path, selected(), 'delete', {'id': 1}, lambda: None, lambda: True)
        with self.assertRaises(state.Error):
            state.operation(self.path, selected(), 'delete', {'id': 2}, lambda: None, lambda: True)
        changed = selected()
        changed['identity']['repository_id'] = 999
        with self.assertRaises(state.Error):
            state.operation(self.path, changed, 'delete', {'id': 1}, lambda: None, lambda: True)

    def test_verified_target_reappearance_is_not_deleted(self):
        state.operation(self.path, selected(), 'delete', {'id': 1}, lambda: None, lambda: True)
        remove = mock.Mock()
        with self.assertRaises(state.Error):
            state.operation(self.path, selected(), 'delete', {'id': 1}, remove, lambda: False)
        remove.assert_not_called()

    def test_symlink_state_and_concurrent_lock_rejected(self):
        target = self.path / 'target.json'
        state.write(target, {'a': 1})
        link = self.path / 'link.json'
        link.symlink_to(target)
        with self.assertRaises(state.Error):
            state.write(link, {'b': 2})
        with state.locked(self.path):
            with self.assertRaises(state.Error):
                with state.locked(self.path):
                    self.fail('concurrent operation entered')

    def test_no_receipt_when_absence_cannot_be_verified(self):
        with self.assertRaises(state.Error):
            state.operation(self.path, selected(), 'delete', {'id': 1}, lambda: None, lambda: False)
        self.assertEqual(state.read(self.path / 'journal.json')['operations']['delete']['phase'], 'started')


class GitHubTests(unittest.TestCase):
    def test_same_name_new_repository_id_never_adopted(self):
        with mock.patch.object(github, 'repositories', return_value=[{'id': 999, 'full_name': identity()['repository']}]), mock.patch.object(github, 'get') as get:
            with self.assertRaises(state.Error):
                github.repository(identity(), allow_absent=True)
            get.assert_not_called()

    def test_inaccessible_inventory_is_not_absence(self):
        with mock.patch.object(github, 'api', return_value=(404, None, '')):
            with self.assertRaises(state.Error):
                github.repositories(identity())

    def test_package_linked_to_foreign_repo_is_preserved(self):
        with mock.patch.object(github, 'packages', return_value=[{'name': 'sample-app-frontend', 'id': 401}]), mock.patch.object(github, 'get', return_value={
            'id': 401, 'name': 'sample-app-frontend', 'visibility': 'private', 'package_type': 'container', 'repository': {'id': 999}}):
            with self.assertRaises(state.Error):
                github.package(identity(), 'sample-app-frontend')

    def test_replaced_package_id_is_preserved(self):
        with mock.patch.object(github, 'packages', return_value=[{'name': 'sample-app-frontend', 'id': 999}]), mock.patch.object(github, 'get', return_value={
            'id': 999, 'name': 'sample-app-frontend', 'visibility': 'private', 'package_type': 'container', 'repository': {'id': 101}}):
            with self.assertRaises(state.Error):
                github.package(identity(), 'sample-app-frontend', expected=401)

    def test_actions_disable_sends_only_enabled_and_resume_reuses_verified_journal(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            directory.chmod(0o700)
            plan = selected()
            plan['github']['actions'] = {'enabled': True, 'allowed_actions': 'selected',
                'selected_actions_url': 'https://api.github.com/repos/example-org/sample-app/actions/permissions/selected-actions',
                'sha_pinning_required': False}
            current = dict(plan['github']['actions'])
            original_run = subprocess.run
            def disable(argv, **options):
                if argv[0] != 'gh':
                    return original_run(argv, **options)  # Keep real private-path Git boundary checks.
                self.assertEqual(argv, ['gh', 'api', '--hostname', 'github.com', '--method', 'PUT',
                    'repos/example-org/sample-app/actions/permissions', '--input', '-'])
                self.assertEqual(json.loads(options['input']), {'enabled': False})
                current['enabled'] = False
                return SimpleNamespace(returncode=0)
            with mock.patch.object(github, 'authority'), mock.patch.object(github, 'repository'), \
                 mock.patch.object(github, 'inactive', return_value=[]), \
                 mock.patch.object(github, 'get', side_effect=lambda path: dict(current)), \
                 mock.patch.object(github.subprocess, 'run', side_effect=disable) as request:
                github.quiesce(directory, plan)
                github.quiesce(directory, plan)
            self.assertEqual(len([call for call in request.call_args_list if call.args[0][0] == 'gh']), 1)
            self.assertEqual(state.read(directory / 'journal.json')['operations']['github-actions-disabled']['phase'], 'verified')

    def test_already_disabled_actions_require_no_mutation(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            directory.chmod(0o700)
            current = {'enabled': False, 'allowed_actions': 'selected', 'sha_pinning_required': False}
            original_run = subprocess.run
            def private_path_checks(argv, **options):
                self.assertNotEqual(argv[0], 'gh', 'Already-disabled Actions must not submit a GitHub request')
                return original_run(argv, **options)
            with mock.patch.object(github, 'authority'), mock.patch.object(github, 'repository'), \
                 mock.patch.object(github, 'inactive', return_value=[]), \
                 mock.patch.object(github, 'get', return_value=current), \
                 mock.patch.object(github.subprocess, 'run', side_effect=private_path_checks) as request:
                github.quiesce(directory, selected())
            self.assertFalse(any(call.args[0][0] == 'gh' for call in request.call_args_list))
            self.assertEqual(state.read(directory / 'journal.json')['operations']['github-actions-disabled']['phase'], 'verified')

    def test_active_deployments_are_never_cancelled(self):
        run = {'id': 701, 'repository': {'id': 101}, 'path': '.github/workflows/deploy-staging.yaml'}
        with mock.patch.object(github, 'authority'), mock.patch.object(github, 'repository'), \
             mock.patch.object(github, 'inactive', return_value=[run]), \
             mock.patch.object(github, 'operation'), \
             mock.patch.object(github, 'get', return_value={'status': 'in_progress'}), \
             mock.patch('time.sleep'), mock.patch.object(github, 'api') as api:
            with self.assertRaises(state.Error):
                github.quiesce(Path('/private'), selected())
            api.assert_not_called()

    def test_repository_delete_is_journaled_after_exact_id_readback(self):
        with mock.patch.object(github, 'authority'), mock.patch.object(github, 'repository', side_effect=[{'id': 101}, {'id': 101}]), \
             mock.patch.object(github, 'api') as api, mock.patch.object(github, 'operation') as operation, \
             mock.patch.object(github, 'verify_resources_absent', return_value=True):
            github.remove_repository(Path('/private'), selected(), mock.Mock())
            args = operation.call_args.args
            self.assertEqual(args[2:4], ('repository', 101))
            args[4]()
            api.assert_called_once_with('repos/example-org/sample-app', 'DELETE')

    def test_final_app_selection_blocks_planning_before_any_mutation(self):
        with mock.patch.object(github, 'authority'), mock.patch.object(github, 'repository'), \
             mock.patch.object(github, 'selections', return_value=[101]), \
             mock.patch.object(github, 'operation') as operation, mock.patch.object(github, 'api') as api:
            with self.assertRaisesRegex(state.Error, 'planning stopped before teardown'):
                github.inspect(identity(), mock.Mock())
            operation.assert_not_called()
            api.assert_not_called()


class HostSafetyTests(unittest.TestCase):
    def test_foreign_or_template_extra_paths_rejected(self):
        for path in ('/root/web-app-starter', '/etc/web-app-ci', '/root/neighbor-task', '/root/sample-app-task/../neighbor'):
            extra = {'path': path, 'kind': 'task-artifact', 'evidence_sha256': 'a' * 64, 'fingerprint': None}
            with self.subTest(path=path), self.assertRaises(state.Error):
                host.extra_paths(identity(), [extra])

    def test_wildcard_or_shared_certificate_preserved(self):
        extra = {'path': '/var/lib/caddy/.local/share/caddy/certificates/acme/sample.example.com',
                 'kind': 'dedicated-tls', 'evidence_sha256': 'a' * 64, 'fingerprint': None}
        with mock.patch.object(Path, 'exists', return_value=True), mock.patch.object(Path, 'lstat', return_value=mock.Mock(st_uid=999)), \
             mock.patch.object(host, 'command', return_value='X509v3 Subject Alternative Name:\n DNS:*.example.com, DNS:sample.example.com'):
            with self.assertRaises(state.Error):
                host.extra_paths(identity(), [extra])

    def test_changed_host_or_tool_rejected(self):
        with mock.patch.object(host, 'host_identity', return_value={'machine_id_sha256': 'wrong'}), \
             mock.patch.object(host, 'canonical', return_value=selected()['host']['tool']):
            with self.assertRaises(state.Error):
                host.check_plan(selected())

    def test_environment_busy_prevents_controller_stop(self):
        plan = selected()
        plan['host']['files'] = []
        current = {'files': [], 'docker': plan['host']['docker'], 'ci': plan['host']['ci']}
        with mock.patch.object(host, 'configuration'), mock.patch.object(host, 'inspect', return_value=current), \
             mock.patch.object(host, 'operation') as operation, \
             mock.patch.object(host, 'environment_locks', side_effect=state.Error('busy')), mock.patch.object(host, 'command') as command:
            with self.assertRaises(state.Error):
                host.quiesce(Path('/private'), plan)
            self.assertEqual(operation.call_count, 1)
            self.assertIn('.timer', operation.call_args.args[2])
            command.assert_not_called()

    def test_environment_locks_precede_stopping_mutating_services(self):
        plan = selected()
        plan['host']['files'] = []
        current = {'files': [], 'docker': plan['host']['docker'], 'ci': plan['host']['ci']}
        sequence = []
        def op(*args):
            sequence.append(args[2])
        with mock.patch.object(host, 'configuration'), mock.patch.object(host, 'inspect', return_value=current), \
             mock.patch.object(host, 'operation', side_effect=op), \
             mock.patch.object(host, 'environment_locks', side_effect=lambda *_: sequence.append('environment-locks')), \
             mock.patch.object(host, 'settled'), mock.patch.object(host, 'take_lock', side_effect=lambda *_: sequence.append('controller-lock')), \
             mock.patch.object(host, 'write'):
            host.quiesce(Path('/private'), plan)
        self.assertEqual(sequence, ['stop-web-app-backup-sample-app.timer', 'environment-locks',
                                   'stop-web-app-deploy-sample-app.service', 'stop-web-app-backup-sample-app.service', 'controller-lock'])

    def test_changed_path_inode_prevents_recursive_delete(self):
        target = {'path': '/root/sample-app-task', 'entries': [{'path': '.', 'inode': 1}], 'owner': 0}
        changed = dict(target, entries=[{'path': '.', 'inode': 2}])
        with mock.patch.object(host, 'metadata', return_value=changed), mock.patch.object(host, 'operation') as operation, \
             mock.patch.object(host.shutil, 'rmtree') as remove:
            host.remove_path(Path('/private'), selected(), target)
            with self.assertRaises(state.Error):
                operation.call_args.args[4]()
            remove.assert_not_called()

    def test_partial_directory_delete_only_accepts_original_inode_subset(self):
        target = {'path': '/root/sample-app-task', 'entries': [{'path': '.', 'inode': 1}, {'path': 'old', 'inode': 2}], 'owner': 0}
        partial = dict(target, entries=[{'path': '.', 'inode': 1}])
        with mock.patch.object(host, 'metadata', return_value=partial), mock.patch.object(host, 'operation') as operation, \
             mock.patch.object(Path, 'is_dir', return_value=True), mock.patch.object(host.shutil, 'rmtree') as remove, mock.patch.object(host, 'sync_dir'):
            remove.avoids_symlink_attacks = True
            host.remove_path(Path('/private'), selected(), target)
            operation.call_args.args[4]()
            remove.assert_called_once_with(Path(target['path']))

    def test_dedicated_tls_and_orphan_keys_require_explicit_manifest(self):
        with mock.patch.object(Path, 'glob', side_effect=lambda pattern: iter([Path('/root/.ssh/sample-app-readonly')]) if pattern == 'sample-app*' else iter([])), \
             mock.patch.object(Path, 'exists', return_value=False):
            with self.assertRaises(state.Error):
                host.unknown_paths(identity(), [])

    def test_cleanup_lost_response_does_not_recreate_context(self):
        request = {'schema_version': 1, 'action': 'cleanup-context', 'identity': identity(), 'extras': [], 'plan': selected()}
        with mock.patch.object(host, 'canonical'), mock.patch.object(host, 'check_plan'), \
             mock.patch.object(host, 'ROOT', Path('/root/web-app-starter')), \
             mock.patch.object(Path, 'exists', return_value=False), mock.patch.object(Path, 'is_symlink', return_value=False), \
             mock.patch.object(host, 'verify_host'), mock.patch.object(host, 'context') as context:
            self.assertTrue(host.dispatch(request)['context_absent'])
            context.assert_not_called()


class DockerBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.container = {'id': '1' * 64, 'name': '/sample-app-staging-postgres', 'image': 'sha256:' + '2' * 64,
            'labels': {'com.docker.compose.project': 'sample-app-staging-db', 'com.docker.compose.service': 'postgres'},
            'mounts': [{'Type': 'volume', 'Name': 'sample-app-staging-postgres',
                        'Source': '/var/lib/docker/volumes/sample-app-staging-postgres/_data', 'Destination': '/var/lib/postgresql'}],
            'networks': {'sample-app-staging-db': {}}}
        self.network = {'id': '3' * 64, 'name': 'sample-app-staging-db',
            'labels': {host.LABEL: 'sample-app-staging'}, 'containers': {self.container['id']: {}}}
        self.volume = {'name': 'sample-app-staging-postgres', 'driver': 'local',
            'labels': {host.LABEL: 'sample-app-staging'}, 'options': None,
            'mountpoint': '/var/lib/docker/volumes/sample-app-staging-postgres/_data', 'created_at': '2026-01-01T00:00:00Z'}
        self.foreign = None
        self.symlinks = set()

    def command(self, *args, **kwargs):
        if args[:3] == ('docker', 'ps', '--all'):
            return self.container['id'] + ('\n' + self.foreign['id'] if self.foreign else '')
        if args[:3] in {('docker', 'network', 'ls'), ('docker', 'volume', 'ls')}:
            name = self.network['name'] if args[1] == 'network' else self.volume['name']
            if '--filter' in args and 'sample-app-production' in args[args.index('--filter') + 1]:
                return ''
            return name
        if args[:3] == ('docker', 'image', 'ls'):
            return ''
        raise AssertionError(args)

    def json(self, *args):
        if args[:2] == ('docker', 'inspect'):
            return self.foreign if self.foreign and args[-1] == self.foreign['id'] else self.container
        if args[:3] == ('docker', 'network', 'inspect'):
            return self.network
        if args[:3] == ('docker', 'volume', 'inspect'):
            return self.volume
        if args[:3] == ('docker', 'image', 'inspect'):
            return self.container['image']
        raise AssertionError(args)

    def inspect(self):
        # Docker inventory and its filesystem topology are one explicit fixture.
        # Never inspect the workstation's real privileged Docker data directory.
        with mock.patch.object(host, 'command', side_effect=self.command), \
             mock.patch.object(host, 'json_command', side_effect=self.json), \
             mock.patch.object(Path, 'is_symlink', lambda path: str(path) in self.symlinks):
            return host.docker(identity())

    def test_valid_exact_labeled_resources_are_inspected_without_credentials(self):
        result = self.inspect()
        self.assertEqual(result['containers'][0]['id'], self.container['id'])
        self.assertEqual(result['volumes'][0]['created_at'], self.volume['created_at'])
        self.assertNotIn('labels', result['containers'][0])
        self.assertNotIn('env', json.dumps(result).lower())

    def test_foreign_volume_label_rejected(self):
        self.volume['labels'][host.LABEL] = 'neighbor-staging'
        with self.assertRaises(state.Error):
            self.inspect()

    def test_bind_mount_rejected(self):
        self.container['mounts'][0].update(Type='bind', Source='/etc', Name=None)
        with self.assertRaises(state.Error):
            self.inspect()

    def test_foreign_network_attachment_rejected(self):
        self.network['containers']['9' * 64] = {}
        with self.assertRaises(state.Error):
            self.inspect()

    def test_foreign_volume_consumer_rejected(self):
        self.foreign = copy.deepcopy(self.container)
        self.foreign.update(id='9' * 64, name='/neighbor-db', labels={'com.docker.compose.project': 'neighbor-db'})
        with self.assertRaises(state.Error):
            self.inspect()

    def test_symlink_volume_mountpoint_rejected(self):
        self.symlinks.add(self.volume['mountpoint'])
        with self.assertRaises(state.Error):
            self.inspect()

    def test_symlink_volume_ancestor_rejected(self):
        self.symlinks.add('/var/lib/docker/volumes/sample-app-staging-postgres')
        with self.assertRaises(state.Error):
            self.inspect()

    def test_unowned_same_name_container_rejected(self):
        self.container['labels']['com.docker.compose.project'] = 'neighbor-db'
        with self.assertRaises(state.Error):
            self.inspect()


class ProviderAndOrderingTests(unittest.TestCase):
    def test_foreign_dns_value_is_not_deleted(self):
        snapshot = {'identity': identity()}
        with mock.patch.object(dns, 'records', return_value=[{'name': 'sample', 'type': 'A', 'records': [{'value': '192.0.2.99'}], 'ttl': 300}]):
            with self.assertRaises(state.Error):
                dns.inspect(snapshot)

    def test_dns_absent_null_and_empty_comments_preserve_exact_ip_and_inherited_ttl(self):
        snapshot = {'identity': identity()}
        expected = identity()['operator_ipv4']
        for optional in ({}, {'comment': None}, {'comment': ''}):
            for ttl in (None, 300):
                with self.subTest(optional=optional, ttl=ttl):
                    rr = {'name': 'sample', 'type': 'A', 'records': [dict(value=expected, **optional)], 'ttl': ttl}
                    with mock.patch.object(dns, 'records', return_value=[rr]), mock.patch.object(dns, 'api') as api:
                        self.assertEqual(dns.inspect(snapshot), [{'name': 'sample', 'type': 'A',
                            'records': [{'value': expected}], 'ttl': ttl}])
                    api.assert_not_called()

    def test_dns_foreign_values_types_fields_and_nonempty_comments_remain_blockers(self):
        snapshot = {'identity': identity()}
        expected = identity()['operator_ipv4']
        cases = [('A', [{'value': '192.0.2.99', 'comment': ''}]),
                 ('A', [{'value': expected, 'comment': ''}, {'value': '192.0.2.99'}]),
                 ('AAAA', [{'value': expected, 'comment': ''}]),
                 ('A', [{'value': expected, 'comment': '', 'unknown': None}]),
                 ('A', [{'value': expected, 'comment': 'neighbor-owned'}]),
                 ('A', [{'value': expected, 'comment': ' '}]),
                 ('A', [{'value': expected, 'comment': False}])]
        for kind, records in cases:
            with self.subTest(kind=kind, records=records):
                rr = {'name': 'sample', 'type': kind, 'records': records, 'ttl': None}
                with mock.patch.object(dns, 'records', return_value=[rr]), mock.patch.object(dns, 'api') as api:
                    with self.assertRaises(state.Error):
                        dns.inspect(snapshot)
                api.assert_not_called()

    def test_compact_and_full_guides_use_same_numbered_commands(self):
        import re
        full = (SOURCE.parent / 'DELETE_GUIDE.md').read_text()
        compact = (SOURCE.parent / 'DELETE_GUIDE_COMPACT.md').read_text()
        pattern = r'python3 -B docs/project-deletion/scripts/[0-9][^\n]+'
        self.assertEqual(re.findall(pattern, full), re.findall(pattern, compact))
        self.assertEqual(len(re.findall(pattern, full)), 9)

    def test_repository_deletion_requires_providers_receipt_and_current_absence(self):
        plan = selected()
        with mock.patch.object(deletion, 'load', return_value=(Path('/private'), {'identity': identity()})), \
             mock.patch.object(deletion, 'plan', return_value=plan), mock.patch.object(deletion, 'locked'), \
             mock.patch.object(deletion, 'receipt', side_effect=state.Error('missing')), \
             mock.patch.object(github, 'remove_repository') as delete:
            with self.assertRaises(state.Error):
                deletion.perform(mock.Mock(plan_sha256=state.digest(plan)), 'repository')
            delete.assert_not_called()


if __name__ == '__main__':
    unittest.main()
