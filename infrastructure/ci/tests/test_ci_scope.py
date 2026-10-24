import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    'ci_scope', Path(__file__).resolve().parents[1] / 'ci_scope.py')
ci = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ci)


class CIScopeTests(unittest.TestCase):
    def test_exact_path_selection(self):
        for paths, expected in (
                (['backend/src/main/App.java'], (True, False, False)),
                (['frontend/package-lock.json'], (False, True, False)),
                (['tools/generators/templates/backend.mjs'], (True, True, False)),
                (['package.json'], (True, True, False)),
                (['generator-policy.json'], (True, True, False)),
                (['backend/build.gradle', 'frontend/src/main.tsx'], (True, True, False)),
                (['docs/template-initialization.md'], (False, False, False)),
                (['infrastructure/ci/manage.py'], (False, False, True)),
                (['.github/workflows/ci.yml'], (True, True, True)),
                (['.vscode/launch.json'], (True, True, True)),
                (['infrastructure/release/smoke_images.py'], (True, True, True)),
                (['infrastructure/ci/ci_scope.py'], (True, True, True)),
                (['infrastructure/ci/test_shards.py'], (True, True, True)),
                (['infrastructure/ci/test-timings.json'], (True, True, True)),
                (['infrastructure/ci/tests/test_ci_shards.py'], (True, True, True))):
            with self.subTest(paths=paths):
                self.assertEqual(tuple(ci.scope(paths).values()), expected)
        self.assertEqual(tuple(ci.scope([], force=True).values()), (True, True, True))

    def needs(self, owners=('backend',)):
        needs = {'changes': {'result': 'success', 'outputs': {
            owner: str(owner in owners).lower() for owner in ci.LANES}},
            'portable': {'result': 'success'}}
        for owner, lanes in ci.LANES.items():
            for lane in lanes:
                needs[lane] = {'result': 'success' if owner in owners else 'skipped'}
        return needs

    def test_gate_accepts_each_selected_combination(self):
        for owners in ((), ('frontend',), ('backend',), ('foundation',), tuple(ci.LANES)):
            with self.subTest(owners=owners):
                ci.gate(self.needs(owners))

    def test_every_required_lane_is_fail_closed(self):
        needs = self.needs(tuple(ci.LANES))
        for lane in needs:
            for result in ('failure', 'cancelled', 'skipped', None):
                changed = copy.deepcopy(needs)
                changed[lane]['result'] = result
                with self.subTest(lane=lane, result=result), self.assertRaises(ValueError):
                    ci.gate(changed)
            changed = copy.deepcopy(needs)
            del changed[lane]
            with self.subTest(missing=lane), self.assertRaises(ValueError):
                ci.gate(changed)

    def test_unselected_lanes_must_really_skip_and_docs_never_skip(self):
        for owner, lanes in ci.LANES.items():
            for lane in lanes:
                needs = self.needs(())
                needs[lane]['result'] = 'success'
                with self.subTest(lane=lane), self.assertRaises(ValueError):
                    ci.gate(needs)
        for value in (None, 'yes', True):
            needs = self.needs()
            needs['changes']['outputs']['frontend'] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                ci.gate(needs)


if __name__ == '__main__':
    unittest.main()
