"""Slot scheduling and migration regressions without host/GitHub mutations."""
import contextlib
import copy
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('worker_pool_manage', ROOT / 'manage.py')
manage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(manage)
ctl = manage.ctl
BASELINE = json.loads((ROOT / 'ci-runner/config.example.json').read_text())
POOL = json.loads((ROOT / 'ci-runner/config.pool.example.json').read_text())


class SlotConfigurationTests(unittest.TestCase):
    def test_legacy_configuration_is_unchanged(self):
        config = copy.deepcopy(BASELINE)
        self.assertEqual(ctl.validate_config(config), BASELINE)
        self.assertEqual(ctl.slot_config(config, 0), BASELINE)
        with self.assertRaisesRegex(ctl.BoundaryError, 'invalid-worker-slot'):
            ctl.slot_config(config, 1)

    def test_explicit_aggregate_budgets_cannot_be_oversubscribed(self):
        for change in ({'worker_slots': True}, {'worker_slots': 9},
                       {'ci_cpu_budget_percent': 1199}, {'ci_memory_budget_mib': 18431},
                       {'ci_memory_budget_mib': True}, {'uid': 64999}):
            config = dict(POOL, **change)
            with self.subTest(change=change), self.assertRaises(ctl.BoundaryError):
                ctl.validate_config(config)
        config = copy.deepcopy(POOL)
        del config['ci_memory_budget_mib']
        with self.assertRaisesRegex(ctl.BoundaryError, 'explicit-pool-resource-budget-required'):
            ctl.validate_config(config)

    def test_slots_have_nonoverlapping_uids_subuids_and_boundaries(self):
        identities, addresses, roots, devices, firewalls = set(), set(), set(), set(), set()
        original = (ctl.BASE, ctl.NETNS, ctl.CLIENT)
        for index in range(6):
            worker = ctl.slot_config(POOL, index)
            identities.add((worker['uid'], worker['subuid_start']))
            if index:
                previous = ctl.slot_config(POOL, index - 1)
                self.assertEqual(worker['subuid_start'] - previous['subuid_start'], 65536)
            with ctl.slot_context(index):
                roots.add(ctl.ROOTFS)
                addresses.add(ctl.CLIENT)
                devices.add((ctl.NETNS, ctl.VETH, ctl.PEER))
                firewalls.add(ctl.FIREWALL)
                self.assertEqual(ctl.HOME, ctl.BASE / 'job/home')
                self.assertEqual(ctl.STATE, ctl.BASE / 'controller.json')
        self.assertEqual([len(values) for values in (identities, roots, addresses, devices, firewalls)], [6] * 5)
        self.assertEqual((ctl.BASE, ctl.NETNS, ctl.CLIENT), original)

    def test_slot_context_restored_after_boundary_failure(self):
        original = (ctl.BASE, ctl.NETNS, ctl.FIREWALL)
        with self.assertRaises(RuntimeError), ctl.slot_context(3):
            raise RuntimeError('fixture')
        self.assertEqual((ctl.BASE, ctl.NETNS, ctl.FIREWALL), original)

    def test_capacity_uses_actual_memory_and_cpu_not_nominal_ram(self):
        with mock.patch.object(Path, 'read_text', return_value='MemTotal:       32078240 kB\n'), \
                mock.patch.object(os, 'cpu_count', return_value=16):
            ctl.pool_capacity(POOL)
            with self.assertRaisesRegex(ctl.BoundaryError, 'pool-exceeds-host-memory-budget'):
                ctl.pool_capacity(dict(POOL, ci_memory_budget_mib=24576))
        with mock.patch.object(Path, 'read_text', return_value='MemTotal:       64000000 kB\n'), \
                mock.patch.object(os, 'cpu_count', return_value=8), \
                self.assertRaisesRegex(ctl.BoundaryError, 'pool-exceeds-host-cpu-budget'):
            ctl.pool_capacity(POOL)

    def test_durable_pool_intent_is_nonsecret_and_rejects_invalid_state(self):
        with tempfile.TemporaryDirectory() as directory, mock.patch.object(ctl, 'POOL_BASE', Path(directory)), \
                mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()):
            intent = {'0': {'repo': 'Acme/app', 'job_id': 42}}
            ctl.pool_state(intent)
            self.assertEqual(ctl.pool_state(), intent)
            self.assertEqual((Path(directory) / 'pool.json').stat().st_mode & 0o777, 0o600)
            for invalid in ({'8': intent['0']}, {'0': {'repo': 'Acme/app', 'job_id': True}},
                            {'0': dict(intent['0'], token='forbidden')}, []):
                (Path(directory) / 'pool.json').write_text(json.dumps(invalid))
                with self.subTest(invalid=invalid), self.assertRaises(ctl.BoundaryError):
                    ctl.pool_state()

    def test_reserved_observations_not_selected_twice(self):
        config = dict(POOL, projects={'app': {'repository': 'Acme/app'}})
        def api(_token, _repo, suffix):
            if suffix.startswith('actions/runs?'):
                return {'workflow_runs': [{'id': 10, 'event': 'pull_request'}]}
            return {'jobs': [{'id': index, 'created_at': '2026-10-21T00:00:00Z',
                              'status': 'queued', 'labels': sorted(ctl.LABELS)} for index in (1, 2)]}
        with mock.patch.object(ctl, 'load_config', return_value=config), mock.patch.object(ctl, 'api', side_effect=api):
            self.assertEqual(ctl.find_job('fixture', {('Acme/app', 1)}), ('Acme/app', 2))
            self.assertIsNone(ctl.find_job('fixture', {('Acme/app', 1), ('Acme/app', 2)}))


