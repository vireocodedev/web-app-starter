"""Run bounded test shards and prove that the complete collected suite executed.

No network, credentials, writable shared caches or test-selection heuristics belong
here. The source-bound timing file affects assignment only, never membership.
"""
import argparse
from collections import Counter
import json
import math
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
COUNTS = {'frontend': 4, 'backend': 3}


def read_json(path):
    return json.loads(Path(path).read_text())


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + '\n')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def identity():
    source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    require(re.fullmatch('[0-9a-f]{40}', source), 'Invalid source SHA')
    require(source == os.environ.get('GITHUB_SHA', source), 'Checkout differs from workflow source')
    return {'sourceSha': source, 'runId': os.environ.get('GITHUB_RUN_ID', 'local'),
            'runAttempt': os.environ.get('GITHUB_RUN_ATTEMPT', '1')}


def assign(units, count, weights=None, affinities=None):
    """Longest-weight-first, stable ties; affinity groups cannot be split."""
    require(count > 0 and len(units) == len(set(units)), 'Invalid shard inventory')
    weights = weights or {}
    affinities = affinities or {}
    groups = {}
    for unit in sorted(units):
        groups.setdefault(affinities.get(unit, unit), []).append(unit)
    def weight(unit):
        value = weights.get(unit, 1)
        require(type(value) in (int, float) and math.isfinite(value) and value > 0, 'Invalid timing weight')
        return value
    ordered = sorted(groups.values(), key=lambda group: (-sum(weight(u) for u in group), group))
    shards, loads = [[] for _ in range(count)], [0] * count
    for group in ordered:
        index = min(range(count), key=lambda i: (loads[i], i))
        shards[index].extend(group)
        loads[index] += sum(weight(u) for u in group)
    return [sorted(shard) for shard in shards]


def frontend_inventory():
    directory = ROOT / 'frontend'
    return sorted(str(path.relative_to(directory)) for path in directory.glob('tests/**/*')
                  if path.is_file() and path.relative_to(directory).parts[:2] != ('tests', 'browser')
                  and re.search(r'\.(test|spec)\.tsx?$', path.name))


def frontend_results(raw, selected):
    require(raw.get('success') is True, 'Vitest reported failure')
    results, durations, units = [], {}, []
    for suite in raw.get('testResults', []):
        unit = str(Path(suite['name']).resolve().relative_to(ROOT / 'frontend'))
        units.append(unit)
        require(suite.get('status') == 'passed', 'Vitest module did not pass: ' + unit)
        assertions = suite.get('assertionResults', [])
        require(assertions, 'Vitest module collected no tests: ' + unit)
        # Identical human names are legal. Keep their occurrence index as part of
        # the identity instead of silently collapsing duplicate names into a set.
        names = Counter()
        for assertion in assertions:
            name = assertion['fullName']
            names[name] += 1
            require(assertion.get('status') == 'passed', 'Failed, pending or skipped test: ' + name)
            results.append({'id': f'{unit}::{name}::{names[name]}', 'status': 'passed'})
        durations[unit] = max(1, suite['endTime'] - suite['startTime'])
    require(Counter(units) == Counter(selected), 'Vitest ran missing, duplicate or unexpected files')
    require(raw.get('numPassedTests') == len(results) == raw.get('numTotalTests'), 'Vitest count mismatch')
    require(all(raw.get(key, 0) == 0 for key in ('numFailedTests', 'numPendingTests', 'numTodoTests')),
            'Vitest omitted or skipped tests')
    return results, durations


def xml_tests(directory, inventory=False):
    """Keep test-case occurrence counts: parameter/display names need not be unique."""
    tests, units, durations = [], set(), {}
    for path in sorted(Path(directory).glob('TEST-*.xml')):
        suite = ET.parse(path).getroot()
        require(suite.tag == 'testsuite', 'Invalid Gradle XML root')
        cases = suite.findall('testcase')
        require(int(suite.get('tests', '-1')) == len(cases), 'Gradle XML count mismatch')
        for case in cases:
            name = case.attrib['classname']
            unit = name.split('$')[0]
            units.add(unit)
            skipped = case.find('skipped') is not None
            failed = case.find('failure') is not None or case.find('error') is not None
            require(not failed, 'Failed backend test: ' + name)
            require(skipped == inventory, 'Unexpected backend test skip or inventory execution: ' + name)
            tests.append((unit, name + '::' + case.attrib['name']))
            durations[unit] = durations.get(unit, 0) + float(case.get('time', '0')) * 1000
    require(tests, 'Gradle collected no tests')
    return sorted(units), tests, {k: max(1, v) for k, v in durations.items()}


def run(command, cwd):
    print('+ ' + ' '.join(map(str, command)), flush=True)
    subprocess.run(list(map(str, command)), cwd=cwd, check=True)


def settings(kind):
    config = read_json(ROOT / 'infrastructure/ci/test-timings.json')
    require(config.get('schemaVersion') == 1, 'Invalid test timing configuration')
    return config.get(kind, {}).get('weights', {}), config.get(kind, {}).get('affinities', {})


