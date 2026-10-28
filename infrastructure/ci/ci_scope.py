"""Monorepo CI routing and an aggregate gate that never hides failed jobs."""
import argparse
import json
import os
import re
import subprocess


def scope(paths, force=False):
    shared = force or any(path.startswith(('.github/', '.vscode/', 'infrastructure/release/',
                                          'docs/template-initialization/scripts/',
                                          'docs/project-deletion/scripts/'))
                          or path in ('infrastructure/ci/ci_scope.py', 'infrastructure/ci/test_shards.py',
                                      'infrastructure/ci/test-timings.json',
                                      'docs/template-initialization/.env.example',
                                      'docs/project-deletion/.env.example',
                                      'infrastructure/ci/tests/test_ci_shards.py') for path in paths)
    return {
        'backend': shared or any(path.startswith('backend/') for path in paths),
        'frontend': shared or any(path.startswith('frontend/') for path in paths),
        'foundation': shared or any(path.startswith('infrastructure/') for path in paths),
    }


LANES = {
    'backend': ('backend', 'backend-tests'),
    'frontend': ('frontend', 'frontend-tests', 'frontend-build'),
    'foundation': ('foundation',),
}


def gate(needs):
    changes = needs.get('changes', {})
    if changes.get('result') != 'success':
        raise ValueError('CI change detection did not succeed.')
    for owner, jobs in LANES.items():
        selected = changes.get('outputs', {}).get(owner)
        if selected not in ('true', 'false'):
            raise ValueError('Missing or invalid CI selection: ' + owner)
        expected = 'success' if selected == 'true' else 'skipped'
        for job in jobs:
            if needs.get(job, {}).get('result') != expected:
                raise ValueError('CI job did not reach its required result: ' + job)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=('detect', 'gate'))
    args = parser.parse_args()
    if args.operation == 'gate':
        gate(json.loads(os.environ['CI_NEEDS']))
        print('All selected verification jobs succeeded; unrelated jobs were skipped.')
        return
    force = os.environ.get('CI_FORCE_ALL') == 'true'
    base = os.environ.get('CI_BASE_SHA', '')
    if base == '0' * 40:
        force = True
    paths = []
    if not force:
        if not re.fullmatch('[0-9a-f]{40}', base):
            raise ValueError('A valid CI comparison commit is required.')
        result = subprocess.run(
            ['git', 'diff', '--name-only', '--no-renames', '-z', base, 'HEAD'],
            check=True, capture_output=True)
        paths = result.stdout.decode().split('\0')
    selected = scope(paths, force)
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        for job, enabled in selected.items():
            output.write(f'{job}={str(enabled).lower()}\n')
    print(json.dumps(selected, sort_keys=True))


if __name__ == '__main__':
    main()