class SchedulerFixture:
    def setUp(self):
        self.config = dict(POOL, worker_slots=2, projects={'app': {'repository': 'Acme/app'}})
        self.events = []
        self.saved = {}
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        def state(value=None):
            if value is not None:
                self.saved = copy.deepcopy(value)
                self.events.append(('persist', copy.deepcopy(value)))
            return copy.deepcopy(self.saved)
        for patch in (mock.patch.dict(os.environ, {'CREDENTIALS_DIRECTORY': '/fixture'}),
                      mock.patch.object(ctl, 'app_credentials', return_value='fixture'),
                      mock.patch.object(ctl, 'pool_capacity'), mock.patch.object(ctl, 'verify_pool_receipts'),
                      mock.patch.object(ctl, 'admission_headroom', return_value=True),
                      mock.patch.object(ctl, 'cleanup', side_effect=lambda config, *_: self.events.append(('cleanup', config['uid']))),
                      mock.patch.object(ctl, 'pool_state', side_effect=state),
                      mock.patch.object(ctl, 'STOP', False)):
            self.stack.enter_context(patch)

class SchedulerTests(SchedulerFixture, unittest.TestCase):
    def test_two_slots_start_before_waiting_and_intents_precede_each_fork(self):
        def fork():
            self.events.append(('fork', copy.deepcopy(self.saved)))
            return 100 + len(self.saved)
        def sleep(_delay):
            self.assertEqual(len(self.saved), 2)
            ctl.STOP = True
        with mock.patch.object(ctl, 'find_jobs', return_value=(('Acme/app', 1), ('Acme/app', 2))), \
                mock.patch.object(os, 'fork', side_effect=fork), \
                mock.patch.object(os, 'waitpid', return_value=(0, 0)), \
                mock.patch.object(os, 'kill') as kill, mock.patch.object(ctl.time, 'sleep', side_effect=sleep):
            ctl.serve(self.config)
        forks = [event for event in self.events if event[0] == 'fork']
        self.assertEqual([len(event[1]) for event in forks], [1, 2])
        self.assertEqual(kill.call_count, 2)
        self.assertEqual(self.saved, {})
        self.assertEqual([event[1] for event in self.events if event[0] == 'cleanup'], [62041, 62042, 62041, 62042])

    def test_restart_recovers_every_slot_before_any_receipt_or_dispatch(self):
        self.saved = {'1': {'repo': 'Acme/app', 'job_id': 9}}
        ctl.STOP = True
        with mock.patch.object(ctl, 'find_job') as find:
            ctl.serve(self.config)
        find.assert_not_called()
        self.assertEqual(self.saved, {})
        self.assertEqual(self.events[:2], [('cleanup', 62041), ('cleanup', 62042)])

    def test_unknown_recovery_slot_fails_before_cleanup_or_dispatch(self):
        self.saved = {'7': {'repo': 'Acme/app', 'job_id': 9}}
        with mock.patch.object(ctl, 'find_job') as find, self.assertRaisesRegex(ctl.BoundaryError, 'pool-recovery-configuration-mismatch'):
            ctl.serve(self.config)
        find.assert_not_called()
        self.assertEqual(self.events, [])

    def test_worker_failure_stops_admission_and_preserves_cleanup_before_clear(self):
        with mock.patch.object(ctl, 'find_jobs', return_value=(('Acme/app', 1),)) as find, \
                mock.patch.object(os, 'fork', return_value=101), \
                mock.patch.object(os, 'waitpid', return_value=(101, 256)), \
                mock.patch.object(os, 'kill'), self.assertRaisesRegex(ctl.BoundaryError, 'worker-slot-failed'):
            ctl.serve(self.config)
        self.assertEqual(find.call_count, 1)
        self.assertEqual(self.saved, {})
        self.assertEqual(self.events[-1], ('persist', {}))


class MigrationGuardTests(unittest.TestCase):
    def test_unknown_predecessor_rejected_before_provisioning_or_receipt_removal(self):
        with mock.patch.object(manage, 'root_required'), mock.patch.object(manage, 'source_protected'), \
                mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext), \
                mock.patch.object(manage, 'expected_digest'), mock.patch.object(ctl, 'load_config', return_value=BASELINE), \
                mock.patch.object(manage, 'require_idle'), mock.patch.object(manage, 'require_no_ledger'), \
                mock.patch.object(Path, 'exists', return_value=False), \
                mock.patch.object(manage, 'load_slot_provisioner') as provisioner, \
                self.assertRaisesRegex(ctl.BoundaryError, 'unsupported-pool-predecessor'):
            manage.migrate_pool('/fixture', '0' * 64, '1' * 64)
        provisioner.assert_not_called()

    def test_failed_idle_guard_never_mutates_or_reads_proposed_configuration(self):
        with mock.patch.object(manage, 'root_required'), mock.patch.object(manage, 'source_protected'), \
                mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext), \
                mock.patch.object(manage, 'expected_digest'), mock.patch.object(ctl, 'load_config', return_value=BASELINE), \
                mock.patch.object(manage, 'require_idle', side_effect=ctl.BoundaryError('controller-must-be-stopped-and-disabled')), \
                mock.patch.object(ctl, 'protected_file') as read, \
                self.assertRaisesRegex(ctl.BoundaryError, 'controller-must-be-stopped-and-disabled'):
            manage.migrate_pool('/fixture', '0' * 64, manage.POOL_PREDECESSOR)
        read.assert_not_called()

    def test_lifecycle_idle_checks_all_worker_identities(self):
        with mock.patch.object(manage, 'state_of', side_effect=lambda _unit, prop: 'inactive' if prop == 'ActiveState' else 'disabled'), \
                mock.patch.object(ctl, 'remaining_processes', side_effect=[[], [123]]) as processes, \
                mock.patch.object(Path, 'exists', return_value=False), mock.patch.object(ctl, 'mount_entries', return_value=[]), \
                self.assertRaisesRegex(ctl.BoundaryError, 'ci-processes-still-active'):
            manage.require_idle(dict(POOL, worker_slots=2))
        self.assertEqual([call.args[0]['uid'] for call in processes.call_args_list], [62041, 62042])

    def test_aggregate_cgroup_path_is_separate_from_application_user_slice(self):
        with mock.patch.object(ctl, 'load_config', return_value=POOL):
            self.assertEqual(ctl.manager_cgroup(ctl.slot_config(POOL, 5)),
                             '/webappci.slice/webappci-worker5.slice/user@62046.service')
        self.assertEqual(ctl.manager_cgroup(BASELINE), '/user.slice/user-62041.slice/user@62041.service')




