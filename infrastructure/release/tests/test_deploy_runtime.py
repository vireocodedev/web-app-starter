import copy
from contextlib import contextmanager
import json
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from protocol import ReleaseError
import runtime
from test_release_protocol import PAIR, REPO


def fixture_path(path, directory=False):
    return Path(path)


class RuntimeTests(unittest.TestCase):
    def config(self):
        return {'slug': 'web-app-starter', 'repository': REPO,
                'state': '/var/lib/web-app-deploy/web-app-starter',
                'settings': '/etc/web-app-deploy/web-app-starter', 'environments': {
                    'staging': {'hostname': 'starter-staging.vireocode.com', 'frontend_port': 18080, 'backend_port': 18081},
                    'production': {'hostname': 'starter.vireocode.com', 'frontend_port': 18180, 'backend_port': 18181}}}

    def test_environment_ports_hosts_paths_and_images_are_explicit(self):
        config = self.config()
        with mock.patch.object(runtime, 'protected'):
            runtime.validate(config)
        for transform in (
                lambda value: value['environments']['production'].update(frontend_port=18080),
                lambda value: value['environments']['production'].update(hostname='starter-staging.vireocode.com'),
                lambda value: value.update(state='/tmp/escape')):
            changed = copy.deepcopy(config)
            transform(changed)
            with mock.patch.object(runtime, 'protected'), self.assertRaises(ReleaseError):
                runtime.validate(changed)
        compose = runtime.app_compose(config, 'production', PAIR)
        self.assertEqual(set(compose['services']), {'frontend', 'backend'})
        self.assertNotIn('postgres', compose['services'])
        for component, service in compose['services'].items():
            self.assertEqual(service['image'], PAIR[component])
            self.assertTrue(service['read_only'])
            self.assertEqual(service['cap_drop'], ['ALL'])
            self.assertEqual(service['security_opt'], ['no-new-privileges:true'])
            self.assertTrue(service['ports'][0].startswith('127.0.0.1:'))
            self.assertNotIn('volumes', service)

    def test_production_backup_failure_prevents_candidate_replacement(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'releases').mkdir()
            previous = {'snapshot': str(root / 'old.json'), 'pair': PAIR}
            (root / 'active.json').write_text(json.dumps(previous))
            ticket = {'environment': 'production', 'pair': PAIR, 'run_id': 30, 'run_attempt': 1}

            @contextmanager
            def locked(*args):
                yield root

            with mock.patch.object(runtime, 'validate'), \
                    mock.patch.object(runtime, 'private_packages'), \
                    mock.patch.object(runtime, 'locked', locked), \
                    mock.patch.object(runtime, 'protected', side_effect=fixture_path), \
                    mock.patch.object(runtime, 'scalar', return_value='1'), \
                    mock.patch.object(runtime, 'verify_running'), \
                    mock.patch.object(runtime, 'command'), \
                    mock.patch.object(runtime, 'inspect_image'), \
                    mock.patch.object(runtime, 'backup', side_effect=ReleaseError('backup-failed')), \
                    mock.patch.object(runtime, 'compose') as compose, \
                    self.assertRaisesRegex(ReleaseError, 'backup-failed'):
                runtime.deploy(self.config(), ticket, mock.Mock(token='opaque-token'), 'brunotot')
            self.assertEqual([call.args[3] for call in compose.call_args_list], ['stop', 'start'])
            self.assertEqual(json.loads((root / 'transaction.json').read_text())['state'], 'backup-failed')
            self.assertEqual(json.loads((root / 'active.json').read_text()), previous)

    def test_unfinished_transaction_refuses_retry_before_docker(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'transaction.json').write_text('{"state":"replacing"}')

            @contextmanager
            def locked(*args):
                yield root

            with mock.patch.object(runtime, 'validate'), \
                    mock.patch.object(runtime, 'private_packages'), \
                    mock.patch.object(runtime, 'locked', locked), \
                    mock.patch.object(runtime, 'protected', side_effect=fixture_path), \
                    mock.patch.object(runtime, 'command') as command, \
                    self.assertRaisesRegex(ReleaseError, 'operator-reconciliation'):
                runtime.deploy(self.config(), {'environment': 'staging', 'pair': PAIR}, mock.Mock(), 'brunotot')
            command.assert_not_called()

    def test_retention_recovers_old_complete_or_incomplete_pairs_and_interrupted_pruning(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old = time.time() - 31 * 86400
            names = ('20100101T000000Z-00000001.dump', '20100101T000000Z-00000001.dump.json',
                     '20100101T000000Z-00000002.dump',
                     '20100101T000000Z-00000003.dump.json',
                     '20100101T000000Z-00000004.dump.partial')
            for name in names:
                candidate = root / name
                candidate.write_text('fixture')
                os.utime(candidate, (old, old))
            recent = root / '20261015T000000Z-00000005.dump'
            recent.write_text('fresh')
            unrelated = root / 'operator-notes'
            unrelated.write_text('keep')
            with mock.patch.object(runtime, 'protected', side_effect=fixture_path):
                runtime.prune_backups(root)
                runtime.prune_backups(root)
            self.assertEqual({path.name for path in root.iterdir()}, {recent.name, unrelated.name})

    def test_failed_dump_never_enters_completed_backup_inventory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'backups').mkdir()
            def failed_dump(*args, **kwargs):
                kwargs['stdout'].write(b'incomplete')
                return mock.Mock(returncode=1)
            with mock.patch.object(runtime, 'protected', side_effect=fixture_path), \
                    mock.patch.object(runtime.subprocess, 'run', side_effect=failed_dump), \
                    self.assertRaisesRegex(ReleaseError, 'dump-failed'):
                runtime.backup(self.config(), 'production', root)
            self.assertEqual(list((root / 'backups').iterdir()), [])

    def test_verified_new_backup_survives_retention_of_a_legacy_orphan(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            backups = root / 'backups'
            backups.mkdir()
            orphan = backups / '20100101T000000Z-00000001.dump'
            orphan.write_text('incomplete')
            old = time.time() - 31 * 86400
            os.utime(orphan, (old, old))
            def archive(*args, **kwargs):
                if 'stdout' in kwargs:
                    kwargs['stdout'].write(b'PGDMP' + b'x' * 1024)
                    return mock.Mock(returncode=0)
                return mock.Mock(returncode=0, stdout=b'TOC Entries: 5')
            with mock.patch.object(runtime, 'protected', side_effect=fixture_path), \
                    mock.patch.object(runtime.subprocess, 'run', side_effect=archive), \
                    mock.patch.object(runtime, 'scalar', side_effect=['t', '1']):
                result = runtime.backup(self.config(), 'production', root)
            self.assertFalse(orphan.exists())
            self.assertTrue(result.exists())
            self.assertEqual(json.loads(result.with_suffix('.dump.json').read_text())['users'], 1)


if __name__ == '__main__':
    unittest.main()
