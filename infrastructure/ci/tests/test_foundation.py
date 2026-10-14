"""Input and lifecycle failure tests; never configure the host or contact GitHub."""
import contextlib
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import shlex
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('foundation_manage', ROOT / 'manage.py')
manage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manage)
ctl = manage.ctl
BASELINE = json.loads((ROOT / 'ci-runner/config.example.json').read_text())


class InstallerPreflightTests(unittest.TestCase):
    def test_disabled_forwarding_fails_before_provisioning(self):
        # Exercise the actual shell preflight with only OS/forwarding reads
        # redirected to fixtures. No privileges or host configuration changes.
        source = (ROOT / 'ci-runner/install.sh').read_text()
        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory)
            release = fixture / 'os-release'
            release.write_text('ID=ubuntu\nVERSION_ID=26.04\n')
            forwarding = fixture / 'ip-forward'
            forwarding.write_text('0\n')
            marker = fixture / 'unexpected-provisioning'
            source = source.replace('. /etc/os-release', '. ' + shlex.quote(str(release)))
            source = source.replace('/proc/sys/net/ipv4/ip_forward', shlex.quote(str(forwarding)))
            guard = ('id() { printf "0\\n"; }\n'
                     'uname() { printf "x86_64\\n"; }\n'
                     'install() { touch ' + shlex.quote(str(marker)) + '; return 99; }\n')
            script = fixture / 'installer-fixture.sh'
            script.write_text(guard + source)
            result = subprocess.run(['/bin/bash', str(script), '/root/unused-config.json'],
                                    text=True, capture_output=True, timeout=10,
                                    env={'PATH': '/usr/bin:/bin'})
            self.assertEqual(result.returncode, 1)
            self.assertIn('net.ipv4.ip_forward=1', result.stderr)
            self.assertIn('infrastructure/ci/README.md', result.stderr)
            self.assertFalse(marker.exists())


