"""Timer activation requires reviewed installed bytes and immediate effective readback."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / 'docs/template-initialization/scripts'


def load(name):
    spec = importlib.util.spec_from_file_location('schedule_test_' + name, SCRIPTS / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    with mock.patch.object(sys, 'path', [str(SCRIPTS), *sys.path]):
        spec.loader.exec_module(module)
    return module


schedule = load('_backup_schedule')
operator = load('_operations')


class BackupScheduleTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / 'source'
        self.slug = 'fixture-app'
        self.ctx = SimpleNamespace(values={'PROJECT_SLUG': self.slug, 'REPOSITORY': 'vireocodedev/fixture-app',
            'RELEASE_SOURCE': str(self.source), 'STAGING_HOSTNAME': 'fixture-staging.example.com',
            'PRODUCTION_HOSTNAME': 'fixture.example.com', 'STAGING_FRONTEND_PORT': '18280',
            'STAGING_BACKEND_PORT': '18281', 'PRODUCTION_FRONTEND_PORT': '18380', 'PRODUCTION_BACKEND_PORT': '18381'})
        for name in ('SETTINGS', 'CODE', 'STATE', 'SYSTEMD'):
            patch = mock.patch.object(schedule, name, self.root / name.lower())
            patch.start()
            self.addCleanup(patch.stop)
        self.settings = schedule.SETTINGS / self.slug
        self.code = schedule.CODE / self.slug
        self.settings.mkdir(parents=True)
        self.code.mkdir(parents=True)
        schedule.SYSTEMD.mkdir()
        files = ['infrastructure/release/controller.py', 'infrastructure/release/runtime.py',
                 'infrastructure/release/protocol.py', 'infrastructure/ci/ci-runner/github_app.py']
        # These infrastructure bytes have no consumer identity assumptions.
        for relative in files:
            destination = self.source / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, destination)
            shutil.copyfile(ROOT / relative, self.code / destination.name)
        # Read the current authoritative source-pin list instead of duplicating it.
        import ast
        tree = ast.parse((self.source / files[0]).read_text())
        names = ast.literal_eval(next(node.value for node in tree.body if isinstance(node, ast.Assign)
            and any(isinstance(target, ast.Name) and target.id == 'TRUSTED' for target in node.targets)))
        for relative in names:
            destination = self.source / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, destination)
        self.state = {'source_sha': 'a' * 40, 'release_source_sha': 'a' * 40, 'repository_id': 123,
                      'staging_workflow_id': 15, 'production_workflow_id': 16,
                      'retrieved_copy_restored': True, 'retrieved_backup_sha256': 'b' * 64,
                      'restored_backup_sha256': 'b' * 64}
        self.write('installation.json', {'source_sha': 'a' * 40, 'files': {
            path.name: self.digest(path) for path in self.code.iterdir()}})
        self.write('controller.json', {'repository': self.ctx.values['REPOSITORY'], 'repository_id': 123,
            'workflow_ids': {'staging': 15, 'production': 16}, 'trusted_sha256': schedule.reviewed_pins(self.source),
            'runtime_config': str(self.settings / 'runtime.json'), 'state': str(schedule.STATE / self.slug)})
        self.write('runtime.json', {'slug': self.slug, 'repository': self.ctx.values['REPOSITORY'],
            'state': str(schedule.STATE / self.slug), 'settings': str(self.settings),
            'environments': {'staging': {'hostname': 'fixture-staging.example.com', 'frontend_port': 18280,
                                        'backend_port': 18281},
                             'production': {'hostname': 'fixture.example.com', 'frontend_port': 18380,
                                            'backend_port': 18381}}})
        self.timer, self.service = 'web-app-backup-fixture-app.timer', 'web-app-backup-fixture-app.service'
        for unit in (self.timer, self.service):
            (schedule.SYSTEMD / unit).write_text('root-owned unit fixture')
        command = '/usr/bin/python3 -B ' + str(self.code / 'runtime.py') + ' backup --config ' + str(self.settings / 'runtime.json')
        self.properties = {(self.timer, 'TimersCalendar'): '{ OnCalendar=*-*-* 03:00:00 Europe/Zagreb ; next_elapse=Wed 2026-10-28 03:00:00 CET }',
            (self.timer, 'Persistent'): 'yes', (self.timer, 'Unit'): self.service,
            (self.timer, 'OnClockChange'): 'no', (self.timer, 'OnTimezoneChange'): 'no',
            (self.timer, 'ActiveState'): 'active', (self.timer, 'UnitFileState'): 'enabled',
            (self.timer, 'NextElapseUSecRealtime'): 'Wed 2026-10-28 03:00:00 CET',
            (self.service, 'ExecStart'): '{ path=/usr/bin/python3 ; argv[]=' + command + ' ; ignore_errors=no ; start_time=[n/a] ; stop_time=[n/a] ; pid=0 ; code=(null) ; status=0/0 }',
            (self.service, 'User'): 'root', (self.service, 'UMask'): '0077'}
        for unit in (self.timer, self.service):
            self.properties[unit, 'LoadState'] = 'loaded'
            self.properties[unit, 'FragmentPath'] = str(schedule.SYSTEMD / unit)
        self.writes = []

    def write(self, name, value):
        path = self.settings / name
        path.write_text(json.dumps(value))
        path.chmod(0o600)

    def mutate(self, name, changes):
        value = json.loads((self.settings / name).read_text())
        value.update(changes)
        self.write(name, value)

    def digest(self, path):
        return hashlib.sha256(Path(path).read_bytes()).hexdigest()

    def execute(self, arguments, **kwargs):
        if arguments[0] == 'git':
            return 'a' * 40 if arguments[-1] == 'HEAD' else 'https://github.com/vireocodedev/fixture-app.git'
        if arguments[:2] == ['systemctl', 'show']:
            unit, field = arguments[2], arguments[3].removeprefix('--property=')
            if field == 'LoadState' and unit not in (self.timer, self.service):
                return self.properties.get((unit, field), 'not-found')
            return self.properties.get((unit, field), '')
        self.writes.append(arguments)
        return ''

    def policy(self):
        return schedule.installed_policy(self.ctx, self.source, self.state, self.execute, self.digest)

    def test_policy_binds_receipt_source_runtime_ports_and_hardcoded_retention(self):
        policy = self.policy()
        self.assertEqual(policy['retention_days'], 30)
        self.assertEqual(policy['runtime_sha256'], self.digest(self.code / 'runtime.py'))
        self.assertEqual(self.writes, [])

    def test_changed_installed_source_or_protected_receipt_is_rejected(self):
        for filename in ('runtime.py', 'controller.py', 'protocol.py', 'github_app.py'):
            path = self.code / filename
            original = path.read_bytes()
            path.write_bytes(original + b'\n# unexpected change\n')
            with self.subTest(filename=filename), self.assertRaisesRegex(schedule.InitError, 'Installed backup source'):
                self.policy()
            path.write_bytes(original)
        self.mutate('installation.json', {'source_sha': 'c' * 40})
        with self.assertRaisesRegex(schedule.InitError, 'receipt'):
            self.policy()

    def test_consumer_source_pin_runtime_and_permission_mismatches_fail_closed(self):
        for filename, changes in [('controller.json', {'repository': 'vireocodedev/another'}),
                                  ('controller.json', {'trusted_sha256': {}}),
                                  ('runtime.json', {'slug': 'another'}),
                                  ('runtime.json', {'environments': {}})]:
            original = (self.settings / filename).read_text()
            self.mutate(filename, changes)
            with self.subTest(filename=filename, changes=changes), self.assertRaises(schedule.InitError):
                self.policy()
            (self.settings / filename).write_text(original)
        (self.settings / 'installation.json').chmod(0o644)
        with self.assertRaisesRegex(schedule.InitError, 'root-only'):
            self.policy()

    def test_retention_implementation_change_requires_explicit_review(self):
        path = self.source / 'infrastructure/release/runtime.py'
        path.write_text(path.read_text().replace('30 * 86400', '10 * 86400'))
        shutil.copyfile(path, self.code / 'runtime.py')
        installation = json.loads((self.settings / 'installation.json').read_text())
        installation['files']['runtime.py'] = self.digest(path)
        self.write('installation.json', installation)
        with self.assertRaisesRegex(schedule.InitError, 'retention policy changed'):
            self.policy()

    def test_effective_units_read_back_schedule_persistence_command_and_next_fire(self):
        result = schedule.inspect_units(self.ctx, self.execute, self.digest, active=True)
        self.assertEqual(result['schedule'], '*-*-* 03:00:00 Europe/Zagreb')
        self.assertFalse(result['staging_scheduled'])
        self.assertFalse(result['scheduled_execution_observed'])
        self.assertIn('2026-10-28', result['next_fire'])
        self.assertEqual(self.writes, [])

    def test_effective_timer_and_service_overrides_are_rejected_without_changes(self):
        invalid = [(self.timer, 'TimersCalendar', '{ OnCalendar=*-*-* 03:00:00 UTC ; next_elapse=n/a }'),
                   (self.timer, 'TimersCalendar', self.properties[self.timer, 'TimersCalendar'] * 2),
                   (self.timer, 'TimersMonotonic', '{ OnBootUSec=1min }'), (self.timer, 'Persistent', 'no'),
                   (self.timer, 'Unit', 'another.service'), (self.timer, 'OnClockChange', 'yes'),
                   (self.service, 'DropInPaths', '/etc/systemd/system/override.conf'),
                   (self.service, 'ExecStart', self.properties[self.service, 'ExecStart'].replace('runtime.py', 'other.py')),
                   (self.service, 'Environment', 'PYTHONPATH=/tmp/unsafe'),
                   (self.service, 'ExecStartPost', '/usr/bin/another'), (self.service, 'UMask', '0022'),
                   ('web-app-backup-fixture-app-staging.timer', 'LoadState', 'loaded')]
        for unit, field, value in invalid:
            old = self.properties.get((unit, field))
            self.properties[unit, field] = value
            with self.subTest(unit=unit, field=field), self.assertRaises(schedule.InitError):
                schedule.inspect_units(self.ctx, self.execute, self.digest)
            if old is None:
                del self.properties[unit, field]
            else:
                self.properties[unit, field] = old
        self.assertEqual(self.writes, [])

    def test_missing_active_readback_or_next_fire_is_not_success(self):
        for field, value in [('ActiveState', 'inactive'), ('UnitFileState', 'disabled'),
                             ('NextElapseUSecRealtime', ''), ('NextElapseUSecRealtime', 'n/a')]:
            old = self.properties[self.timer, field]
            self.properties[self.timer, field] = value
            with self.subTest(field=field), self.assertRaises(schedule.InitError):
                schedule.inspect_units(self.ctx, self.execute, self.digest, active=True)
            self.properties[self.timer, field] = old

    def test_approved_activation_checks_before_enable_and_records_only_immediate_evidence(self):
        with mock.patch.object(operator, 'context', return_value=self.ctx), \
                mock.patch.object(operator, 'read_state', return_value=self.state), \
                mock.patch.object(operator, 'protected_source', return_value=self.source), \
                mock.patch.object(operator, 'protected_file_digest', side_effect=self.digest), \
                mock.patch.object(operator, 'execute', side_effect=self.execute), \
                mock.patch.dict(sys.modules, {'_backup_schedule': schedule}), \
                mock.patch.object(operator, 'update_state') as update, contextlib.redirect_stdout(io.StringIO()) as output:
            operator.enable_backup_schedule(SimpleNamespace(reviewed=True))
        self.assertEqual(self.writes, [['systemctl', 'enable', '--now', self.timer]])
        evidence = update.call_args.kwargs['backup_schedule']
        self.assertFalse(evidence['scheduled_execution_observed'])
        self.assertEqual(evidence['retention_days'], 30)
        self.assertIn('still pending', output.getvalue())

    def test_preflight_failure_does_not_enable_timer_or_record_success(self):
        self.properties[self.timer, 'Persistent'] = 'no'
        with mock.patch.object(operator, 'context', return_value=self.ctx), \
                mock.patch.object(operator, 'read_state', return_value=self.state), \
                mock.patch.object(operator, 'protected_source', return_value=self.source), \
                mock.patch.object(operator, 'protected_file_digest', side_effect=self.digest), \
                mock.patch.object(operator, 'execute', side_effect=self.execute), \
                mock.patch.dict(sys.modules, {'_backup_schedule': schedule}), \
                mock.patch.object(operator, 'update_state') as update, self.assertRaises(schedule.InitError):
            operator.enable_backup_schedule(SimpleNamespace(reviewed=True))
        self.assertEqual(self.writes, [])
        update.assert_not_called()


if __name__ == '__main__':
    unittest.main()
