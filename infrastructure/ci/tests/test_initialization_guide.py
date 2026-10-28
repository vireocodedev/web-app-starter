"""Initialization documentation is an executable-name contract, not embedded code."""
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[3]
DIRECTORY = ROOT / 'docs/template-initialization'
SCRIPTS = DIRECTORY / 'scripts'


class InitializationGuideTests(unittest.TestCase):
    def test_every_public_script_matches_a_numbered_guide_call(self):
        guide = (DIRECTORY / 'INIT_GUIDE.md').read_text()
        self.assertEqual(re.findall(r'^## (\d+)\.', guide, re.M), [str(n) for n in range(1, 20)])
        public = {p.name for p in SCRIPTS.iterdir() if re.fullmatch(r'\d+_\d+_[a-z0-9_]+\.(py|sh)', p.name)}
        calls = set()
        section = step = None
        release_handoff_calls = 0
        for line in guide.splitlines():
            heading = re.match(r'^## (\d+)\.', line)
            subheading = re.match(r'^### (\d+)\.(\d+|[A-Z]) ', line)
            if heading:
                section, step = int(heading[1]), None
            if subheading:
                self.assertEqual(int(subheading[1]), section)
                step = subheading[2]
            call = re.match(r'^(?:python3 -B|bash) docs/template-initialization/scripts/(\d+)_(\d+)_([a-z0-9_]+\.(?:py|sh))', line)
            if call:
                if (section, step) == (14, 'A'):
                    self.assertEqual(line, 'python3 -B docs/template-initialization/scripts/11_1_transfer_state.py --release-context')
                    release_handoff_calls += 1
                else:
                    self.assertTrue(step and step.isdigit(), 'A reused script needs an explicit guide contract')
                    self.assertEqual((int(call[1]), int(call[2])), (section, int(step)))
                calls.add(call[1] + '_' + call[2] + '_' + call[3])
        self.assertEqual(calls, public)
        self.assertEqual(release_handoff_calls, 1)
        for fence in re.findall(r'^```[^\n]*\n(.*?)^```', guide, re.M | re.S):
            lines = fence.strip().splitlines()
            self.assertEqual(len(lines), 1, 'Guide contains an embedded program or command recipe')
            self.assertRegex(lines[0], r'^(python3 -B|bash) docs/template-initialization/scripts/\d+_\d+_')
        self.assertNotRegex(guide, r'(?m)^export [A-Z]')

    def test_release_handoff_command_agrees_in_both_guides(self):
        command = 'python3 -B docs/template-initialization/scripts/11_1_transfer_state.py --release-context'
        for name in ('INIT_GUIDE.md', 'INIT_GUIDE_COMPACT.md'):
            guide = (DIRECTORY / name).read_text()
            step = re.search(r'^### 14\.A [^\n]+\n(.*?)(?=^### |^## |\Z)', guide, re.M | re.S)
            self.assertIsNotNone(step, name)
            self.assertIn('workstation', step[0].lower(), name)
            self.assertEqual(re.findall(r'^```bash\n(.*?)\n```', step[1], re.M | re.S), [command], name)

    def test_actual_values_are_ignored_but_example_is_not(self):
        actual = subprocess.run(['git', 'check-ignore', '--quiet', '.template-initialization/values.env'], cwd=ROOT)
        example = subprocess.run(['git', 'check-ignore', '--quiet', 'docs/template-initialization/.env.example'], cwd=ROOT)
        self.assertEqual(actual.returncode, 0)
        self.assertEqual(example.returncode, 1)

    def test_shipped_skill_and_initialization_entrypoints_have_resolvable_local_links(self):
        skill = ROOT / '.agents/skills/template-initialization/SKILL.md'
        self.assertTrue(skill.is_file())
        ignored = subprocess.run(['git', 'check-ignore', '--quiet', str(skill.relative_to(ROOT))], cwd=ROOT)
        self.assertEqual(ignored.returncode, 1, 'Fresh consumers must receive the repository skill')
        documents = [skill, ROOT / 'AGENTS.md', ROOT / 'README.md', DIRECTORY / 'README.md',
                     DIRECTORY / 'INIT_GUIDE.md', DIRECTORY / 'INIT_GUIDE_COMPACT.md', SCRIPTS / 'README.md']
        for document in documents:
            for href in re.findall(r'\[[^\]]+\]\(([^)]+)\)', document.read_text()):
                url = urlsplit(href)
                if url.scheme or url.netloc:
                    continue
                destination = (document.parent / unquote(url.path)).resolve() if url.path else document
                self.assertTrue(destination.exists(), f'{document.relative_to(ROOT)}: {href}')
                if url.fragment and destination.suffix == '.md':
                    headings = re.findall(r'^#{1,6}\s+(.+)$', destination.read_text(), re.M)
                    anchors = {re.sub(r'\s+', '-', re.sub(r'[^\w\s-]', '', heading.lower())) for heading in headings}
                    self.assertIn(unquote(url.fragment), anchors, f'{document.relative_to(ROOT)}: {href}')

    def test_result_records_only_explicit_nonsecret_observations(self):
        spec = importlib.util.spec_from_file_location('initialization_result', SCRIPTS / '19_1_record_result.py')
        module = importlib.util.module_from_spec(spec)
        with mock.patch.object(sys, 'path', [str(SCRIPTS), *sys.path]):
            spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as directory:
            ctx = SimpleNamespace(env_path=Path(directory) / 'values.env', scope='local',
                                  values={'REPOSITORY': 'vireocodedev/fixture-app'})
            with mock.patch.object(module, 'require_consumer'), \
                    mock.patch.object(module, 'env_hash', return_value='a' * 64), \
                    mock.patch.object(module, 'read_state', return_value={
                        'repository_id': 42, 'restored_backup_sha256': 'b' * 64,
                        'retrieved_copy_restored': True, 'password': 'must-not-be-copied',
                        'future_scheduled_backup_succeeded': True}), \
                    mock.patch('builtins.print'):
                module.record(ctx)
            path = Path(directory) / 'result.json'
            report = json.loads(path.read_text())
            self.assertEqual(report['scope'], 'local')
            self.assertEqual(report['observations'], {
                'repository_id': 42, 'restored_backup_sha256': 'b' * 64,
                'retrieved_copy_restored': True})
            self.assertNotIn('must-not-be-copied', path.read_text())
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertNotIn('complete', report)


if __name__ == '__main__':
    unittest.main()