def run_shard(kind, number, output):
    require(1 <= number <= COUNTS[kind], 'Invalid shard number')
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    binding = identity()
    if kind == 'frontend':
        run(['node', 'node_modules/vitest/vitest.mjs', 'list', '--filesOnly',
             '--json=' + str(output / 'collected-files.json')], ROOT / 'frontend')
        collected = read_json(output / 'collected-files.json')
        require(all(not item.get('projectName') for item in collected), 'Named Vitest projects need explicit inventory support')
        units = sorted(str(Path(item['file']).resolve().relative_to(ROOT / 'frontend')) for item in collected)
        require(units == frontend_inventory(), 'Vitest collection differs from complete source test inventory')
        inventory = None
    else:
        run(['./gradlew', '--no-daemon', '--console=plain', 'ciTestInventory'], ROOT / 'backend')
        units, inventory, _ = xml_tests(ROOT / 'backend/build/test-results/ciTestInventory', inventory=True)
    weights, affinities = settings(kind)
    assignments = assign(units, COUNTS[kind], weights, affinities)
    selected = assignments[number - 1]
    if selected and kind == 'frontend':
        run(['node', 'node_modules/vitest/vitest.mjs', 'run', '--maxWorkers=1',
             '--reporter=default', '--reporter=json', '--outputFile.json=' + str(output / 'vitest.json'),
             *selected], ROOT / 'frontend')
        tests, durations = frontend_results(read_json(output / 'vitest.json'), selected)
    elif selected:
        selector = output / 'backend-classes.txt'
        selector.write_text('\n'.join(selected) + '\n')
        run(['./gradlew', '--no-daemon', '--console=plain', 'test',
             '-PciTestClassesFile=' + str(selector)], ROOT / 'backend')
        actual_units, actual_tests, durations = xml_tests(ROOT / 'backend/build/test-results/test')
        require(Counter(actual_units) == Counter(selected), 'Gradle ran missing or unexpected classes')
        expected = Counter(test for unit, test in inventory if unit in selected)
        require(Counter(test for _, test in actual_tests) == expected, 'Gradle execution differs from collected test inventory')
        occurrences = Counter()
        tests = []
        for _, test in actual_tests:
            occurrences[test] += 1
            tests.append({'id': f'{test}::{occurrences[test]}', 'status': 'passed'})
    else:
        tests, durations = [], {}
    report = {'schemaVersion': 1, 'kind': kind, **binding, 'shard': number,
              'total': COUNTS[kind], 'units': units, 'assignments': assignments,
              'inventory': inventory, 'selected': selected, 'tests': tests,
              'durationsMs': durations, 'elapsedSeconds': round(time.monotonic() - started, 3)}
    write_json(output / 'shard-report.json', report)


def verify_reports(kind, directory, binding):
    paths = sorted(Path(directory).glob(f'{kind}-shard-*/shard-report.json'))
    require(len(paths) == COUNTS[kind], 'Missing or extra shard reports: ' + kind)
    reports = [read_json(path) for path in paths]
    require(sorted(r.get('shard') for r in reports) == list(range(1, COUNTS[kind] + 1)), 'Duplicate shard report')
    first = reports[0]
    units, inventory = first['units'], first['inventory']
    require(units and len(set(units)) == len(units), 'Empty or duplicate collected inventory')
    if kind == 'frontend':
        require(units == frontend_inventory(), 'Final frontend inventory differs from source')
    weights, affinities = settings(kind)
    expected_assignments = assign(units, COUNTS[kind], weights, affinities)
    flattened, test_ids = [], []
    for report in reports:
        require(report.get('schemaVersion') == 1 and report.get('kind') == kind, 'Invalid shard schema')
        require(all(report.get(key) == value for key, value in binding.items()), 'Report belongs to a different source or run')
        require(report['total'] == COUNTS[kind] and report['units'] == units and report['inventory'] == inventory,
                'Inconsistent collected inventories')
        require(report['assignments'] == expected_assignments, 'Invalid or altered shard assignments')
        selected = expected_assignments[report['shard'] - 1]
        require(report['selected'] == selected, 'Shard selected the wrong tests')
        flattened.extend(selected)
        require(bool(report['tests']) == bool(selected), 'Selected shard did not execute tests')
        require(all(test.get('status') == 'passed' for test in report['tests']), 'Failed or skipped test')
        if kind == 'frontend':
            for test in report['tests']:
                require(sum(test['id'].startswith(unit + '::') for unit in selected) == 1,
                        'Frontend assertion belongs to an unassigned file')
            require(all(any(test['id'].startswith(unit + '::') for test in report['tests']) for unit in selected),
                    'Frontend file has no executed assertions')
        test_ids.extend(test['id'] for test in report['tests'])
    require(Counter(flattened) == Counter(units), 'Missing or duplicate assignment')
    require(len(test_ids) == len(set(test_ids)), 'Duplicate test execution between shards')
    if kind == 'backend':
        expected = Counter()
        for _, test in inventory:
            expected[test] += 1
        expected_ids = {f'{name}::{i}' for name, count in expected.items() for i in range(1, count + 1)}
        require(set(test_ids) == expected_ids, 'Final backend inventory mismatch')
    print(f'{kind}: {len(units)} collected units, {len(test_ids)} passing tests; complete and exactly once.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='operation', required=True)
    shard = sub.add_parser('run')
    shard.add_argument('kind', choices=COUNTS)
    shard.add_argument('--shard', type=int, required=True)
    shard.add_argument('--output', required=True)
    check = sub.add_parser('verify')
    check.add_argument('kind', choices=COUNTS)
    check.add_argument('--reports', required=True)
    args = parser.parse_args()
    if args.operation == 'run':
        run_shard(args.kind, args.shard, args.output)
    else:
        verify_reports(args.kind, args.reports, identity())


if __name__ == '__main__':
    main()
