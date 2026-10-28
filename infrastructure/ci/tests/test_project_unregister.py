"""Guarded unregister transactions; temporary files and no host/API mutation."""
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
spec = importlib.util.spec_from_file_location('project_unregister_manage', ROOT / 'manage.py')
manage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manage)
ctl = manage.ctl


class ProjectUnregisterTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        self.config_path = self.directory / 'config.json'
        self.base = self.directory / 'slot0'
        self.pool = self.directory / 'pool'
        self.base.mkdir()
        self.pool.mkdir()
        self.config = json.loads((ROOT / 'ci-runner/config.pool.example.json').read_text())
        self.config['projects'] = {'sample-app': {'repository': 'Acme/sample-app'},
                                   'other-app': {'repository': 'Acme/other-app'}}
        self.config_path.write_text(json.dumps(self.config))
        self.config_path.chmod(0o600)
        self.expected = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        self.project_path = self.directory / 'project.json'
        self.project = {'slug': 'sample-app', 'repository': 'Acme/sample-app'}
        self.project_path.write_text(json.dumps(self.project))
        self.journal = self.directory / 'unregister.json'
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
        patches = contextlib.ExitStack()
        self.addCleanup(patches.close)
        for patch in (
                mock.patch.object(manage, 'root_required'),
                mock.patch.object(manage, 'source_protected'),
                mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext),
                mock.patch.object(manage, 'require_idle'),
                mock.patch.object(ctl, 'CONFIG', self.config_path),
                mock.patch.object(ctl, 'BASE', self.base),
                mock.patch.object(ctl, 'POOL_BASE', self.pool),
                mock.patch.object(ctl, 'protected_path', side_effect=lambda path, **_kw: Path(path)),
                mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()),
                mock.patch.object(manage, 'permission_request', side_effect=AssertionError('no API calls'))):
            patches.enter_context(patch)

    def unregister(self):
        return manage.unregister(str(self.project_path), self.expected, str(self.journal))

    def assert_unchanged(self):
        self.assertEqual(hashlib.sha256(self.config_path.read_bytes()).hexdigest(), self.expected)
        self.assertTrue(all(path.exists() for path in self.receipts))

    def test_exact_removal_preserves_all_other_config_and_invalidates_every_receipt_first(self):
        original = manage.atomic_config

        def publish(config):
            self.assertFalse(any(path.exists() for path in self.receipts))
            self.assertEqual(json.loads(self.journal.read_text())['phase'], 'started')
            original(config)

        with mock.patch.object(manage, 'atomic_config', side_effect=publish):
            result = self.unregister()
        expected = copy.deepcopy(self.config)
        del expected['projects']['sample-app']
        self.assertEqual(json.loads(self.config_path.read_text()), expected)
        self.assertEqual(result['configuration_sha256'], hashlib.sha256(self.config_path.read_bytes()).hexdigest())
        self.assertTrue(result['full_validation_required'])
        self.assertFalse(result['controller_enabled'])
        self.assertFalse(result['empty_pool'])
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'verified')
        self.assertEqual(stat.S_IMODE(self.journal.stat().st_mode), 0o600)
        self.assertEqual(stat.S_IMODE(self.config_path.stat().st_mode), 0o600)
        self.assertEqual(list(self.directory.glob('.pool-migration-*')), [])

    def test_wrong_expected_hash_and_identity_fail_before_journal_or_receipt_changes(self):
        for variant in ('hash', 'repository', 'slug'):
            with self.subTest(variant=variant):
                project = dict(self.project)
                if variant == 'hash':
                    self.expected = '0' * 64
                elif variant == 'repository':
                    project['repository'] = 'Acme/other-app'
                else:
                    project['slug'] = 'sample'
                self.project_path.write_text(json.dumps(project))
                with self.assertRaises(ctl.BoundaryError):
                    self.unregister()
                self.assertFalse(self.journal.exists())
                self.expected = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
                self.assert_unchanged()

    def test_active_worker_or_pending_proof_prevents_mutation(self):
        with mock.patch.object(manage, 'require_idle', side_effect=ctl.BoundaryError('ci-processes-still-active')):
            with self.assertRaisesRegex(ctl.BoundaryError, 'ci-processes-still-active'):
                self.unregister()
        (self.base / 'registration-proof.json').write_text('{}')
        with self.assertRaisesRegex(ctl.BoundaryError, 'registration-recovery-required'):
            self.unregister()
        self.assert_unchanged()
        self.assertFalse(self.journal.exists())

    def test_journal_is_durable_before_invalidation_and_failed_publication_resumes(self):
        with mock.patch.object(manage, 'atomic_config', side_effect=OSError('interrupted')):
            with self.assertRaises(OSError):
                self.unregister()
        self.assertEqual(hashlib.sha256(self.config_path.read_bytes()).hexdigest(), self.expected)
        self.assertFalse(any(path.exists() for path in self.receipts))
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'started')
        result = self.unregister()
        self.assertTrue(result['full_validation_required'])
        self.assertNotIn('sample-app', json.loads(self.config_path.read_text())['projects'])

    def test_lost_response_after_config_publication_resumes_with_original_hash(self):
        original = manage.atomic_config

        def publish_then_interrupt(config):
            original(config)
            raise OSError('response lost after atomic replace')

        with mock.patch.object(manage, 'atomic_config', side_effect=publish_then_interrupt):
            with self.assertRaises(OSError):
                self.unregister()
        candidate_sha = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        self.assertNotEqual(candidate_sha, self.expected)
        result = self.unregister()
        self.assertEqual(result['configuration_sha256'], candidate_sha)
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'verified')
        with mock.patch.object(manage, 'atomic_config') as publish:
            self.assertEqual(self.unregister(), result)
        publish.assert_not_called()

    def test_failed_verified_journal_write_resumes_candidate_without_republication(self):
        original = manage.save_unregister_journal

        def save(path, value):
            if value['phase'] == 'verified':
                raise OSError('journal acknowledgement lost')
            original(path, value)

        with mock.patch.object(manage, 'save_unregister_journal', side_effect=save):
            with self.assertRaises(OSError):
                self.unregister()
        self.assertEqual(json.loads(self.journal.read_text())['phase'], 'started')
        with mock.patch.object(manage, 'atomic_config') as publish:
            self.unregister()
        publish.assert_not_called()

    def test_unrelated_config_drift_and_reused_journal_fail_closed(self):
        self.unregister()
        candidate = json.loads(self.config_path.read_text())
        candidate['poll_seconds'] += 1
        self.config_path.write_text(json.dumps(candidate))
        with self.assertRaisesRegex(ctl.BoundaryError, 'unregister-configuration-changed'):
            self.unregister()
        self.project_path.write_text(json.dumps({'slug': 'other-app', 'repository': 'Acme/other-app'}))
        with self.assertRaisesRegex(ctl.BoundaryError, 'invalid-unregister-journal'):
            self.unregister()
        self.assertIn('other-app', json.loads(self.config_path.read_text())['projects'])

    def test_last_consumer_leaves_empty_disabled_configuration(self):
        del self.config['projects']['other-app']
        self.config_path.write_text(json.dumps(self.config))
        self.expected = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        result = self.unregister()
        self.assertEqual(json.loads(self.config_path.read_text())['projects'], {})
        self.assertTrue(result['empty_pool'])
        self.assertFalse(result['full_validation_required'])
        self.assertFalse(result['controller_enabled'])

    def test_unsafe_journal_parent_or_leaf_is_rejected_before_mutation(self):
        for create_leaf in (False, True):
            with self.subTest(create_leaf=create_leaf):
                if create_leaf:
                    self.journal.symlink_to(self.project_path)
                with mock.patch.object(ctl, 'protected_path', side_effect=ctl.BoundaryError('unsafe-protected-parent')):
                    with self.assertRaisesRegex(ctl.BoundaryError, 'unsafe-protected-parent'):
                        self.unregister()
                self.journal.unlink(missing_ok=True)
                self.assert_unchanged()


if __name__ == '__main__':
    unittest.main()
