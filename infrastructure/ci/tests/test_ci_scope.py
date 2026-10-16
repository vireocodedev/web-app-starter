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
                (['backend/build.gradle', 'frontend/src/main.tsx'], (True, True, False)),
                (['docs/template-initialization.md'], (False, False, False)),
                (['infrastructure/ci/manage.py'], (False, False, True)),
                (['.github/workflows/ci.yml'], (True, True, True)),
                (['.agents/skills/initialize-project/scripts/prepare.mjs'], (True, True, True)),
                (['.agents/skills/unrelated/SKILL.md'], (False, False, False)),
                (['.agents/skills/initialize-project-other/SKILL.md'], (False, False, False)),
                (['.vscode/launch.json'], (True, True, True)),
                (['infrastructure/release/smoke_images.py'], (True, True, True)),
                (['infrastructure/ci/ci_scope.py'], (True, True, True))):
            with self.subTest(paths=paths):
                self.assertEqual(tuple(ci.scope(paths).values()), expected)
        self.assertEqual(tuple(ci.scope([], force=True).values()), (True, True, True))

    def needs(self):
        return {
            'changes': {'result': 'success', 'outputs': {
                'backend': 'true', 'frontend': 'false', 'foundation': 'false'}},
            'backend': {'result': 'success'},
            'frontend': {'result': 'skipped'},
            'foundation': {'result': 'skipped'},
        }

    def test_gate_accepts_only_expected_success_and_skips(self):
        ci.gate(self.needs())
        for job, result in (('backend', 'failure'), ('backend', 'cancelled'),
                            ('backend', 'skipped'), ('frontend', 'success'),
                            ('changes', 'failure')):
            needs = copy.deepcopy(self.needs())
            needs[job]['result'] = result
            with self.subTest(job=job, result=result), self.assertRaises(ValueError):
                ci.gate(needs)
        needs = self.needs()
        del needs['changes']['outputs']['backend']
        with self.assertRaises(ValueError):
            ci.gate(needs)


if __name__ == '__main__':
    unittest.main()
