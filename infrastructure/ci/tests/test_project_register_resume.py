"""Registration acknowledgement recovery; private temporary state and no host/API work."""
import contextlib
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('project_register_resume_manage', ROOT / 'manage.py')
manage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manage)
ctl = manage.ctl


class ProjectRegisterResumeTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        settings = self.directory / 'settings'
        settings.mkdir(mode=0o700)
        self.config_path = settings / 'config.json'
        self.base = self.directory / 'slot0'
        self.pool = self.directory / 'pool'
        self.installed = self.directory / 'installed'
        self.context = self.directory / 'context'
        for directory in (self.base, self.pool, self.installed, self.context):
            directory.mkdir(mode=0o700)
        self.config = json.loads((ROOT / 'ci-runner/config.pool.example.json').read_text())
        self.config['projects'] = {'other-app': {'repository': 'Acme/other-app'}}
        self.config_path.write_text(json.dumps(self.config))  # Noncanonical raw predecessor.
        self.config_path.chmod(0o600)
        self.expected = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        self.project_path = self.context / 'project.json'
        self.project = {'slug': 'sample-app', 'repository': 'Acme/sample-app'}
        self.project_path.write_text(json.dumps(self.project))
        self.project_path.chmod(0o600)
        self.journal = self.context / 'ci-registration.json'
        self.receipts = []
        for index in range(self.config['worker_slots']):
            directory = self.base if index == 0 else self.pool / 'slots' / str(index)
            directory.mkdir(parents=True, exist_ok=True)
            for name in ('validation.json', 'validation-failure.json'):
                path = directory / name
                path.write_text('{}')
                self.receipts.append(path)
        self.pool_receipt = self.pool / 'pool-validation.json'
        self.pool_receipt.write_text('{}')
        self.receipts.append(self.pool_receipt)
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.proof = mock.Mock()
        for patch in (
                mock.patch.object(manage, 'root_required'),
                mock.patch.object(manage, 'source_protected'),
                mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext),
                mock.patch.object(manage, 'require_idle'),
                mock.patch.object(manage, 'INSTALLED', self.installed),
                mock.patch.object(ctl, 'CONFIG', self.config_path),
                mock.patch.object(ctl, 'BASE', self.base),
                mock.patch.object(ctl, 'POOL_BASE', self.pool),
                mock.patch.object(ctl, 'protected_path', side_effect=lambda path, **_kw: Path(path)),
                mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()),
                mock.patch.object(manage, 'registration_token', return_value=object()),
                mock.patch.object(manage, 'verify_permissions', self.proof),
                mock.patch.object(manage, 'permission_request', side_effect=AssertionError('no live API'))):
            self.stack.enter_context(patch)

    def register(self):
        return manage.register(str(self.project_path), self.expected, str(self.journal))

    def verify(self):
        return manage.verify_registration(str(self.project_path), self.expected, str(self.journal))

    def test_exact_registration_persists_intent_before_proof_and_invalidates_all_receipts_before_publication(self):
        original = manage.atomic_config
        def proof(*_args):
            self.assertEqual(json.loads(self.journal.read_text())['phase'], 'started')
            self.assertEqual(hashlib.sha256(self.config_path.read_bytes()).hexdigest(), self.expected)
        self.proof.side_effect = proof
        def publish(config):
            self.assertFalse(any(path.exists() for path in self.receipts))
            original(config)
        with mock.patch.object(manage, 'atomic_config', side_effect=publish):
            result = self.register()
        expected = copy.deepcopy(self.config)
        expected['projects']['sample-app'] = {'repository': 'Acme/sample-app'}
        self.assertEqual(json.loads(self.config_path.read_text()), expected)
        self.assertEqual(result['configuration_sha256'], hashlib.sha256(self.config_path.read_bytes()).hexdigest())
        self.assertEqual(result['predecessor_sha256'], self.expected)
        self.assertEqual(result['journal'], str(self.journal))
        self.assertFalse(result['resumed'])
        self.assertTrue(result['full_validation_required'])
        self.assertFalse(result['controller_enabled'])
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'verified')
        self.assertEqual(stat.S_IMODE(self.journal.stat().st_mode), 0o600)

    def test_validation_failure_rerun_accepts_own_candidate_and_does_not_repeat_proof_or_write(self):
        self.register()
        config_bytes = self.config_path.read_bytes()
        journal_bytes = self.journal.read_bytes()
        failure = self.base / 'validation-failure.json'
        failure.write_text('{"private":"failed validation observation"}')
        with mock.patch.object(manage, 'atomic_config') as publish, \
                mock.patch.object(manage, 'save_registration_journal') as save:
            result = self.register()
        publish.assert_not_called()
        save.assert_not_called()
        self.assertEqual(self.proof.call_count, 1)
        self.assertTrue(result['resumed'])
        self.assertEqual(self.config_path.read_bytes(), config_bytes)
        self.assertEqual(self.journal.read_bytes(), journal_bytes)
        self.assertTrue(failure.exists())

    def test_response_lost_after_replace_recovers_candidate_without_new_proof(self):
        original = manage.atomic_config
        def publish(config):
            original(config)
            raise OSError('fixture acknowledgement lost')
        with mock.patch.object(manage, 'atomic_config', side_effect=publish), self.assertRaises(OSError):
            self.register()
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'started')
        with mock.patch.object(manage, 'atomic_config') as publish:
            result = self.register()
        publish.assert_not_called()
        self.assertEqual(self.proof.call_count, 1)
        self.assertTrue(result['resumed'])
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'verified')

    def test_verified_journal_write_failure_is_recoverable(self):
        original = manage.save_registration_journal
        def save(path, value):
            if value['phase'] == 'verified':
                raise OSError('fixture journal seal lost')
            original(path, value)
        with mock.patch.object(manage, 'save_registration_journal', side_effect=save), self.assertRaises(OSError):
            self.register()
        self.register()
        self.assertEqual(self.proof.call_count, 1)
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'verified')

    def test_interruption_before_config_publication_can_retry_original_predecessor(self):
        with mock.patch.object(manage, 'atomic_config', side_effect=OSError('fixture before replace')), self.assertRaises(OSError):
            self.register()
        self.assertEqual(hashlib.sha256(self.config_path.read_bytes()).hexdigest(), self.expected)
        self.assertTrue(self.register()['resumed'])
        self.assertEqual(self.proof.call_count, 2)  # Earlier completed proof was cleaned; no uncertain proof ledger.

    def test_wrong_hash_existing_slug_duplicate_repository_and_active_workers_do_not_create_journal(self):
        with self.assertRaises(ctl.BoundaryError):
            manage.register(str(self.project_path), '0' * 64, str(self.journal))
        for project in ({'slug': 'other-app', 'repository': 'Acme/new'},
                        {'slug': 'sample-app', 'repository': 'acme/OTHER-app'}):
            self.project_path.write_text(json.dumps(project))
            with self.assertRaises(ctl.BoundaryError):
                self.register()
        self.project_path.write_text(json.dumps(self.project))
        with mock.patch.object(manage, 'require_idle', side_effect=ctl.BoundaryError('ci-processes-still-active')):
            with self.assertRaises(ctl.BoundaryError):
                self.register()
        self.assertFalse(self.journal.exists())
        self.assertEqual(hashlib.sha256(self.config_path.read_bytes()).hexdigest(), self.expected)
        self.proof.assert_not_called()

    def test_pending_uncertain_proof_blocks_predecessor_and_candidate_resume(self):
        proof = self.base / 'registration-proof.json'
        proof.write_text('{}')
        with self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            self.register()
        self.assertFalse(self.journal.exists())
        proof.unlink()
        self.register()
        proof.write_text('{}')
        with self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            self.register()
        self.assertEqual(self.proof.call_count, 1)

    def test_journal_payload_reuse_candidate_forgery_and_configuration_drift_fail_closed(self):
        self.register()
        journal = self.journal.read_bytes()
        for mutation in ('operation', 'phase', 'project', 'candidate_sha256', 'predecessor_config', 'extra'):
            value = json.loads(journal)
            if mutation == 'project':
                value['project'] = {'slug': 'other-app', 'repository': 'Acme/other-app'}
            elif mutation == 'predecessor_config':
                value['predecessor_config']['poll_seconds'] += 1
            elif mutation == 'extra':
                value['extra'] = True
            else:
                value[mutation] = 'wrong'
            self.journal.write_text(json.dumps(value))
            with self.assertRaises(ctl.BoundaryError):
                self.register()
        self.journal.write_bytes(journal)
        candidate = json.loads(self.config_path.read_text())
        candidate['poll_seconds'] += 1
        self.config_path.write_text(json.dumps(candidate))
        with self.assertRaisesRegex(ctl.BoundaryError, 'register-configuration-changed'):
            self.register()
        self.assertEqual(self.proof.call_count, 1)

    def test_unsafe_journal_paths_and_hardlinks_are_rejected_without_mutation(self):
        for path in (self.config_path, self.project_path, self.base / 'ci-registration.json',
                     self.pool / 'ci-registration.json', self.installed / 'ci-registration.json',
                     self.context / 'progress.json', Path('ci-registration.json')):
            with self.subTest(path=path), self.assertRaises(ctl.BoundaryError):
                manage.register(str(self.project_path), self.expected, str(path))
        self.journal.hardlink_to(self.project_path)
        with self.assertRaises(ctl.BoundaryError):
            self.register()
        self.journal.unlink()
        self.journal.symlink_to(self.project_path)
        with self.assertRaises(ctl.BoundaryError):
            self.register()
        self.journal.unlink()
        with mock.patch.object(ctl, 'protected_path', side_effect=ctl.BoundaryError('unsafe-protected-parent')):
            with self.assertRaisesRegex(ctl.BoundaryError, 'unsafe-protected-parent'):
                self.register()
        self.proof.assert_not_called()
        self.assertEqual(hashlib.sha256(self.config_path.read_bytes()).hexdigest(), self.expected)

    def test_legacy_registration_keeps_duplicate_failure_and_cli_journal_is_optional(self):
        result = manage.register(str(self.project_path), self.expected)
        self.assertEqual(set(result), {'operation', 'registered', 'configuration_sha256', 'controller_enabled', 'full_validation_required'})
        with self.assertRaisesRegex(ctl.BoundaryError, 'configuration-changed'):
            manage.register(str(self.project_path), self.expected)
        with mock.patch.object(manage, 'register', return_value={}) as register, mock.patch('builtins.print'):
            self.assertEqual(manage.main(['register', '--project', str(self.project_path),
                '--expected-config-sha256', self.expected]), 0)
        register.assert_called_once_with(str(self.project_path), self.expected, None)

    def write_controller(self, rejection=False):
        content = (f'from pathlib import Path\nimport json\nCONFIG = Path({str(self.config_path)!r})\n'
                   'def load_config():\n    return json.loads(CONFIG.read_text())\n'
                   'def verify_pool_receipts(config):\n'
                   + ('    raise RuntimeError("private validation failure")\n' if rejection else
                      '    assert config == load_config()\n'))
        path = self.installed / 'controller.py'
        path.write_text(content)
        path.chmod(0o755)
        return path

    def test_verify_uses_exact_installed_controller_not_copied_source_and_does_not_write_bytecode(self):
        self.register()
        controller = self.write_controller()
        before = self.journal.read_bytes(), self.config_path.read_bytes()
        with mock.patch.object(manage, 'trusted_executable'), mock.patch.object(ctl, 'verify_pool_receipts', side_effect=AssertionError('copied verifier forbidden')):
            result = self.verify()
        self.assertEqual(result['operation'], 'verify-registration')
        self.assertTrue(result['validation_verified'])
        self.assertEqual(result['registered'], 'sample-app')
        self.assertEqual(result['repository'], 'Acme/sample-app')
        self.assertEqual(result['predecessor_sha256'], self.expected)
        self.assertEqual(result['installed_controller_sha256'], hashlib.sha256(controller.read_bytes()).hexdigest())
        self.assertFalse(result['controller_enabled'])
        self.assertEqual(before, (self.journal.read_bytes(), self.config_path.read_bytes()))
        self.assertFalse((self.installed / '__pycache__').exists())
        self.assertEqual(self.proof.call_count, 1)

    def test_verify_rejects_missing_or_started_journal_stale_receipts_config_mismatch_and_untrusted_source(self):
        with self.assertRaises(ctl.BoundaryError):
            self.verify()
        self.register()
        self.write_controller(rejection=True)
        with mock.patch.object(manage, 'trusted_executable'), self.assertRaisesRegex(ctl.BoundaryError, 'register-current-validation-required'):
            self.verify()
        self.write_controller()
        with mock.patch.object(manage, 'trusted_executable', side_effect=ctl.BoundaryError('untrusted-installed-controller')):
            with self.assertRaisesRegex(ctl.BoundaryError, 'untrusted-installed-controller'):
                self.verify()
        value = json.loads(self.journal.read_text())
        value['phase'] = 'started'
        self.journal.write_text(json.dumps(value))
        with self.assertRaises(ctl.BoundaryError):
            self.verify()

    def test_actual_installed_receipt_verifier_rejects_stale_boot_config_boundary_and_pool(self):
        self.register()
        controller = self.installed / 'controller.py'
        content = (ROOT / 'ci-runner/controller.py').read_text()
        content = content.replace("BASE = Path('/var/lib/web-app-ci')", f'BASE = Path({str(self.base)!r})', 1)
        content = content.replace("CONFIG = Path('/etc/web-app-ci/config.json')", f'CONFIG = Path({str(self.config_path)!r})', 1)
        content = content.replace('POOL_BASE = BASE', f'POOL_BASE = Path({str(self.pool)!r})', 1)
        # Keep the actual installed verify_pool_receipts and pool_receipt code;
        # fixtures supply only OS file admission and deterministic boundary hashes.
        content += '\nprotected_path = lambda path, directory=False: Path(path)\n'
        content += 'protected_file = lambda path: Path(path).read_text()\n'
        content += 'boundary_digest = lambda config: "fixture-boundary-" + str(config["uid"])\n'
        controller.write_text(content)
        controller.chmod(0o755)
        config = json.loads(self.config_path.read_text())
        configuration_sha = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        boot = Path('/proc/sys/kernel/random/boot_id').read_text().strip()
        paths = []
        for index in range(config['worker_slots']):
            directory = self.base if index == 0 else self.pool / 'slots' / str(index)
            path = directory / 'validation.json'
            value = {'passed': True, 'configuration_sha256': configuration_sha,
                     'boot_id': boot, 'boundary_sha256': 'fixture-boundary-' + str(config['uid'] + index)}
            path.write_text(json.dumps(value))
            paths.append(path)
        pool = {'schema_version': 1, 'passed': True, 'worker_slots': config['worker_slots'],
                'configuration_sha256': configuration_sha, 'boot_id': boot,
                'boundaries': ['fixture-boundary-' + str(config['uid'] + index) for index in range(config['worker_slots'])]}
        self.pool_receipt.write_text(json.dumps(pool))
        with mock.patch.object(manage, 'trusted_executable'):
            self.assertTrue(self.verify()['validation_verified'])
            for field, value in (('boot_id', 'previous-boot'), ('configuration_sha256', '0' * 64),
                                 ('boundary_sha256', 'other-boundary'), ('passed', False)):
                original = paths[-1].read_text()
                receipt = json.loads(original)
                receipt[field] = value
                paths[-1].write_text(json.dumps(receipt))
                with self.subTest(field=field), self.assertRaisesRegex(ctl.BoundaryError, 'register-current-validation-required'):
                    self.verify()
                paths[-1].write_text(original)
            self.pool_receipt.unlink()
            with self.assertRaisesRegex(ctl.BoundaryError, 'register-current-validation-required'):
                self.verify()

    def test_verify_rejects_installed_controller_bound_to_another_configuration_path(self):
        self.register()
        controller = self.write_controller()
        content = controller.read_text().replace(str(self.config_path), str(self.directory / 'other-config.json'))
        controller.write_text(content)
        with mock.patch.object(manage, 'trusted_executable'), self.assertRaisesRegex(ctl.BoundaryError, 'register-installed-configuration-mismatch'):
            self.verify()

    def test_foreign_installed_controller_load_failure_is_normalized_without_private_details(self):
        self.register()
        controller = self.write_controller()
        controller.write_text(controller.read_text() +
            '\nclass BoundaryError(Exception):\n    pass\n'
            'def load_config():\n    raise BoundaryError("private fixture value")\n')
        with mock.patch.object(manage, 'trusted_executable'), self.assertRaises(ctl.BoundaryError) as outcome:
            self.verify()
        self.assertEqual(str(outcome.exception), 'register-installed-controller-unavailable')

    def test_verified_journal_cannot_authorize_reverting_to_predecessor(self):
        self.register()
        self.config_path.write_text(json.dumps(self.config))
        with self.assertRaisesRegex(ctl.BoundaryError, 'register-configuration-changed'):
            self.register()
        self.assertEqual(self.proof.call_count, 1)


if __name__ == '__main__':
    unittest.main()