class ConfigurationTests(unittest.TestCase):
    def test_empty_projects_valid_but_cannot_serve(self):
        config = ctl.validate_config(copy.deepcopy(BASELINE))
        self.assertEqual(ctl.repositories(config), ())
        with self.assertRaisesRegex(ctl.BoundaryError, 'registered-project-required'):
            ctl.serve(config)

    def test_arbitrary_project_org_and_unique_repositories(self):
        config = copy.deepcopy(BASELINE)
        config['projects'] = {'shoes': {'repository': 'Another-Org/shoes'},
                              'bags': {'repository': 'Acme/bags'}}
        self.assertEqual(ctl.repositories(ctl.validate_config(config)), ('Another-Org/shoes', 'Acme/bags'))
        config['projects']['bags']['repository'] = 'another-org/SHOES'
        with self.assertRaisesRegex(ctl.BoundaryError, 'duplicate-project-repository'):
            ctl.validate_config(config)

    def test_rejects_unknown_fields_commands_and_ambiguous_json(self):
        for change in ({'command': 'touch /root/x'}, {'memory_max_mib': True}, {'projects': []},
                       {'projects': {'x': {'repository': 'Org/app', 'script': '/tmp/x'}}},
                       {'projects': {'x': {'frontend': 'Org/ui', 'backend': 'Org/api'}}},
                       {'projects': {'../x': {'repository': 'Org/app'}}},
                       {'projects': {'x': {'repository': 'Org/app?evil'}}}):
            config = copy.deepcopy(BASELINE)
            config.update(change)
            with self.subTest(change=change), self.assertRaises(ctl.BoundaryError):
                ctl.validate_config(config)
        with self.assertRaisesRegex(ctl.BoundaryError, 'duplicate-configuration-key'):
            json.loads('{"projects":{},"projects":{}}', object_pairs_hook=ctl.unique_object)

    def test_api_allowlist_loaded_config_rejects_unregistered_repo(self):
        config = copy.deepcopy(BASELINE)
        config['projects'] = {'a': {'repository': 'Acme/a'}}
        with mock.patch.object(ctl, 'load_config', return_value=config), mock.patch.object(ctl.urllib.request, 'build_opener') as opener:
            with self.assertRaisesRegex(ctl.BoundaryError, 'repository-or-api-path-rejected'):
                ctl.api('hidden', 'Attacker/a', 'actions/runners')
            with self.assertRaises(ctl.BoundaryError):
                ctl.api('hidden', 'Acme/a', '../actions/runners')
            opener.assert_not_called()
            opener.return_value.open.return_value.__enter__.return_value.read.return_value = b'{"runners":[]}'
            self.assertEqual(ctl.api('hidden', 'Acme/a', 'actions/runners'), {'runners': []})

    def test_single_repository_registration_input(self):
        project = {'slug': 'web-app-starter', 'repository': 'vireocodedev/web-app-starter'}
        with mock.patch.object(ctl, 'protected_file', return_value=json.dumps(project)):
            self.assertEqual(manage.project_input('/root/project.json'), project)

    def test_invalid_registration_never_creates_an_allowlist(self):
        for project in (
                {'slug': 'app', 'frontend': 'Org/ui', 'backend': 'Org/api'},
                {'slug': 'app', 'repository': 'Org/app', 'token': 'not-allowed'},
                {'slug': 'app'},
                {'repository': 'Org/app'},
                {'slug': 'app', 'repository': ['Org/app']},
                {'slug': '../app', 'repository': 'Org/app'},
                {'slug': 'app', 'repository': 'Org/app/extra'},
                {'slug': 'app', 'repository': 'Org/..'},
                {'slug': 'app', 'repository': 'https://github.com/Org/app'},
                [],
        ):
            with self.subTest(project=project), mock.patch.object(
                    ctl, 'protected_file', return_value=json.dumps(project)), self.assertRaises(ctl.BoundaryError):
                manage.project_input('/root/project.json')

    def test_job_discovery_uses_all_registered_monorepos(self):
        config = copy.deepcopy(BASELINE)
        config['projects'] = {'shoes': {'repository': 'Acme/shoes'}, 'bags': {'repository': 'Acme/bags'}}
        seen = set()

        def request(_token, repo, suffix):
            seen.add(repo)
            if suffix.startswith('actions/runs?'):
                return {'workflow_runs': [{'id': 1, 'event': 'pull_request'}]}
            return {'jobs': [
                {'id': 2, 'created_at': '2026-10-14T10:00:00Z', 'status': 'queued',
                 'labels': ['self-hosted', 'Linux', 'X64', 'other-runner']},
                {'id': 3 if repo == 'Acme/shoes' else 4,
                 'created_at': '2026-10-14T11:00:00Z' if repo == 'Acme/shoes' else '2026-10-14T10:00:00Z',
                 'status': 'queued', 'labels': sorted(ctl.LABELS)},
            ]}

        with mock.patch.object(ctl, 'load_config', return_value=config), mock.patch.object(
                ctl, 'api', side_effect=request):
            self.assertEqual(ctl.find_job('hidden'), ('Acme/bags', 4))
        self.assertEqual(seen, {'Acme/shoes', 'Acme/bags'})

    def test_protected_file_refuses_symlinks_and_unsafe_ancestors(self):
        safe_dir = mock.Mock(st_mode=stat.S_IFDIR | 0o755, st_uid=0)
        unsafe_dir = mock.Mock(st_mode=stat.S_IFDIR | 0o777, st_uid=0)
        link = mock.Mock(st_mode=stat.S_IFLNK | 0o777, st_uid=0)
        path = Path('/root/protected-input.json')
        def metadata(item):
            return link if item == path else safe_dir
        with mock.patch.object(Path, 'lstat', metadata), self.assertRaises(ctl.BoundaryError):
            ctl.protected_path(path)
        with mock.patch.object(Path, 'lstat', return_value=unsafe_dir), self.assertRaisesRegex(ctl.BoundaryError, 'unsafe-protected-parent'):
            ctl.protected_path(path)


