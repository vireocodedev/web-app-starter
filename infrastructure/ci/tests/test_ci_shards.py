import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    'test_shards', Path(__file__).resolve().parents[1] / 'test_shards.py')
ci = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ci)


class ShardTests(unittest.TestCase):
    def test_weighted_assignment_is_complete_stable_and_preserves_affinity(self):
        units = ['slow', 'shared-a', 'small', 'shared-b', 'medium']
        weights = {'slow': 10, 'medium': 5}
        groups = {'shared-a': 'one-context', 'shared-b': 'one-context'}
        assigned = ci.assign(units, 3, weights, groups)
        self.assertEqual(assigned, ci.assign(list(reversed(units)), 3, weights, groups))
        self.assertEqual(sorted(sum(assigned, [])), sorted(units))
        self.assertEqual(assigned, [['slow'], ['medium'], ['shared-a', 'shared-b', 'small']])
        self.assertTrue(any('shared-a' in shard and 'shared-b' in shard for shard in assigned))
        for invalid in ([1, 1],):
            with self.assertRaises(ValueError):
                ci.assign(invalid, 2)
        for weight in (0, -1, '10', float('nan'), float('inf')):
            with self.subTest(weight=weight), self.assertRaises(ValueError):
                ci.assign(['a'], 2, {'a': weight})

    def frontend(self):
        return {'success': True, 'numTotalTests': 2, 'numPassedTests': 2,
                'testResults': [{'name': str(ci.ROOT / 'frontend/tests/example.test.ts'),
                                 'status': 'passed', 'startTime': 100, 'endTime': 130,
                                 'assertionResults': [
                                     {'fullName': 'same name', 'status': 'passed'},
                                     {'fullName': 'same name', 'status': 'passed'}]}]}

    def test_frontend_duplicate_human_names_do_not_collapse_and_skips_fail(self):
        raw = self.frontend()
        tests, durations = ci.frontend_results(raw, ['tests/example.test.ts'])
        self.assertEqual(len({test['id'] for test in tests}), 2)
        self.assertEqual(durations['tests/example.test.ts'], 30)
        for status in ('failed', 'skipped', 'pending', 'todo'):
            changed = copy.deepcopy(raw)
            changed['testResults'][0]['assertionResults'][0]['status'] = status
            with self.subTest(status=status), self.assertRaises(ValueError):
                ci.frontend_results(changed, ['tests/example.test.ts'])
        with self.assertRaises(ValueError):
            ci.frontend_results(raw, ['tests/other.test.ts'])
        raw['testResults'].append(copy.deepcopy(raw['testResults'][0]))
        with self.assertRaises(ValueError):
            ci.frontend_results(raw, ['tests/example.test.ts'])

    def test_xml_inventory_preserves_repeated_names_and_rejects_execution_skips(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'TEST-example.xml'
            path.write_text('<testsuite tests="2"><testcase classname="app.Tests" name="same" time="0.1"/>'
                            '<testcase classname="app.Tests" name="same" time="0.2"/></testsuite>')
            units, tests, _ = ci.xml_tests(directory)
            self.assertEqual(units, ['app.Tests'])
            self.assertEqual(len(tests), 2)
            path.write_text(path.read_text().replace('time="0.1"/>', 'time="0.1"><skipped/></testcase>'))
            with self.assertRaises(ValueError):
                ci.xml_tests(directory)
            with self.assertRaises(ValueError):
                ci.xml_tests(directory, inventory=True)
            path.write_text(path.read_text().replace('time="0.2"/>', 'time="0.2"><skipped/></testcase>'))
            self.assertEqual(len(ci.xml_tests(directory, inventory=True)[1]), 2)

    def reports(self, directory):
        binding = {'sourceSha': 'a' * 40, 'runId': '10', 'runAttempt': '1'}
        units = ['app.A', 'app.B']
        assigned = ci.assign(units, 3)
        inventory = [['app.A', 'app.A::works'], ['app.B', 'app.B::works']]
        reports = []
        for number, selected in enumerate(assigned, 1):
            report = {'schemaVersion': 1, 'kind': 'backend', **binding, 'shard': number,
                      'total': 3, 'units': units, 'inventory': inventory, 'assignments': assigned,
                      'selected': selected, 'tests': [{'id': unit + '::works::1', 'status': 'passed'}
                                                     for unit in selected]}
            path = Path(directory) / f'backend-shard-{number}-1/shard-report.json'
            ci.write_json(path, report)
            reports.append((path, report))
        return binding, reports

    @patch.object(ci, 'settings', return_value=({}, {}))
    def test_gate_rejects_missing_duplicate_stale_and_omitted_execution(self, _):
        with tempfile.TemporaryDirectory() as directory:
            binding, reports = self.reports(directory)
            ci.verify_reports('backend', directory, binding)
            for key, value in (('runAttempt', '2'), ('sourceSha', 'b' * 40), ('shard', 2),
                               ('selected', []), ('tests', []), ('inventory', [])):
                path, original = reports[0]
                changed = copy.deepcopy(original)
                changed[key] = value
                ci.write_json(path, changed)
                with self.subTest(key=key), self.assertRaises(ValueError):
                    ci.verify_reports('backend', directory, binding)
                ci.write_json(path, original)
            reports[0][0].unlink()
            with self.assertRaises(ValueError):
                ci.verify_reports('backend', directory, binding)

    def test_workflow_retains_all_required_lanes_and_bounded_shards(self):
        workflow = (ci.ROOT / '.github/workflows/ci.yml').read_text()
        self.assertIn('shard: [1, 2, 3, 4]', workflow)
        self.assertIn('shard: [1, 2, 3]', workflow)
        self.assertIn('name: CI gate', workflow)
        self.assertIn('needs: [changes, portable, backend, backend-tests, frontend, frontend-tests, frontend-build, foundation]', workflow)
        self.assertIn("pattern: '*-shard-*-${{ github.run_attempt }}'", workflow)
        portable = workflow.split('\n  portable:')[1].split('\n  backend:')[0]
        self.assertNotIn('    if:', portable)
        self.assertNotIn('    needs:', portable)
        changes = workflow.split('\n  changes:')[1].split('\n  portable:')[0]
        self.assertNotIn('setup-node', changes)
        self.assertNotIn('npm ', changes)


if __name__ == '__main__':
    unittest.main()