class MigrationTransactionFixture:
    def setUp(self):
        import hashlib
        self.hashlib = hashlib
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.installed = self.directory / 'installed'
        self.installed.mkdir()
        self.base = self.directory / 'base'
        self.base.mkdir()
        self.rootfs = self.base / 'rootfs'
        self.probe = self.rootfs / 'usr/local/lib/web-app-ci/validate-job.py'
        self.probe.parent.mkdir(parents=True)
        self.original_probe = b"# predecessor probe fixture: pg_isready uses its default Unix socket\n"
        self.probe.write_bytes(self.original_probe)
        self.probe.chmod(0o755)
        self.predecessor_probe = hashlib.sha256(self.original_probe).hexdigest()
        self.systemd = self.directory / 'systemd'
        self.systemd.mkdir()
        self.config_path = self.directory / 'config.json'
        self.config_path.write_text(json.dumps(BASELINE))
        self.candidate = self.directory / 'candidate.json'
        self.candidate.write_text(json.dumps(POOL))
        self.original_controller = b"def boundary_digest(config):\n    return 'predecessor-boundary'\n"
        (self.installed / 'controller.py').write_bytes(self.original_controller)
        (self.installed / 'validation.py').write_text('predecessor validation\n')
        (self.systemd / manage.SERVICE).write_text('predecessor service\n')
        for name in (f"user@{BASELINE['uid']}.service.d", f"user-{BASELINE['uid']}.slice.d"):
            path = self.systemd / name
            path.mkdir()
            (path / 'web-app-ci.conf').write_text('predecessor ' + name + '\n')
        receipt = {'passed': True, 'configuration_sha256': hashlib.sha256(self.config_path.read_bytes()).hexdigest(),
                   'boundary_sha256': 'predecessor-boundary',
                   'boot_id': Path('/proc/sys/kernel/random/boot_id').read_text().strip()}
        self.receipt = self.base / 'validation.json'
        self.receipt.write_text(json.dumps(receipt))
        self.predecessor = hashlib.sha256(self.original_controller).hexdigest()
        self.expected = hashlib.sha256(self.config_path.read_bytes()).hexdigest()
        self.provisioner = mock.Mock()
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        for patch in (mock.patch.object(manage, 'root_required'), mock.patch.object(manage, 'source_protected'),
                      mock.patch.object(manage, 'lifecycle_lock', side_effect=contextlib.nullcontext),
                      mock.patch.object(manage, 'require_idle'), mock.patch.object(manage, 'trusted_executable'),
                      mock.patch.object(manage, 'POOL_PREDECESSOR', self.predecessor),
                      mock.patch.object(manage, 'POOL_PREDECESSOR_PROBE', self.predecessor_probe),
                      mock.patch.object(manage, 'INSTALLED', self.installed), mock.patch.object(manage, 'SYSTEMD', self.systemd),
                      mock.patch.object(manage, 'load_slot_provisioner', return_value=self.provisioner),
                      mock.patch.object(ctl, 'BASE', self.base), mock.patch.object(ctl, 'POOL_BASE', self.base),
                      mock.patch.object(ctl, 'ROOTFS', self.rootfs),
                      mock.patch.object(ctl, 'CONFIG', self.config_path),
                      mock.patch.object(ctl, 'protected_path', side_effect=lambda path, **_kwargs: Path(path)),
                      mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()),
                      mock.patch.object(ctl, 'command')):
            self.stack.enter_context(patch)

    def migrate(self):
        return manage.migrate_pool(str(self.candidate), self.expected, self.predecessor)