class PermissionApiTests(unittest.TestCase):
    def test_get_runner_404_recognized_for_reconciliation_only(self):
        error = manage.urllib.error.HTTPError('https://api.github.com/hidden', 404, 'fixed fixture', {}, None)
        with mock.patch.object(manage.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = error
            self.assertIsNone(manage.permission_request('hidden', 'Acme/ui', '/actions/runners/42', missing_ok=True))
            with self.assertRaises(ctl.BoundaryError):
                manage.permission_request('hidden', 'Acme/ui', '/actions/runners/42', 'DELETE', missing_ok=True)

    def test_get_empty_200_cannot_be_mistaken_for_absence(self):
        with mock.patch.object(manage.urllib.request, 'build_opener') as opener:
            opener.return_value.open.return_value.__enter__.return_value.read.return_value = b''
            with self.assertRaisesRegex(ctl.BoundaryError, 'repository-permission-proof-invalid-response'):
                manage.permission_request('hidden', 'Acme/ui', '/actions/runners/42', missing_ok=True)

    def test_recovery_endpoint_cannot_target_arbitrary_paths(self):
        with mock.patch.object(manage.urllib.request, 'build_opener') as opener:
            for suffix, method in (('/actions/runners/42', 'POST'), ('/actions/runners/../42', 'DELETE'), ('/actions/runners?per_page=100&page=11', 'GET'), ('/contents/file', 'DELETE')):
                with self.subTest(suffix=suffix, method=method), self.assertRaises(ctl.BoundaryError):
                    manage.permission_request('hidden', 'Acme/ui', suffix, method)
            opener.assert_not_called()


class IdleBoundaryTests(unittest.TestCase):
    def test_active_or_enabled_controller_rejected(self):
        for active, enabled in (('active', 'disabled'), ('inactive', 'enabled')):
            def state(_unit, prop):
                return active if prop == 'ActiveState' else enabled
            with self.subTest(active=active, enabled=enabled), mock.patch.object(manage, 'state_of', side_effect=state), self.assertRaisesRegex(ctl.BoundaryError, 'controller-must-be-stopped-and-disabled'):
                manage.require_idle(BASELINE)

    def test_surviving_owned_process_rejected(self):
        def state(_unit, prop):
            return 'inactive' if prop == 'ActiveState' else 'disabled'
        with mock.patch.object(manage, 'state_of', side_effect=state), mock.patch.object(ctl, 'remaining_processes', return_value=[123]), self.assertRaisesRegex(ctl.BoundaryError, 'ci-processes-still-active'):
            manage.require_idle(BASELINE)

    def test_nonempty_job_state_rejected(self):
        def state(_unit, prop):
            return 'inactive' if prop == 'ActiveState' else 'disabled'
        with tempfile.TemporaryDirectory() as directory:
            state_path = Path(directory) / 'controller.json'
            state_path.write_text('{}')
            with mock.patch.object(manage, 'state_of', side_effect=state), mock.patch.object(ctl, 'remaining_processes', return_value=[]), mock.patch.object(ctl, 'STATE', state_path), mock.patch.object(ctl, 'protected_file', return_value='{"runner_id":42}'), self.assertRaisesRegex(ctl.BoundaryError, 'job-state-not-empty'):
                manage.require_idle(BASELINE)


class RegistrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.config = self.directory / 'config.json'
        self.config.write_text(json.dumps(BASELINE))
        self.config.chmod(0o600)
        self.receipt = self.directory / 'validation.json'
        self.receipt.write_text('{}')
        self.expected = hashlib.sha256(self.config.read_bytes()).hexdigest()
        self.project = {'slug': 'shoes', 'repository': 'Acme/shoes'}
        self.patches = contextlib.ExitStack()
        self.addCleanup(self.patches.close)
        for patch in (mock.patch.object(ctl, 'CONFIG', self.config), mock.patch.object(ctl, 'BASE', self.directory),
                      mock.patch.object(os, 'geteuid', return_value=0),
                      mock.patch.object(manage, 'lifecycle_lock', side_effect=lambda: contextlib.nullcontext()),
                      mock.patch.object(manage, 'require_idle'),
                      mock.patch.object(manage, 'project_input', return_value=self.project),
                      mock.patch.object(ctl, 'protected_path', side_effect=lambda path, **_kw: Path(path)),
                      mock.patch.object(ctl, 'protected_file', side_effect=lambda path: 'protected-token' if Path(path) == manage.TOKEN else Path(path).read_text())):
            self.patches.enter_context(patch)

    def test_nonroot_operation_rejected_before_any_mutation(self):
        with mock.patch.object(os, 'geteuid', return_value=1000), self.assertRaisesRegex(ctl.BoundaryError, 'root-lifecycle-required'):
            manage.root_required()
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)

    def test_expected_sha_failure_never_contacts_api(self):
        with mock.patch.object(manage, 'verify_permissions') as verify, self.assertRaisesRegex(ctl.BoundaryError, 'configuration-changed'):
            manage.register('/root/project.json', '0' * 64)
        verify.assert_not_called()
        self.assertTrue(self.receipt.exists())

    def test_active_boundary_rejected_without_api_or_config_change(self):
        with mock.patch.object(manage, 'require_idle', side_effect=ctl.BoundaryError('ci-processes-still-active')), mock.patch.object(manage, 'verify_permissions') as verify, self.assertRaises(ctl.BoundaryError):
            manage.register('/root/project.json', self.expected)
        verify.assert_not_called()
        self.assertTrue(self.receipt.exists())
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)

    def test_permission_failure_preserves_config_and_receipt(self):
        with mock.patch.object(manage, 'verify_permissions', side_effect=ctl.BoundaryError('repository-permission-proof-failed')), self.assertRaises(ctl.BoundaryError):
            manage.register('/root/project.json', self.expected)
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)
        self.assertTrue(self.receipt.exists())

    def test_atomic_registration_preserves_existing_project_invalidates_receipt(self):
        config = copy.deepcopy(BASELINE)
        config['projects']['bags'] = {'repository': 'Acme/bags'}
        self.config.write_text(json.dumps(config))
        expected = hashlib.sha256(self.config.read_bytes()).hexdigest()
        with mock.patch.object(manage, 'verify_permissions') as verify:
            result = manage.register('/root/project.json', expected)
        self.assertEqual(json.loads(self.config.read_text())['projects'],
                         {'bags': {'repository': 'Acme/bags'}, 'shoes': {'repository': 'Acme/shoes'}})
        verify.assert_called_once()
        self.assertEqual(tuple(verify.call_args.args[1]), ('Acme/shoes',))
        self.assertFalse(self.receipt.exists())
        self.assertEqual(stat.S_IMODE(self.config.stat().st_mode), 0o600)
        self.assertEqual(list(self.directory.glob('.registration-*')), [])
        self.assertTrue(result['full_validation_required'])
        self.assertFalse(result['controller_enabled'])

    def test_atomic_write_failure_preserves_original_config_and_removes_temp(self):
        with mock.patch.object(os, 'replace', side_effect=OSError('fixture')), self.assertRaises(OSError):
            manage.atomic_config(copy.deepcopy(BASELINE))
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)
        self.assertEqual(list(self.directory.glob('.registration-*')), [])

    def test_duplicate_monorepo_rejected_before_permission_proof(self):
        config = copy.deepcopy(BASELINE)
        config['projects']['existing'] = {'repository': 'acme/SHOES'}
        self.config.write_text(json.dumps(config))
        expected = hashlib.sha256(self.config.read_bytes()).hexdigest()
        with mock.patch.object(manage, 'verify_permissions') as verify, self.assertRaisesRegex(
                ctl.BoundaryError, 'duplicate-project-repository'):
            manage.register('/root/project.json', expected)
        verify.assert_not_called()
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), expected)
        self.assertTrue(self.receipt.exists())

    def proof_name(self):
        return 'web-app-ci-registration-proof-' + '00' * 16

    def inventory(self, *runners):
        return {'total_count': len(runners), 'runners': list(runners)}

    def test_permission_proof_creates_then_deletes_jit_without_starting_job(self):
        runner = {'id': 42, 'name': self.proof_name()}
        with mock.patch.object(os, 'urandom', return_value=b'\x00' * 16), mock.patch.object(manage, 'permission_request', side_effect=[
                {'private': True, 'full_name': 'Acme/ui'}, {'runner': {'id': 42}, 'encoded_jit_config': 'never-used'},
                self.inventory(runner), None, self.inventory()]) as request:
            manage.verify_permissions('hidden', ['Acme/ui'])
        self.assertEqual(request.call_args_list[1].args[2:4], ('/actions/runners/generate-jitconfig', 'POST'))
        self.assertEqual(request.call_args_list[3].args, ('hidden', 'Acme/ui', '/actions/runners/42', 'DELETE'))
        self.assertFalse(manage.ledger_path().exists())

    def test_creation_intent_durable_before_post_and_id_before_delete(self):
        def request(_token, repo, suffix='', method='GET', payload=None, missing_ok=False):
            if not suffix:
                return {'private': True, 'full_name': repo}
            ledger = json.loads(manage.ledger_path().read_text())
            self.assertEqual(ledger['repo'], repo)
            self.assertEqual(ledger['configuration_sha256'], self.expected)
            if method == 'POST':
                self.assertIsNone(ledger['runner_id'])
                self.assertEqual(ledger['proof_name'], payload['name'])
                return {'runner': {'id': 42}, 'encoded_jit_config': 'never-persist'}
            self.assertEqual(ledger['runner_id'], 42)
            if method == 'DELETE':
                self.deleted = True
                return None
            return self.inventory() if getattr(self, 'deleted', False) else self.inventory(
                {'id': 42, 'name': ledger['proof_name']})
        with mock.patch.object(manage, 'permission_request', side_effect=request):
            manage.verify_permissions('hidden', ['Acme/ui'])
        self.assertFalse(manage.ledger_path().exists())

    def test_delete_failure_preserves_ledger_config_and_receipt(self):
        runner = {'id': 42, 'name': self.proof_name()}
        with mock.patch.object(os, 'urandom', return_value=b'\x00' * 16), mock.patch.object(manage, 'permission_request', side_effect=[
                {'private': True, 'full_name': self.project['repository']},
                {'runner': {'id': 42}, 'encoded_jit_config': 'secret-jit-token'}, self.inventory(runner),
                ctl.BoundaryError('fixture-timeout'), self.inventory(runner)]), self.assertRaisesRegex(
                    ctl.BoundaryError, 'runner-registration-cleanup-required'):
            manage.register('/root/project.json', self.expected)
        ledger = json.loads(manage.ledger_path().read_text())
        self.assertEqual(ledger['runner_id'], 42)
        self.assertEqual(ledger['repo'], self.project['repository'])
        self.assertNotIn('secret-jit-token', manage.ledger_path().read_text())
        self.assertEqual(stat.S_IMODE(manage.ledger_path().stat().st_mode), 0o600)
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)
        self.assertTrue(self.receipt.exists())
        with mock.patch.object(manage, 'permission_request') as request, self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            manage.register('/root/project.json', self.expected)
        request.assert_not_called()

    def test_recovery_removes_only_exact_owned_id(self):
        ledger = {'schema_version': 1, 'configuration_sha256': self.expected, 'repo': 'Acme/ui',
                  'proof_name': self.proof_name(), 'runner_id': 42}
        manage.save_ledger(ledger)
        with mock.patch.object(manage, 'permission_request', side_effect=[
                self.inventory({'id': 42, 'name': self.proof_name()}), None, self.inventory()]) as request:
            result = manage.recover_registration(self.expected)
        self.assertEqual(request.call_args_list[1].args, ('protected-token', 'Acme/ui', '/actions/runners/42', 'DELETE'))
        self.assertTrue(result['proof_registration_removed'])
        self.assertFalse(manage.ledger_path().exists())
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)

    def test_recovery_never_deletes_mismatched_id_name(self):
        manage.save_ledger({'schema_version': 1, 'configuration_sha256': self.expected, 'repo': 'Acme/ui',
                           'proof_name': self.proof_name(), 'runner_id': 42})
        with mock.patch.object(manage, 'permission_request', return_value=self.inventory(
                {'id': 42, 'name': 'another-runner'})) as request, self.assertRaisesRegex(
                    ctl.BoundaryError, 'runner-registration-identity-mismatch'):
            manage.recover_registration(self.expected)
        self.assertEqual(request.call_count, 1)
        self.assertTrue(manage.ledger_path().exists())

    def test_explicit_post_rejection_preserves_config_without_uncertain_ledger(self):
        with mock.patch.object(manage, 'permission_request', side_effect=[
                {'private': True, 'full_name': self.project['repository']}, ctl.BoundaryError('repository-permission-proof-rejected')]), self.assertRaisesRegex(ctl.BoundaryError, 'repository-permission-proof-rejected'):
            manage.register('/root/project.json', self.expected)
        self.assertFalse(manage.ledger_path().exists())
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)
        self.assertTrue(self.receipt.exists())

    def test_uncertain_creation_preserves_intent_and_prohibits_fresh_retry(self):
        with mock.patch.object(os, 'urandom', return_value=b'\x00' * 16), mock.patch.object(manage, 'permission_request', side_effect=[
                {'private': True, 'full_name': self.project['repository']}, ctl.BoundaryError('fixture-timeout')]), self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            manage.register('/root/project.json', self.expected)
        self.assertIsNone(json.loads(manage.ledger_path().read_text())['runner_id'])
        with mock.patch.object(manage, 'permission_request') as request, self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            manage.register('/root/project.json', self.expected)
        request.assert_not_called()
        with mock.patch.object(manage, 'permission_request', return_value={'total_count': 0, 'runners': []}) as request, self.assertRaisesRegex(ctl.BoundaryError, 'registration-create-outcome-unresolved'):
            manage.recover_registration(self.expected)
        self.assertTrue(manage.ledger_path().exists())
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)

    def test_uncertain_creation_reconciles_unique_name_inventory(self):
        ledger = {'schema_version': 1, 'configuration_sha256': self.expected, 'repo': 'Acme/ui',
                  'proof_name': self.proof_name(), 'runner_id': None}
        manage.save_ledger(ledger)
        owned = {'id': 42, 'name': self.proof_name()}
        unrelated = {'id': 43, 'name': 'ordinary-runner'}
        with mock.patch.object(manage, 'permission_request', side_effect=[
                self.inventory(owned, unrelated), self.inventory(owned, unrelated), None,
                self.inventory(unrelated)]) as request:
            manage.recover_registration(self.expected)
        self.assertEqual(request.call_args_list[2].args, ('protected-token', 'Acme/ui', '/actions/runners/42', 'DELETE'))
        self.assertFalse(manage.ledger_path().exists())

    def test_delete_timeout_reconciles_absent_runner(self):
        manage.save_ledger({'schema_version': 1, 'configuration_sha256': self.expected, 'repo': 'Acme/ui',
                           'proof_name': self.proof_name(), 'runner_id': 42})
        with mock.patch.object(manage, 'permission_request', side_effect=[
                self.inventory({'id': 42, 'name': self.proof_name()}),
                ctl.BoundaryError('fixture-timeout'), self.inventory()]):
            manage.recover_registration(self.expected)
        self.assertFalse(manage.ledger_path().exists())

    def test_revoked_repository_access_keeps_proof_recovery_ledger(self):
        ledger = {'schema_version': 1, 'configuration_sha256': self.expected, 'repo': 'Acme/ui',
                  'proof_name': self.proof_name(), 'runner_id': 42}
        manage.save_ledger(ledger)
        error = manage.urllib.error.HTTPError('https://api.github.com/hidden', 404, 'fixture', {}, None)
        with mock.patch.object(manage.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = error
            with self.assertRaises(ctl.BoundaryError):
                manage.recover_registration(self.expected)
        self.assertEqual(manage.load_ledger(), ledger)
        self.assertEqual(hashlib.sha256(self.config.read_bytes()).hexdigest(), self.expected)


class ControllerRecoveryTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        self.state = self.directory / 'controller.json'
        self.home = self.directory / 'home'
        self.home.mkdir()
        self.config = copy.deepcopy(BASELINE)
        self.config['projects'] = {'app': {'repository': 'Acme/app'}}
        self.name = 'web-app-ci-job-' + '00' * 16
        self.patches = contextlib.ExitStack()
        self.addCleanup(self.patches.close)
        for patch in (
                mock.patch.object(ctl, 'BASE', self.directory),
                mock.patch.object(ctl, 'STATE', self.state),
                mock.patch.object(ctl, 'HOME', self.home),
                mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()),
                mock.patch.object(ctl, 'command', return_value=SimpleNamespace(returncode=1)),
                mock.patch.object(ctl, 'remaining_processes', return_value=[]),
                mock.patch.object(ctl, 'network_stop'),
                mock.patch.object(ctl, 'witnesses_stop')):
            self.patches.enter_context(patch)

    def job_state(self, runner_id=None):
        return {'repo': 'Acme/app', 'runner_id': runner_id, 'runner_name': self.name, 'job_id': 1}

    def inventory(self, *runners):
        return {'total_count': len(runners), 'runners': list(runners)}

    def test_creation_intent_is_durable_before_lost_jit_response(self):
        def request(_token, repo, suffix, method, payload):
            self.assertEqual(json.loads(self.state.read_text()), self.job_state())
            self.assertEqual(payload['name'], self.name)
            self.assertEqual((repo, suffix, method), ('Acme/app', 'actions/runners/generate-jitconfig', 'POST'))
            raise ctl.BoundaryError('github-api-unavailable')

        with mock.patch.object(ctl, 'prepare'), mock.patch.object(
                os, 'urandom', return_value=b'\x00' * 16), mock.patch.object(
                ctl, 'api', side_effect=request), self.assertRaises(ctl.BoundaryError):
            ctl.run_one(self.config, 'hidden', 'Acme/app', 1)
        self.assertEqual(json.loads(self.state.read_text()), self.job_state())
        self.assertEqual(stat.S_IMODE(self.state.stat().st_mode), 0o600)
        self.assertFalse((self.home / 'jit-config').exists())

    def test_uncertain_job_registration_recovered_by_exact_name(self):
        ctl.save_state(self.job_state())
        runner = {'id': 42, 'name': self.name}
        unrelated = {'id': 43, 'name': 'ordinary-runner'}
        with mock.patch.object(ctl, 'api', side_effect=[
                self.inventory(runner, unrelated), None, self.inventory(unrelated)]) as request:
            ctl.cleanup(self.config, 'hidden')
        self.assertEqual(request.call_args_list[1].args, ('hidden', 'Acme/app', 'actions/runners/42', 'DELETE'))
        self.assertEqual(json.loads(self.state.read_text()), {})

    def test_valid_jit_response_records_id_but_not_secret_in_recovery_state(self):
        response = {'runner': {'id': 42, 'name': self.name}, 'encoded_jit_config': 'fixture-jit-secret'}
        with mock.patch.object(ctl, 'prepare'), mock.patch.object(
                os, 'urandom', return_value=b'\x00' * 16), mock.patch.object(
                ctl, 'api', return_value=response), mock.patch.object(os, 'chown') as chown, \
                mock.patch.object(ctl, 'inside', return_value=SimpleNamespace(stdout='inactive')):
            ctl.run_one(self.config, 'hidden', 'Acme/app', 1)
        self.assertEqual(json.loads(self.state.read_text()), self.job_state(42))
        self.assertNotIn('fixture-jit-secret', self.state.read_text())
        self.assertEqual(stat.S_IMODE((self.home / 'jit-config').stat().st_mode), 0o600)
        chown.assert_called_once_with(self.home / 'jit-config', self.config['uid'], self.config['uid'])

    def test_unresolved_creation_never_discards_intent_or_starts_another_runner(self):
        ctl.save_state(self.job_state())
        with mock.patch.object(ctl, 'api', return_value=self.inventory()) as request, self.assertRaisesRegex(
                ctl.BoundaryError, 'registration-create-outcome-unresolved'):
            ctl.cleanup(self.config, 'hidden')
        self.assertEqual(request.call_count, 1)
        self.assertEqual(json.loads(self.state.read_text()), self.job_state())

    def test_revoked_repository_access_keeps_job_recovery_state(self):
        ctl.save_state(self.job_state(42))
        error = ctl.urllib.error.HTTPError('https://api.github.com/hidden', 404, 'fixture', {}, None)
        with mock.patch.object(ctl, 'load_config', return_value=self.config), mock.patch.object(
                ctl.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = error
            with self.assertRaises(ctl.BoundaryError):
                ctl.cleanup(self.config, 'hidden')
        self.assertEqual(json.loads(self.state.read_text()), self.job_state(42))

    def test_delete_error_requires_accessible_inventory_before_clearing_state(self):
        ctl.save_state(self.job_state(42))
        runner = {'id': 42, 'name': self.name}
        with mock.patch.object(ctl, 'api', side_effect=[
                self.inventory(runner), ctl.BoundaryError('github-api-http-404'),
                ctl.BoundaryError('github-api-http-404')]), self.assertRaises(ctl.BoundaryError):
            ctl.cleanup(self.config, 'hidden')
        self.assertEqual(json.loads(self.state.read_text()), self.job_state(42))

    def test_auto_removed_runner_is_confirmed_without_discarding_unrelated_runner(self):
        ctl.save_state(self.job_state(42))
        runner = {'id': 42, 'name': self.name}
        unrelated = {'id': 43, 'name': 'ordinary-runner'}
        with mock.patch.object(ctl, 'api', side_effect=[
                self.inventory(runner, unrelated), ctl.BoundaryError('github-api-http-404'),
                self.inventory(unrelated)]) as request:
            ctl.cleanup(self.config, 'hidden')
        self.assertEqual(json.loads(self.state.read_text()), {})
        self.assertEqual(request.call_args_list[1].args[2], 'actions/runners/42')

    def test_restart_cleans_mounted_job_before_digest_but_still_gates_new_jobs(self):
        for valid in (True, False):
            with self.subTest(valid=valid):
                events = []
                receipt = {'passed': True, 'configuration_sha256': 'config',
                           'boundary_sha256': 'boundary' if valid else 'old-boundary', 'boot_id': 'boot'}

                def digest(_config):
                    self.assertEqual(events, ['cleanup'])
                    events.append('digest')
                    return 'boundary'

                with mock.patch.dict(os.environ, {'CREDENTIALS_DIRECTORY': '/root/fixture-credentials'}), \
                        mock.patch.object(ctl, 'protected_file', side_effect=lambda path: (
                            'hidden' if Path(path).name == 'github-token' else json.dumps(receipt))), \
                        mock.patch.object(ctl, 'cleanup', side_effect=lambda *_: events.append('cleanup')), \
                        mock.patch.object(ctl, 'config_digest', return_value='config'), \
                        mock.patch.object(ctl, 'boundary_digest', side_effect=digest), \
                        mock.patch.object(Path, 'read_text', return_value='boot'), \
                        mock.patch.object(ctl, 'STOP', True), mock.patch.object(ctl, 'find_job') as find_job:
                    if valid:
                        ctl.serve(self.config)
                    else:
                        with self.assertRaisesRegex(ctl.BoundaryError, 'current-configuration-not-validated'):
                            ctl.serve(self.config)
                    find_job.assert_not_called()
                self.assertEqual(events, ['cleanup', 'digest'])

    def test_invalid_inventory_cannot_confirm_absence(self):
        for inventory in (
                {'total_count': 1, 'runners': []},
                {'total_count': 0, 'runners': None},
                {'total_count': 1001, 'runners': []},
                {'total_count': 1, 'runners': [{'id': True, 'name': self.name}]},
        ):
            with self.subTest(inventory=inventory), self.assertRaises(ctl.BoundaryError):
                ctl.owned_runner(lambda *_: inventory, 'hidden', 'Acme/app', self.name, 42)

    def test_inventory_drift_preserves_evidence_of_a_surviving_runner(self):
        first_page = [{'id': index, 'name': f'ordinary-{index}'} for index in range(1, 101)]
        second_page = [{'id': index, 'name': f'ordinary-{index}'} for index in range(151, 202)]
        request = mock.Mock(side_effect=[
            {'total_count': 201, 'runners': first_page},
            {'total_count': 151, 'runners': second_page},
        ])
        with self.assertRaisesRegex(ctl.BoundaryError, 'registration-inventory-changed'):
            ctl.owned_runner(request, 'hidden', 'Acme/app', self.name, 125)

    def test_definitively_rejected_jit_creation_can_recover_without_unknown_intent(self):
        for status in ctl.REGISTRATION_REJECTIONS:
            with self.subTest(status=status), mock.patch.object(ctl, 'prepare'), mock.patch.object(
                    ctl, 'load_config', return_value=self.config), mock.patch.object(
                    ctl.urllib.request, 'build_opener') as opener:
                opener.return_value.open.side_effect = ctl.urllib.error.HTTPError(
                    'https://api.github.com/hidden', status, 'fixture', {}, None)
                with self.assertRaisesRegex(ctl.BoundaryError, 'runner-registration-rejected'):
                    ctl.run_one(self.config, 'hidden', 'Acme/app', 1)
            self.assertEqual(json.loads(self.state.read_text()), {})

    def test_server_failure_remains_uncertain_and_preserves_intent(self):
        with mock.patch.object(ctl, 'prepare'), mock.patch.object(
                os, 'urandom', return_value=b'\x00' * 16), mock.patch.object(
                ctl, 'load_config', return_value=self.config), mock.patch.object(
                ctl.urllib.request, 'build_opener') as opener:
            opener.return_value.open.side_effect = ctl.urllib.error.HTTPError(
                'https://api.github.com/hidden', 503, 'fixture', {}, None)
            with self.assertRaisesRegex(ctl.BoundaryError, 'github-api-http-503'):
                ctl.run_one(self.config, 'hidden', 'Acme/app', 1)
        self.assertEqual(json.loads(self.state.read_text()), self.job_state())

    def test_invalid_state_is_not_silently_cleared(self):
        self.state.write_text('[]')
        with self.assertRaisesRegex(ctl.BoundaryError, 'invalid-job-recovery-state'):
            ctl.cleanup(self.config, 'hidden')
        self.assertEqual(self.state.read_text(), '[]')

    def test_inventory_is_paginated_and_the_owned_name_is_exact(self):
        first_page = [{'id': index, 'name': f'ordinary-{index}'} for index in range(1, 101)]
        runner = {'id': 101, 'name': self.name}
        request = mock.Mock(side_effect=[
            {'total_count': 101, 'runners': first_page},
            {'total_count': 101, 'runners': [runner]},
        ])
        self.assertEqual(ctl.owned_runner(request, 'hidden', 'Acme/app', self.name, None), runner)
        self.assertEqual(request.call_args_list[1].args[2], 'actions/runners?per_page=100&page=2')

if __name__ == '__main__':
    unittest.main()
