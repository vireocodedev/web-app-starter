"""Initialization operator steps preserve project boundaries and uncertain outcomes."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / 'docs/template-initialization/scripts'


def load(filename):
    spec = importlib.util.spec_from_file_location('test_initialization_' + filename, SCRIPTS / (filename + '.py'))
    module = importlib.util.module_from_spec(spec)
    with mock.patch.object(sys, 'path', [str(SCRIPTS), *sys.path]):
        spec.loader.exec_module(module)
    return module


operator = load('_operations')
provisioner = load('16_1_provision_staging')
restorer = load('18_4_restore_rehearsal')


def context():
    return SimpleNamespace(root=ROOT, scope='full', mode='new', values={
        'REPOSITORY': 'vireocodedev/fixture-app', 'PROJECT_SLUG': 'fixture-app',
        'MAINTAINER_LOGIN': 'brunotot', 'RELEASE_BRANCH': 'release/initial-fixture-app',
        'OPERATOR_SSH': 'root@46.224.72.162', 'OPERATOR_IPV4': '46.224.72.162',
        'DNS_ZONE': 'vireocode.com', 'STAGING_HOSTNAME': 'fixture-staging.vireocode.com',
        'PRODUCTION_HOSTNAME': 'fixture.vireocode.com',
        'STAGING_FRONTEND_PORT': '18280', 'STAGING_BACKEND_PORT': '18281',
        'PRODUCTION_FRONTEND_PORT': '18380', 'PRODUCTION_BACKEND_PORT': '18381'})


def progress():
    return {'source_sha': 'a' * 40, 'staging_workflow_id': 15, 'production_workflow_id': 16,
            'staging_dispatch_after': '2026-10-27T10:00:00+00:00',
            'staging_dispatch_intent': {
                'repository': 'vireocodedev/fixture-app', 'source_sha': 'a' * 40,
                'branch': 'release/initial-fixture-app', 'actor': 'brunotot', 'workflow_id': 15,
                'created_after': '2026-10-27T10:00:00+00:00', 'state': 'unresolved'}}


def workflow():
    return {'id': 100, 'repository': {'full_name': 'vireocodedev/fixture-app'},
            'head_sha': 'a' * 40, 'head_branch': 'release/initial-fixture-app',
            'event': 'workflow_dispatch', 'path': '.github/workflows/deploy-staging.yaml',
            'workflow_id': 15, 'actor': {'login': 'brunotot'},
            'created_at': '2026-10-27T10:00:01Z', 'run_attempt': 1,
            'status': 'completed', 'conclusion': 'success', 'html_url': 'https://github.com/example/run/100'}


class InitializationOperatorStepTests(unittest.TestCase):
    def test_all_numbered_operator_help_is_inert_without_env_or_credentials(self):
        # Help may import implementation modules, but never loads env or probes tools.
        with tempfile.TemporaryDirectory() as directory:
            for path in sorted(SCRIPTS.glob('*.py')):
                if not path.name.split('_', 1)[0].isdigit() or not 11 <= int(path.name.split('_', 1)[0]) <= 18:
                    continue
                with self.subTest(path=path.name):
                    result = subprocess.run([sys.executable, '-B', str(path), '--help'], cwd=directory,
                                            capture_output=True, text=True, timeout=10)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertIn('--env', result.stdout)
                    self.assertEqual(result.stderr, '')

    def test_full_remote_scope_is_required_before_any_operation(self):
        fixture = context()
        fixture.scope = 'local'
        with mock.patch.object(operator, 'load_context', return_value=fixture), \
                mock.patch.object(operator, 'require_consumer') as consumer, \
                self.assertRaisesRegex(operator.InitError, 'full'):
            operator.context(SimpleNamespace(), consumer=True)
        consumer.assert_not_called()

    def test_repository_observation_rejects_replacement_without_overwriting_progress(self):
        fixture = context()
        state = {'repository_id': 123, 'source_sha': 'a'*40}
        for pinned in (None, 123):
            observed = dict(state)
            if pinned is None:
                observed.pop('repository_id')
            original = dict(observed)
            with mock.patch.object(operator, 'context', return_value=fixture), \
                    mock.patch.object(operator, 'read_state', return_value=observed), \
                    mock.patch.object(operator, 'gh_json', return_value={
                        'id':456, 'full_name':fixture.values['REPOSITORY'], 'private':True}) as api, \
                    mock.patch.object(operator, 'update_state') as update:
                with self.subTest(pinned=pinned), self.assertRaises(operator.InitError):
                    operator.observe_repository_ids(SimpleNamespace())
                update.assert_not_called()
                self.assertEqual(observed, original)
                self.assertEqual(api.call_count, 0 if pinned is None else 1)

    def test_repository_observation_records_workflows_for_the_verified_id(self):
        fixture = context()
        def api(ctx, suffix):
            if not suffix:
                return {'id':123, 'full_name':fixture.values['REPOSITORY'], 'private':True}
            environment = 'staging' if 'staging' in suffix else 'production'
            return {'id':15 if environment=='staging' else 16,
                    'path':'.github/workflows/deploy-' + environment + '.yaml'}
        with mock.patch.object(operator, 'context', return_value=fixture), \
                mock.patch.object(operator, 'read_state', return_value={'repository_id':123}), \
                mock.patch.object(operator, 'gh_json', side_effect=api), \
                mock.patch.object(operator, 'update_state') as update, \
                contextlib.redirect_stdout(io.StringIO()):
            operator.observe_repository_ids(SimpleNamespace())
        update.assert_called_once_with(fixture, repository_id=123, staging_workflow_id=15,
                                       production_workflow_id=16)

    def test_collision_inventory_covers_stopped_containers_and_loaded_units(self):
        def execute(arguments, **kwargs):
            if arguments[:3] == ['docker', 'ps', '-a']:
                return 'unrelated-project\nfixture-app-staging-app-backend-1'
            if arguments[:2] == ['systemctl', 'list-units']:
                return 'web-app-backup-fixture-app.timer loaded inactive dead'
            return ''

        with mock.patch.object(operator, 'execute', side_effect=execute), \
                mock.patch.object(Path, 'exists', return_value=False), \
                mock.patch.object(Path, 'is_symlink', return_value=False), \
                mock.patch.object(Path, 'glob', return_value=[]), \
                mock.patch.object(operator.socket, 'socket'):
            collisions = operator.project_collisions(context())
        self.assertIn('container:fixture-app-staging-app-backend-1', collisions)
        self.assertTrue(any('web-app-backup-fixture-app.timer' in value for value in collisions))
        self.assertFalse(any('unrelated-project' in value for value in collisions))

    def test_collision_inventory_covers_reserved_ports_when_other_apps_are_stopped(self):
        other = mock.Mock()
        other.read_text.return_value = json.dumps({'environments': {'staging': {
            'frontend_port': 18280, 'backend_port': 19281}}})
        with mock.patch.object(operator, 'execute', return_value=''), \
                mock.patch.object(Path, 'exists', return_value=False), \
                mock.patch.object(Path, 'is_symlink', return_value=False), \
                mock.patch.object(Path, 'glob', return_value=[other]), \
                mock.patch.object(operator.socket, 'socket'):
            collisions = operator.project_collisions(context())
        self.assertTrue(any(value.startswith('configured-port-reservation:') for value in collisions))

    def test_explicit_workflow_run_must_match_all_source_and_dispatch_identity(self):
        correct = workflow()
        invalid = [dict(correct, head_sha='b' * 40), dict(correct, head_branch='main'),
                   dict(correct, event='push'), dict(correct, workflow_id=16),
                   dict(correct, actor={'login': 'someone-else'}),
                   dict(correct, repository={'full_name': 'vireocodedev/another-project'}),
                   dict(correct, created_at='2026-10-26T10:00:01Z'), dict(correct, conclusion='failure')]
        with mock.patch.object(operator, 'read_state', return_value=progress()):
            for observed in invalid:
                with self.subTest(observed=observed), \
                        mock.patch.object(operator, 'gh_json', return_value=observed), \
                        self.assertRaises(operator.InitError):
                    operator.observe_run(context(), 'staging', 100, completed=True)
            with mock.patch.object(operator, 'gh_json', return_value=correct):
                self.assertEqual(operator.observe_run(context(), 'staging', 100, completed=True), correct)

    def test_workflow_attempt_change_does_not_record_success(self):
        original = workflow()
        with mock.patch.object(operator, 'observe_run', side_effect=[original, dict(original, run_attempt=2)]), \
                mock.patch.object(operator, 'execute'), \
                mock.patch.object(operator, 'update_state') as update, \
                contextlib.redirect_stdout(io.StringIO()), \
                self.assertRaisesRegex(operator.InitError, 'attempt changed'):
            operator.watch_release(context(), 'staging', 100)
        update.assert_not_called()

    def test_lost_staging_dispatch_response_preserves_intent_and_blocks_duplicate_write(self):
        self.exercise_lost_dispatch('staging')

    def test_lost_production_dispatch_response_preserves_intent_and_blocks_duplicate_write(self):
        self.exercise_lost_dispatch('production')

    def exercise_lost_dispatch(self, environment):
        fixture = context()
        state = {'source_sha': 'a' * 40, 'staging_workflow_id': 15, 'production_workflow_id': 16,
                 'staging_run_id': 100, 'staging_run_attempt': 1, 'staging_pair': {'source_sha': 'a' * 40}}
        writes = []

        def update(ctx, **values):
            state.update(values)

        def execute(arguments, **kwargs):
            if arguments[:3] == ['gh', 'workflow', 'run']:
                writes.append(arguments)
                # GitHub accepted this request, but the client did not receive its response.
                raise operator.InitError('Accepted dispatch response was lost.')
            return ''

        dispatch = operator.dispatch_staging if environment == 'staging' else operator.promote_production
        with mock.patch.object(operator, 'context', return_value=fixture), \
                mock.patch.object(operator, 'read_state', side_effect=lambda ctx: dict(state)), \
                mock.patch.object(operator, 'update_state', side_effect=update), \
                mock.patch.object(operator, 'require_packages'), \
                mock.patch.object(operator, 'selected_source', return_value='a' * 40), \
                mock.patch.object(operator, 'observe_run', return_value=workflow()), \
                mock.patch.object(operator, 'execute', side_effect=execute):
            with self.assertRaisesRegex(operator.InitError, 'response was lost'):
                dispatch(SimpleNamespace())
            original = dict(state[environment + '_dispatch_intent'])
            timestamp = state[environment + '_dispatch_after']
            with self.assertRaisesRegex(operator.InitError, 'dispatch already exists'):
                dispatch(SimpleNamespace())
            self.assertEqual(len(writes), 1)
            self.assertEqual(state[environment + '_dispatch_after'], timestamp)
            self.assertEqual(state[environment + '_dispatch_intent'], original)
            # Changing source while an old request is unresolved is not a fresh dispatch.
            state['source_sha'] = 'b' * 40
            with self.assertRaisesRegex(operator.InitError, 'identity changed'):
                dispatch(SimpleNamespace())
            state['source_sha'] = 'a' * 40
            self.assertEqual(len(writes), 1)

        actual = workflow()
        actual.update(id=200, path='.github/workflows/deploy-' + environment + '.yaml',
                      workflow_id=state[environment + '_workflow_id'],
                      created_at=timestamp, status='completed', conclusion='success')
        # An explicit read-only reconciliation accepts the original run against the
        # original timestamp and cannot issue another workflow_dispatch request.
        with mock.patch.object(operator, 'read_state', side_effect=lambda ctx: dict(state)), \
                mock.patch.object(operator, 'update_state', side_effect=update), \
                mock.patch.object(operator, 'gh_json', return_value=actual), \
                mock.patch.object(operator, 'execute') as execute, \
                contextlib.redirect_stdout(io.StringIO()):
            operator.reconcile_dispatch(fixture, environment, 200)
            self.assertEqual(state[environment + '_dispatch_intent']['state'], 'completed')
            self.assertEqual(state[environment + '_dispatch_intent']['run_id'], 200)
            self.assertEqual(state[environment + '_dispatch_after'], timestamp)
            with self.assertRaisesRegex(operator.InitError, 'dispatch already exists'):
                operator.require_dispatch_resolved(fixture, environment)
        execute.assert_not_called()

    def test_only_explicit_terminal_failure_reconciliation_allows_new_dispatch(self):
        fixture = context()
        state = progress()
        state['staging_dispatch_intent'].update(state='completed', run_id=100, run_attempt=1,
                                                 conclusion='failure', reconciled=False)
        with mock.patch.object(operator, 'read_state', side_effect=lambda ctx: dict(state)), \
                mock.patch.object(operator, 'update_state', side_effect=lambda ctx, **values: state.update(values)):
            with self.assertRaisesRegex(operator.InitError, 'dispatch already exists'):
                operator.begin_dispatch(fixture, 'staging')
            state['staging_dispatch_intent']['reconciled'] = True
            previous = dict(state['staging_dispatch_intent'])
            operator.begin_dispatch(fixture, 'staging')
        self.assertEqual(state['staging_dispatch_history'], [previous])
        self.assertEqual(state['staging_dispatch_intent']['state'], 'unresolved')
        self.assertNotIn('run_id', state['staging_dispatch_intent'])

    def test_successful_watch_closes_the_original_dispatch_with_exact_run_attempt(self):
        fixture = context()
        state = progress()
        original_timestamp = state['staging_dispatch_after']
        with mock.patch.object(operator, 'read_state', side_effect=lambda ctx: dict(state)), \
                mock.patch.object(operator, 'update_state', side_effect=lambda ctx, **values: state.update(values)), \
                mock.patch.object(operator, 'gh_json', return_value=workflow()), \
                mock.patch.object(operator, 'execute'), contextlib.redirect_stdout(io.StringIO()):
            operator.watch_release(fixture, 'staging', 100)
        self.assertEqual(state['staging_dispatch_intent']['state'], 'completed')
        self.assertEqual(state['staging_dispatch_intent']['conclusion'], 'success')
        self.assertEqual(state['staging_dispatch_intent']['run_attempt'], 1)
        self.assertEqual(state['staging_dispatch_after'], original_timestamp)
        self.assertEqual(state['staging_run_id'], 100)

    def test_ambiguous_package_failure_is_not_treated_as_available(self):
        with mock.patch.object(operator, 'context', return_value=context()), \
                mock.patch.object(operator, 'run', return_value=SimpleNamespace(returncode=1, stdout='')), \
                mock.patch.object(operator, 'update_state') as update, \
                contextlib.redirect_stdout(io.StringIO()), \
                self.assertRaisesRegex(operator.InitError, 'not absence'):
            operator.inspect_packages(SimpleNamespace(absence_confirmed=False))
        update.assert_not_called()

    def test_package_owned_by_another_repository_is_preserved(self):
        package = {'name': 'fixture-app-frontend', 'visibility': 'private', 'package_type': 'container',
                   'repository': {'full_name': 'vireocodedev/another-project'}}
        with mock.patch.object(operator, 'context', return_value=context()), \
                mock.patch.object(operator, 'run', return_value=SimpleNamespace(returncode=0, stdout=json.dumps(package))), \
                mock.patch.object(operator, 'update_state') as update, \
                self.assertRaisesRegex(operator.InitError, 'conflicting'):
            operator.inspect_packages(SimpleNamespace(absence_confirmed=True))
        update.assert_not_called()

    def test_remote_dump_rejects_other_projects_partials_and_shell_metacharacters(self):
        invalid = ['/var/lib/web-app-deploy/other/production/backups/a.dump',
                   '/var/lib/web-app-deploy/fixture-app/production/backups/a.partial',
                   '/var/lib/web-app-deploy/fixture-app/production/backups/a.dump;id',
                   '/var/lib/web-app-deploy/fixture-app/production/backups/$(id).dump',
                   '/var/lib/web-app-deploy/fixture-app/production/backups/../a.dump']
        with mock.patch.object(operator, 'context', return_value=context()), \
                mock.patch.object(operator, 'retrieve_file') as retrieve:
            for value in invalid:
                with self.subTest(value=value), self.assertRaises(operator.InitError):
                    operator.retrieve_backup(SimpleNamespace(remote_dump=value))
        retrieve.assert_not_called()

    def test_ssh_command_quotes_each_remote_argument_and_preserves_host_identity(self):
        arguments = operator.ssh_arguments(context(), ['cat', '/root/file name; touch danger'])
        self.assertIn('StrictHostKeyChecking=yes', arguments)
        self.assertIn('BatchMode=yes', arguments)
        self.assertEqual(arguments[-2], 'root@46.224.72.162')
        self.assertEqual(shlex.split(arguments[-1]), ['cat', '/root/file name; touch danger'])

    def test_backup_requires_initialized_nonzero_rows_size_digest_and_private_modes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / 'production.dump'
            archive.write_bytes(b'private-database-copy')
            archive.chmod(0o600)
            digest = hashlib.sha256(archive.read_bytes()).hexdigest()
            metadata = root / 'production.dump.json'
            valid = {'initialized': True, 'users': 1, 'bytes': archive.stat().st_size, 'sha256': digest}
            metadata.write_text(json.dumps(valid))
            metadata.chmod(0o600)
            self.assertEqual(operator.verify_backup(root), digest)
            for invalid in (dict(valid, users=0), dict(valid, initialized=False),
                            dict(valid, bytes=1), dict(valid, sha256='f' * 64)):
                metadata.write_text(json.dumps(invalid))
                with self.subTest(metadata=invalid), self.assertRaises(operator.InitError):
                    operator.verify_backup(root)
            metadata.write_text(json.dumps(valid))
            archive.chmod(0o644)
            with self.assertRaisesRegex(operator.InitError, 'private'):
                operator.verify_backup(root)

    def test_schedule_does_not_activate_before_exact_retrieved_copy_restore_and_review(self):
        for state, reviewed in [({}, True), ({'retrieved_copy_restored': True,
                 'restored_backup_sha256': 'a' * 64, 'retrieved_backup_sha256': 'b' * 64}, True),
                ({'retrieved_copy_restored': True, 'restored_backup_sha256': 'a' * 64,
                  'retrieved_backup_sha256': 'a' * 64}, False)]:
            with self.subTest(state=state, reviewed=reviewed), \
                    mock.patch.object(operator, 'context', return_value=context()), \
                    mock.patch.object(operator, 'read_state', return_value=state), \
                    mock.patch.object(operator, 'execute') as execute, \
                    self.assertRaises(operator.InitError):
                operator.enable_backup_schedule(SimpleNamespace(reviewed=reviewed))
            execute.assert_not_called()

    def test_provisioning_uses_one_lock_active_digest_and_backup_before_production_create(self):
        self.exercise_provisioning('production')

    def test_staging_provisioning_does_not_take_production_backup(self):
        self.exercise_provisioning('staging')

    def test_uncertain_create_retains_durable_intent_and_never_removes_unknown_container(self):
        self.exercise_provisioning('production', uncertain=True)

    def test_restore_uses_retrieved_copy_without_live_network_ports_or_volumes(self):
        self.exercise_restore()

    def test_uncertain_restore_create_preserves_exact_intent_and_credentials(self):
        self.exercise_restore(uncertain=True)

    def exercise_restore(self, uncertain=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / 'production.dump'
            archive.write_bytes(b'retrieved-private-copy')
            digest = hashlib.sha256(archive.read_bytes()).hexdigest()
            (root / 'production.dump.json').write_text(json.dumps({
                'initialized': True, 'users': 1, 'bytes': archive.stat().st_size, 'sha256': digest}))
            created = []
            removed = []
            streamed = []

            def docker(arguments, **kwargs):
                output = b''
                if arguments[:2] == ('docker', 'create'):
                    name = arguments[arguments.index('--name') + 1]
                    created.append(name)
                    self.assertEqual(arguments[arguments.index('--network') + 1], 'none')
                    self.assertIn('--read-only', arguments)
                    self.assertNotIn('--publish', arguments)
                    self.assertNotIn('--volume', arguments)
                    self.assertNotIn('--mount', arguments)
                    self.assertIn('/var/lib/postgresql:rw,size=256m,uid=999,gid=999,mode=0700', arguments)
                    intent = json.loads((root / (name + '.json')).read_text())
                    self.assertEqual(intent['state'], 'started')
                    self.assertEqual(intent['backup_sha256'], digest)
                    if uncertain:
                        raise RuntimeError('lost create response')
                elif 'pg_restore' in arguments:
                    streamed.append(kwargs['stdin'].name)
                elif 'psql' in arguments:
                    query = arguments[-1]
                    output = b'2' if query == 'SELECT count(*) FROM flyway_schema_history WHERE success' else (
                        b'0' if 'WHERE NOT success' in query else b'1')
                elif arguments[:2] == ('docker', 'inspect'):
                    output = created[-1].encode()
                elif arguments[:2] == ('docker', 'rm'):
                    removed.append(arguments[-1])
                return SimpleNamespace(returncode=0, stdout=output)

            with mock.patch('os.geteuid', return_value=0), mock.patch('os.umask'), \
                    mock.patch.object(Path, 'lstat', return_value=SimpleNamespace(st_uid=0, st_mode=0o100700)), \
                    mock.patch.object(Path, 'is_symlink', return_value=False), \
                    mock.patch('subprocess.run', side_effect=docker), \
                    contextlib.redirect_stdout(io.StringIO()):
                if uncertain:
                    with self.assertRaisesRegex(SystemExit, 'Preserve intent'):
                        restorer.restore(root)
                else:
                    self.assertEqual(restorer.restore(root), digest)
            name = created[0]
            intent = json.loads((root / (name + '.json')).read_text())
            self.assertEqual(intent['state'], 'started' if uncertain else 'success')
            self.assertEqual(removed, [] if uncertain else [name])
            self.assertEqual((root / (name + '.env')).exists(), uncertain)
            self.assertEqual(streamed, [] if uncertain else [str(archive)])
            self.assertTrue(archive.exists())

    def exercise_provisioning(self, environment, uncertain=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            active = {'state': 'success', 'snapshot': str(root / 'snapshot.json'),
                      'pair': {'backend': 'ghcr.io/vireocodedev/fixture-app-backend@sha256:' + 'a' * 64}}
            (root / 'active.json').write_text(json.dumps(active))
            (root / 'transaction.json').write_text('{"state":"success"}')
            runtime_path = root / 'runtime.json'
            config = {'settings': str(root / 'settings')}
            runtime_path.write_text(json.dumps(config))
            events = []
            in_lock = False

            @contextlib.contextmanager
            def locked(config, selected):
                nonlocal in_lock
                self.assertFalse(in_lock)
                self.assertEqual(selected, environment)
                in_lock = True
                events.append('lock')
                try:
                    yield root
                finally:
                    in_lock = False

            def backup(*args):
                self.assertTrue(in_lock)
                events.append('backup')

            def command(*args, **kwargs):
                self.assertTrue(in_lock)
                if args[:2] == ('docker', 'create'):
                    record = json.loads(next(root.glob('provision-*.json')).read_text())
                    self.assertEqual(record['state'], 'started')
                    self.assertIn(args[3], record['containers'])
                    self.assertIn(active['pair']['backend'], args)
                    self.assertNotIn('--publish', args)
                    self.assertIn('--read-only', args)
                    events.append('create')
                    if uncertain:
                        raise RuntimeError('lost response')
                if args[:2] == ('docker', 'inspect'):
                    record = json.loads(next(root.glob('provision-*.json')).read_text())
                    return json.dumps({'running': False, 'exit': 0, 'label': record['label']}).encode()
                if args[:2] == ('docker', 'rm'):
                    events.append('rm')
                return b''

            def protected(path):
                return runtime_path if str(path).startswith('/etc/web-app-deploy/') else Path(path)

            runtime = SimpleNamespace(validate=lambda value: value, locked=locked, backup=backup,
                                      verify_running=lambda *args: events.append('verify'))
            controller = SimpleNamespace(protected=protected,
                write_json=lambda path, value: Path(path).write_text(json.dumps(value)))
            protocol = SimpleNamespace(decode=json.loads, command=command)
            metadata = SimpleNamespace(st_uid=0, st_mode=0o100700)
            # Installed-source checks are simulated; all actual state stays in the temp directory.
            with mock.patch.dict(sys.modules, runtime=runtime, controller=controller, protocol=protocol), \
                    mock.patch.object(sys, 'path', list(sys.path)), \
                    mock.patch('os.geteuid', return_value=0), mock.patch('os.umask'), \
                    mock.patch.object(Path, 'lstat', return_value=metadata), \
                    mock.patch.object(Path, 'is_symlink', return_value=False), \
                    contextlib.redirect_stdout(io.StringIO()):
                if uncertain:
                    with self.assertRaisesRegex(SystemExit, 'Preserve intent'):
                        provisioner.provision('fixture-app', environment)
                else:
                    provisioner.provision('fixture-app', environment)
            record = json.loads(next(root.glob('provision-*.json')).read_text())
            self.assertEqual(events.count('lock'), 1)
            self.assertEqual(events.count('backup'), int(environment == 'production'))
            if environment == 'production':
                self.assertLess(events.index('backup'), events.index('create'))
            self.assertEqual(record['state'], 'started' if uncertain else 'success')
            self.assertEqual(events.count('rm'), 0 if uncertain else 2)


if __name__ == '__main__':
    unittest.main()