class MigrationTransactionTests(MigrationTransactionFixture, unittest.TestCase):
    def test_happy_migration_persists_intent_before_mutation_and_preserves_exact_backups(self):
        def provision(*_args):
            self.assertFalse(self.receipt.exists())
            self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)
            self.assertEqual(manage.read_pool_migration()['phase'], 'applying')
            self.assertEqual((manage.pool_migration_directory() / 'controller.py').read_bytes(), self.original_controller)
            self.assertEqual((manage.pool_migration_directory() / 'validate-job.py').read_bytes(), self.original_probe)
            self.assertEqual(self.probe.read_bytes(), (manage.SOURCE / 'validate-job.py').read_bytes())
        self.provisioner.provision.side_effect = provision
        result = self.migrate()
        self.assertEqual(result['worker_slots'], 6)
        self.assertFalse(result['controller_enabled'])
        self.assertTrue(result['full_validation_required'])
        self.assertEqual(json.loads(self.config_path.read_text()), POOL)
        self.assertEqual(manage.read_pool_migration()['phase'], 'applied')
        self.assertEqual((self.installed / 'controller.py').read_bytes(), (manage.SOURCE / 'controller.py').read_bytes())
        self.assertFalse(self.receipt.exists())

    def test_interrupted_provisioning_keeps_old_config_and_recoverable_ledger(self):
        self.provisioner.provision.side_effect = ctl.BoundaryError('fixture-provision-failed')
        with self.assertRaisesRegex(ctl.BoundaryError, 'fixture-provision-failed'):
            self.migrate()
        self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)
        self.assertEqual(manage.read_pool_migration()['phase'], 'applying')
        self.assertFalse(self.receipt.exists())
        self.assertEqual((self.installed / 'controller.py').read_bytes(), self.original_controller)
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-already-started-or-not-serial'):
            self.migrate()

    def test_stale_source_receipt_or_changed_repository_map_rejected_without_ledger(self):
        for variation in ('receipt', 'projects'):
            with self.subTest(variation=variation):
                if variation == 'receipt':
                    value = json.loads(self.receipt.read_text())
                    value['boundary_sha256'] = 'not-predecessor-boundary'
                    self.receipt.write_text(json.dumps(value))
                else:
                    candidate = copy.deepcopy(POOL)
                    candidate['projects'] = {'forbidden-change': {'repository': 'Acme/other'}}
                    self.candidate.write_text(json.dumps(candidate))
                with self.assertRaises(ctl.BoundaryError):
                    self.migrate()
                self.assertFalse(manage.pool_migration_directory().exists())
                self.assertTrue(self.receipt.exists())
        self.provisioner.provision.assert_not_called()

    def test_backup_tampering_and_unknown_later_revision_prevent_rollback(self):
        self.migrate()
        current = ctl.config_digest()
        (self.installed / 'controller.py').write_text('unknown later controller\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-rollback-installed-source-changed'):
            manage.rollback_pool(current)
        self.provisioner.remove_extra_slots.assert_not_called()
        (manage.pool_migration_directory() / 'controller.py').write_text('changed backup\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-backup-changed'):
            manage.rollback_pool(current)
        self.provisioner.remove_extra_slots.assert_not_called()

    def test_rollback_restores_predecessor_and_never_restores_validation_receipt(self):
        self.migrate()
        result = manage.rollback_pool(ctl.config_digest())
        self.assertFalse(result['controller_enabled'])
        self.assertTrue(result['full_validation_required'])
        self.assertEqual(self.config_path.read_text(), json.dumps(BASELINE))
        self.assertEqual((self.installed / 'controller.py').read_bytes(), self.original_controller)
        self.assertEqual(self.probe.read_bytes(), self.original_probe)
        self.assertEqual(self.probe.stat().st_mode & 0o777, 0o755)
        self.assertFalse((self.installed / 'validate-job.py').exists())
        self.assertFalse((self.installed / 'provision_slots.py').exists())
        self.assertFalse(self.receipt.exists())
        self.assertEqual(manage.read_pool_migration()['phase'], 'rolled-back')
        self.provisioner.remove_extra_slots.assert_called_once()


class DiscoveryBudgetTests(SchedulerFixture, unittest.TestCase):
    def clock(self, stop_at):
        current = [0]
        def sleep(seconds):
            current[0] += seconds
            if current[0] >= stop_at:
                ctl.STOP = True
        self.stack.enter_context(mock.patch.object(ctl.time, 'monotonic', side_effect=lambda: current[0]))
        self.stack.enter_context(mock.patch.object(ctl.time, 'sleep', side_effect=sleep))
        return current

    def test_idle_four_repository_discovery_backs_off_with_bounded_requests(self):
        self.config['projects'] = {f'app{index}': {'repository': f'Acme/app{index}'} for index in range(4)}
        self.clock(120)
        with mock.patch.object(ctl, 'load_config', return_value=self.config), \
                mock.patch.object(ctl, 'api', return_value={'workflow_runs': []}) as api, \
                mock.patch.object(os, 'fork') as fork:
            ctl.serve(self.config)
        # Snapshots at 0s, 30s, 90s; each scans two states for four repos.
        self.assertEqual(api.call_count, 24)
        fork.assert_not_called()

    def test_one_discovery_snapshot_dispatches_all_available_slots(self):
        self.clock(1)
        with mock.patch.object(ctl, 'find_jobs', return_value=(('Acme/app', 1), ('Acme/app', 2))) as find, \
                mock.patch.object(os, 'fork', side_effect=[101, 102]), \
                mock.patch.object(os, 'waitpid', return_value=(0, 0)), mock.patch.object(os, 'kill'):
            ctl.serve(self.config)
        self.assertEqual(find.call_count, 1)

    def test_transient_or_rate_limit_discovery_does_not_kill_healthy_worker(self):
        for error in ('github-api-http-429', 'github-api-http-403', 'github-api-unavailable'):
            with self.subTest(error=error):
                ctl.STOP = False
                self.saved = {}
                self.events.clear()
                self.clock(20)
                def kill(*_args):
                    self.assertTrue(ctl.STOP, 'Discovery failure must not terminate healthy workers.')
                with mock.patch.object(ctl, 'find_jobs', side_effect=[(('Acme/app', 1),), ctl.BoundaryError(error)]) as find, \
                        mock.patch.object(os, 'fork', return_value=101) as fork, \
                        mock.patch.object(os, 'waitpid', return_value=(0, 0)), mock.patch.object(os, 'kill', side_effect=kill) as kill_mock:
                    ctl.serve(self.config)
                self.assertEqual(find.call_count, 2)
                self.assertEqual(fork.call_count, 1)
                self.assertEqual(kill_mock.call_count, 1)
                self.assertEqual(self.saved, {})


class BackupPublicationTests(MigrationTransactionFixture, unittest.TestCase):
    def test_failure_before_atomic_backup_publication_preserves_live_state_and_allows_retry(self):
        with mock.patch.object(os, 'rename', side_effect=OSError('fixture-publication-failure')), self.assertRaises(OSError):
            self.migrate()
        self.assertFalse(manage.pool_migration_directory().exists())
        self.assertTrue(self.receipt.exists())
        self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)
        self.provisioner.provision.assert_not_called()
        self.migrate()
        self.assertEqual(manage.read_pool_migration()['phase'], 'applied')


class ResourceAdmissionTests(SchedulerFixture, unittest.TestCase):
    def test_new_worker_is_deferred_without_stopping_healthy_peer(self):
        def stop_after_first_poll(_seconds):
            self.assertEqual(len(self.saved), 1)
            ctl.STOP = True
        def kill(*_args):
            self.assertTrue(ctl.STOP)
        states = []
        def admission(_config, children):
            states.append(dict(children))
            return len(states) == 1
        with mock.patch.object(ctl, 'find_jobs', return_value=(('Acme/app', 1), ('Acme/app', 2))), \
                mock.patch.object(ctl, 'admission_headroom', side_effect=admission), \
                mock.patch.object(os, 'fork', return_value=101) as fork, \
                mock.patch.object(os, 'waitpid', return_value=(0, 0)), \
                mock.patch.object(os, 'kill', side_effect=kill), mock.patch.object(ctl.time, 'sleep', side_effect=stop_after_first_poll):
            ctl.serve(self.config)
        self.assertEqual(fork.call_count, 1)
        self.assertEqual(states, [{}, {0: 101}])
        self.assertEqual(self.saved, {})

    def test_child_resource_recheck_deferral_does_not_cancel_healthy_worker(self):
        clock = [0]
        def sleep(seconds):
            clock[0] += seconds
            if clock[0] >= 3:
                ctl.STOP = True
        def wait(pid, flags):
            if pid == 102 and flags == os.WNOHANG:
                return 102, 75 << 8
            return 0, 0
        def kill(pid, _signal):
            self.assertTrue(ctl.STOP)
            self.assertEqual(pid, 101)
        with mock.patch.object(ctl.time, 'monotonic', side_effect=lambda: clock[0]), \
                mock.patch.object(ctl.time, 'sleep', side_effect=sleep), \
                mock.patch.object(ctl, 'find_jobs', return_value=(('Acme/app', 1), ('Acme/app', 2))) as find, \
                mock.patch.object(os, 'fork', side_effect=[101, 102]), \
                mock.patch.object(os, 'waitpid', side_effect=wait), mock.patch.object(os, 'kill', side_effect=kill) as kill_mock:
            ctl.serve(self.config)
        self.assertEqual(find.call_count, 1)
        self.assertEqual(kill_mock.call_count, 1)
        self.assertEqual(self.saved, {})


class HeadroomAccountingTests(unittest.TestCase):
    def test_existing_and_preparing_worker_growth_is_reserved_before_fork(self):
        from types import SimpleNamespace
        available = [14 * 1024]
        usages = {0: 1024, 1: 2048}
        def read(path, *_args, **_kwargs):
            if str(path) == '/proc/meminfo':
                return f'MemAvailable: {available[0] * 1024} kB\n'
            for index, value in usages.items():
                if str(path).endswith(f'webappci-worker{index}.slice/memory.current'):
                    return str(value * 1024 ** 2)
            raise FileNotFoundError
        def metadata(path, *_args, **_kwargs):
            if path.name == 'job.img':
                return SimpleNamespace(st_blocks=12 * 1024 ** 3 // 512)
            raise FileNotFoundError
        with mock.patch.object(Path, 'read_text', read), mock.patch.object(Path, 'stat', metadata), \
                mock.patch.object(ctl.shutil, 'disk_usage', return_value=SimpleNamespace(free=100 * 1024 ** 3)):
            self.assertTrue(ctl.admission_headroom(POOL, {0: 101, 1: 102}))
            available[0] -= 1
            self.assertFalse(ctl.admission_headroom(POOL, {0: 101, 1: 102}))
            # Pending preparation has no cgroup/current charge yet; it still
            # reserves its entire future 3 GiB allocation.
            del usages[1]
            available[0] = 16 * 1024
            self.assertTrue(ctl.admission_headroom(POOL, {0: 101, 1: 102}))
            available[0] -= 1
            self.assertFalse(ctl.admission_headroom(POOL, {0: 101, 1: 102}))


class RegistrationQuarantineTests(SchedulerFixture, unittest.TestCase):
    def test_remote_reconciliation_quarantines_slot_and_drains_healthy_peer_naturally(self):
        clock = [0]
        quarantined = [False]
        def sleep(seconds):
            clock[0] += seconds
            self.assertLess(clock[0], 5, 'The healthy peer must eventually drain.')
        def wait(pid, flags):
            self.assertEqual(flags, os.WNOHANG)
            if pid == 101 and not quarantined[0]:
                quarantined[0] = True
                return 101, 76 << 8
            if pid == 102 and clock[0] >= 3:
                return 102, 0
            return 0, 0
        with mock.patch.object(ctl.time, 'monotonic', side_effect=lambda: clock[0]), \
                mock.patch.object(ctl.time, 'sleep', side_effect=sleep), \
                mock.patch.object(ctl, 'find_jobs', return_value=(('Acme/app', 1), ('Acme/app', 2))) as find, \
                mock.patch.object(os, 'fork', side_effect=[101, 102]) as fork, \
                mock.patch.object(os, 'waitpid', side_effect=wait), mock.patch.object(os, 'kill') as kill, \
                self.assertRaisesRegex(ctl.RegistrationRecoveryRequired, 'quarantined-registration-recovery-required'):
            ctl.serve(self.config)
        kill.assert_not_called()
        self.assertEqual(find.call_count, 1)
        self.assertEqual(fork.call_count, 2)
        self.assertEqual(self.saved, {'0': {'repo': 'Acme/app', 'job_id': 1}})
        # Both startup slots were cleaned; final cleanup skips the quarantined
        # slot and never retries/drops its remote intent while peers drain.
        self.assertEqual([event[1] for event in self.events if event[0] == 'cleanup'], [62041, 62042, 62042])

    def test_unexpected_local_failure_still_stops_healthy_peer(self):
        # Existing fail-closed behavior is deliberate for an unproven local
        # boundary: unlike quarantine76, an ordinary child failure kills peers.
        with mock.patch.object(ctl, 'find_jobs', return_value=(('Acme/app', 1), ('Acme/app', 2))), \
                mock.patch.object(os, 'fork', side_effect=[101, 102]), \
                mock.patch.object(ctl.time, 'sleep'), \
                mock.patch.object(os, 'waitpid', side_effect=[(101, 1 << 8), (102, 0)]), \
                mock.patch.object(os, 'kill') as kill, \
                self.assertRaisesRegex(ctl.BoundaryError, 'worker-slot-failed'):
            ctl.serve(self.config)
        kill.assert_called_once_with(102, ctl.signal.SIGTERM)


class CleanupClassificationTests(unittest.TestCase):
    def setUp(self):
        from types import SimpleNamespace
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.state = self.base / 'controller.json'
        self.job = self.base / 'job'
        self.job.mkdir()
        self.image = self.base / 'job.img'
        self.image.write_bytes(b'fixed local image fixture')
        self.intent = {'repo': 'Acme/app', 'job_id': 1, 'runner_id': 42,
                       'runner_name': 'web-app-ci-job-' + '00' * 16}
        self.state.write_text(json.dumps(self.intent))
        self.config = dict(BASELINE, projects={'app': {'repository': 'Acme/app'}})
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        self.network_stop = mock.Mock()
        self.witnesses_stop = mock.Mock()
        for patch in (mock.patch.object(ctl, 'BASE', self.base), mock.patch.object(ctl, 'STATE', self.state),
                      mock.patch.object(ctl, 'protected_file', side_effect=lambda path: Path(path).read_text()),
                      mock.patch.object(ctl, 'command', return_value=SimpleNamespace(returncode=1)),
                      mock.patch.object(ctl, 'remaining_processes', return_value=[]),
                      mock.patch.object(ctl, 'network_stop', self.network_stop),
                      mock.patch.object(ctl, 'witnesses_stop', self.witnesses_stop)):
            self.stack.enter_context(patch)

    def test_inventory_rate_limit_or_unavailable_only_defers_after_local_teardown(self):
        for code in ('github-api-http-429', 'github-api-http-503'):
            with self.subTest(code=code), mock.patch.object(ctl, 'api', side_effect=ctl.BoundaryError(code)), \
                    self.assertRaisesRegex(ctl.RegistrationRecoveryRequired, code):
                ctl.cleanup(self.config, 'fixture-token')
            self.assertFalse(self.image.exists())
            self.assertEqual(list(self.job.iterdir()), [])
            self.assertEqual(json.loads(self.state.read_text()), self.intent)
        self.assertEqual(self.network_stop.call_count, 2)
        self.assertEqual(self.witnesses_stop.call_count, 2)

    def test_delete_failure_with_unresolved_remote_absence_retains_exact_intent(self):
        runner = {'id': 42, 'name': self.intent['runner_name']}
        inventory = {'total_count': 1, 'runners': [runner]}
        with mock.patch.object(ctl, 'api', side_effect=[inventory, ctl.BoundaryError('github-api-http-503'),
                                                       ctl.BoundaryError('github-api-http-429')]), \
                self.assertRaisesRegex(ctl.RegistrationRecoveryRequired, 'github-api-http-429'):
            ctl.cleanup(self.config, 'fixture-token')
        self.assertFalse(self.image.exists())
        self.assertEqual(json.loads(self.state.read_text()), self.intent)

    def test_local_cleanup_failure_never_claims_remote_only_deferral(self):
        self.witnesses_stop.side_effect = ctl.BoundaryError('api-witness-cleanup-foreign-mount')
        with mock.patch.object(ctl, 'api') as api, self.assertRaises(ctl.BoundaryError) as caught:
            ctl.cleanup(self.config, 'fixture-token')
        self.assertNotIsInstance(caught.exception, ctl.RegistrationRecoveryRequired)
        api.assert_not_called()
        self.network_stop.assert_not_called()
        self.assertTrue(self.image.exists())
        self.assertEqual(json.loads(self.state.read_text()), self.intent)


class ProbeMigrationTests(MigrationTransactionFixture, unittest.TestCase):
    def test_old_probe_drift_is_rejected_before_backup_publication_or_writes(self):
        self.probe.write_bytes(b'unknown predecessor probe drift\n')
        with mock.patch.object(manage, 'atomic_file', wraps=manage.atomic_file) as write, \
                self.assertRaisesRegex(ctl.BoundaryError, 'installed-pool-predecessor-probe-changed'):
            self.migrate()
        write.assert_not_called()
        self.provisioner.preflight.assert_not_called()
        self.provisioner.provision.assert_not_called()
        self.assertFalse(manage.pool_migration_directory().exists())
        self.assertTrue(self.receipt.exists())
        self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)

    def test_probe_drift_during_preflight_is_rejected_before_ledger_publication(self):
        self.provisioner.preflight.side_effect = lambda *_args: self.probe.write_bytes(b'probe changed during preflight\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'installed-pool-predecessor-probe-changed'):
            self.migrate()
        self.assertFalse(manage.pool_migration_directory().exists())
        self.assertTrue(self.receipt.exists())
        self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)
        self.provisioner.provision.assert_not_called()

    def test_probe_backup_candidate_hashes_and_rootfs_destination_are_bound(self):
        self.migrate()
        ledger = manage.read_pool_migration()
        candidate_probe = (manage.SOURCE / 'validate-job.py').read_bytes()
        self.assertEqual(ledger['backups']['validate-job.py'], self.predecessor_probe)
        self.assertEqual(ledger['candidate']['validate-job.py'], self.hashlib.sha256(candidate_probe).hexdigest())
        self.assertEqual(manage.migration_candidates()['validate-job.py'], (manage.SOURCE / 'validate-job.py', self.probe))
        self.assertEqual((manage.pool_migration_directory() / 'validate-job.py').read_bytes(), self.original_probe)
        self.assertEqual(self.probe.read_bytes(), candidate_probe)
        self.assertEqual(self.probe.stat().st_mode & 0o777, 0o755)
        self.assertFalse((self.installed / 'validate-job.py').exists())

    def test_interruption_after_baseline_probe_update_restores_old_probe_and_source(self):
        def fail_after_probe_update(*_args):
            self.assertFalse(self.receipt.exists())
            self.assertEqual(manage.read_pool_migration()['phase'], 'applying')
            self.assertEqual(self.probe.read_bytes(), (manage.SOURCE / 'validate-job.py').read_bytes())
            self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)
            raise ctl.BoundaryError('fixture-interrupted-after-probe-update')
        self.provisioner.provision.side_effect = fail_after_probe_update
        with self.assertRaisesRegex(ctl.BoundaryError, 'fixture-interrupted-after-probe-update'):
            self.migrate()
        self.assertEqual(manage.read_pool_migration()['phase'], 'applying')
        self.assertEqual((self.installed / 'controller.py').read_bytes(), self.original_controller)
        manage.rollback_pool(ctl.config_digest())
        self.assertEqual(self.probe.read_bytes(), self.original_probe)
        self.assertEqual(self.probe.stat().st_mode & 0o777, 0o755)
        self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)
        self.assertFalse(self.receipt.exists())
        self.assertEqual(manage.read_pool_migration()['phase'], 'rolled-back')

    def test_mid_provision_clone_inherits_updated_probe_and_rollback_restores_baseline(self):
        import shutil
        clone = self.base / 'slots/1/rootfs'
        candidate_probe = (manage.SOURCE / 'validate-job.py').read_bytes()
        def partial_provision(*_args):
            self.assertEqual(manage.read_pool_migration()['phase'], 'applying')
            self.assertEqual(self.probe.read_bytes(), candidate_probe)
            clone.parent.mkdir(parents=True)
            # Stand in for privileged cp -a with an actual temporary filesystem
            # copy at the provisioning boundary, then interrupt the transaction.
            shutil.copytree(self.rootfs, clone)
            self.assertEqual((clone / 'usr/local/lib/web-app-ci/validate-job.py').read_bytes(), candidate_probe)
            raise ctl.BoundaryError('fixture-interrupted-mid-provision')
        self.provisioner.provision.side_effect = partial_provision
        self.provisioner.remove_extra_slots.side_effect = lambda *_args: shutil.rmtree(self.base / 'slots')
        with self.assertRaisesRegex(ctl.BoundaryError, 'fixture-interrupted-mid-provision'):
            self.migrate()
        self.assertTrue(clone.exists())
        self.assertFalse(self.receipt.exists())
        manage.rollback_pool(ctl.config_digest())
        self.provisioner.remove_extra_slots.assert_called_once()
        self.assertFalse(clone.exists())
        self.assertEqual(self.probe.read_bytes(), self.original_probe)
        self.assertEqual((self.installed / 'controller.py').read_bytes(), self.original_controller)
        self.assertEqual(manage.read_pool_migration()['phase'], 'rolled-back')

    def test_unknown_later_probe_blocks_rollback_before_resource_removal(self):
        self.migrate()
        self.probe.write_bytes(b'unknown later installed probe\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-rollback-installed-source-changed'):
            manage.rollback_pool(ctl.config_digest())
        self.provisioner.remove_extra_slots.assert_not_called()
        self.assertEqual(manage.read_pool_migration()['phase'], 'applied')
        self.assertEqual(self.probe.read_bytes(), b'unknown later installed probe\n')

    def test_missing_existing_probe_is_not_silently_overwritten_on_rollback(self):
        self.migrate()
        self.probe.unlink()
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-rollback-installed-probe-missing'):
            manage.rollback_pool(ctl.config_digest())
        self.provisioner.remove_extra_slots.assert_not_called()
        self.assertEqual(manage.read_pool_migration()['phase'], 'applied')

    def test_tampered_probe_backup_prevents_rollback(self):
        self.migrate()
        (manage.pool_migration_directory() / 'validate-job.py').write_bytes(b'tampered predecessor probe backup\n')
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-backup-changed'):
            manage.rollback_pool(ctl.config_digest())
        self.provisioner.remove_extra_slots.assert_not_called()

    def test_probe_backup_hash_cannot_be_rebound_to_an_unknown_predecessor(self):
        self.migrate()
        backup = manage.pool_migration_directory() / 'validate-job.py'
        backup.write_bytes(b'unknown backup with matching ledger hash\n')
        path = manage.pool_migration_directory() / 'ledger.json'
        ledger = json.loads(path.read_text())
        ledger['backups']['validate-job.py'] = self.hashlib.sha256(backup.read_bytes()).hexdigest()
        ctl.atomic_json(path, ledger)
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-predecessor-probe-backup-mismatch'):
            manage.rollback_pool(ctl.config_digest())
        self.provisioner.remove_extra_slots.assert_not_called()

    def test_candidate_probe_hash_and_key_schema_are_validated(self):
        self.migrate()
        path = manage.pool_migration_directory() / 'ledger.json'
        original = json.loads(path.read_text())
        invalid = copy.deepcopy(original)
        invalid['candidate']['validate-job.py'] = 'not-a-sha256'
        ctl.atomic_json(path, invalid)
        with self.assertRaisesRegex(ctl.BoundaryError, 'invalid-pool-migration-candidate-hash'):
            manage.read_pool_migration()
        invalid = copy.deepcopy(original)
        invalid['candidate']['../outside.py'] = invalid['candidate'].pop('validate-job.py')
        ctl.atomic_json(path, invalid)
        with self.assertRaisesRegex(ctl.BoundaryError, 'invalid-pool-migration-ledger'):
            manage.read_pool_migration()

    def test_clone_probe_verifier_rejects_drift_in_actual_temporary_rootfs(self):
        spec = importlib.util.spec_from_file_location('probe_clone_verifier', manage.SOURCE / 'provision_slots.py')
        provisioner = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(provisioner)
        provisioner.ctl = ctl
        candidate_probe = (manage.SOURCE / 'validate-job.py').read_bytes()
        self.probe.write_bytes(candidate_probe)
        provisioner.require_probe(self.rootfs, candidate_probe)
        self.probe.write_bytes(self.original_probe)
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-rootfs-probe-source-mismatch'):
            provisioner.require_probe(self.rootfs, candidate_probe)


class RepairedPredecessorMigrationTests(MigrationTransactionFixture, unittest.TestCase):
    def test_repaired_serial_probe_is_backed_up_as_actual_variant(self):
        repaired = (manage.SOURCE / 'validate-job.py').read_bytes()
        self.probe.write_bytes(repaired)
        self.migrate()
        ledger = manage.read_pool_migration()
        self.assertEqual(ledger['backups']['validate-job.py'], manage.POSTGRES_READINESS_PROBE)
        self.assertEqual((manage.pool_migration_directory() / 'validate-job.py').read_bytes(), repaired)
        manage.rollback_pool(ctl.config_digest())
        self.assertEqual(self.probe.read_bytes(), repaired)
        self.assertEqual(self.probe.stat().st_mode & 0o777, 0o755)

    def test_repaired_probe_still_requires_genuine_matching_passing_receipt(self):
        self.probe.write_bytes((manage.SOURCE / 'validate-job.py').read_bytes())
        receipt = json.loads(self.receipt.read_text())
        receipt['passed'] = False
        self.receipt.write_text(json.dumps(receipt))
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-predecessor-validation-required'):
            self.migrate()
        self.assertFalse(manage.pool_migration_directory().exists())
        self.provisioner.provision.assert_not_called()
        receipt['passed'] = True
        receipt['boundary_sha256'] = 'wrong-current-boundary'
        self.receipt.write_text(json.dumps(receipt))
        with self.assertRaisesRegex(ctl.BoundaryError, 'pool-predecessor-validation-required'):
            self.migrate()
        self.assertFalse(manage.pool_migration_directory().exists())

    def test_repaired_predecessor_interruption_rollback_restores_repaired_variant(self):
        repaired = (manage.SOURCE / 'validate-job.py').read_bytes()
        self.probe.write_bytes(repaired)
        self.provisioner.provision.side_effect = ctl.BoundaryError('fixture-interrupted-repaired-provision')
        with self.assertRaisesRegex(ctl.BoundaryError, 'fixture-interrupted-repaired-provision'):
            self.migrate()
        self.assertEqual(manage.read_pool_migration()['phase'], 'applying')
        self.assertEqual(manage.read_pool_migration()['backups']['validate-job.py'], manage.POSTGRES_READINESS_PROBE)
        manage.rollback_pool(ctl.config_digest())
        self.assertEqual(self.probe.read_bytes(), repaired)
        self.assertNotEqual(self.probe.read_bytes(), self.original_probe)
        self.assertEqual(json.loads(self.config_path.read_text()), BASELINE)
        self.assertFalse(self.receipt.exists())

    def test_migration_candidate_probe_is_pinned_before_ledger_publication(self):
        source = self.directory / 'candidate-source'
        source.mkdir()
        for name in ('controller.py', 'validation.py', 'provision_slots.py', 'validate-job.py'):
            (source / name).write_bytes((manage.SOURCE / name).read_bytes())
        (source / 'validate-job.py').write_bytes(b'unknown later migration probe\n')
        with mock.patch.object(manage, 'SOURCE', source), self.assertRaisesRegex(ctl.BoundaryError, 'pool-migration-source-probe-changed'):
            self.migrate()
        self.assertFalse(manage.pool_migration_directory().exists())
        self.assertTrue(self.receipt.exists())
        self.assertEqual(self.probe.read_bytes(), self.original_probe)
        self.provisioner.provision.assert_not_called()


if __name__ == '__main__':
    unittest.main()
