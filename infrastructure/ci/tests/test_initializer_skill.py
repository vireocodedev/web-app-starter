"""Lint the portable skill contract; real consumer execution is a separate rehearsal."""
import json
from pathlib import Path
import re
import subprocess
import unittest
import urllib.parse

ROOT = Path(__file__).resolve().parents[3]
SKILL = ROOT / '.github/skills/initialize-project/SKILL.md'
CONTRACT = ROOT / 'docs/initialization-contract.md'


def metadata_and_body(text):
    match = re.fullmatch(r'---\n(.*?)\n---\n(.*)', text, re.DOTALL)
    if not match:
        raise ValueError('Skill must start with bounded YAML frontmatter.')
    # This skill deliberately uses only a flat YAML subset; full YAML is also
    # checked by the authoring validator without adding a runtime CI dependency.
    values = {}
    for line in match[1].splitlines():
        key, separator, value = line.partition(': ')
        if not separator or key in values:
            raise ValueError('Invalid or duplicate skill metadata.')
        values[key] = json.loads(value) if value.startswith('"') or value in ('true', 'false') else value
    return values, match[2]


def maturity(text):
    statuses = re.findall(r'^Status: (.+)$', text, re.MULTILINE)
    if len(statuses) != 1 or statuses[0] not in ('In Development', 'Stable'):
        raise ValueError('One canonical, valid maturity status is required.')
    return statuses[0]


def heading_slugs(text):
    return {re.sub(r'[^\w -]', '', heading.replace('`', '')).lower().replace(' ', '-')
            for heading in re.findall(r'^#{1,6} (.+)$', text, re.MULTILINE)}


class InitializerSkillTests(unittest.TestCase):
    def test_project_discovery_and_manual_no_argument_packaging(self):
        metadata, body = metadata_and_body(SKILL.read_text())
        self.assertEqual(set(metadata), {'name', 'description', 'user-invocable', 'disable-model-invocation'})
        self.assertEqual(metadata['name'], SKILL.parent.name)
        self.assertEqual(metadata['name'], 'initialize-project')
        self.assertIs(metadata['user-invocable'], True)
        self.assertIs(metadata['disable-model-invocation'], True)
        self.assertTrue(0 < len(metadata['description']) <= 1024)
        self.assertLess(len(body.splitlines()), 500)
        self.assertLess(body.index('## Start'), body.index('## Workflow'))
        self.assertLess(body.index('## Workflow'), body.index('## Finish'))

    def test_both_user_maturity_values_work_without_changing_the_workflow(self):
        text = SKILL.read_text()
        current = maturity(text)
        for status in ('In Development', 'Stable'):
            self.assertEqual(maturity(text.replace('Status: ' + current, 'Status: ' + status, 1)), status)
        for altered in (
                text.replace('Status: ' + current, 'Status: Proven', 1),
                text.replace('Status: ' + current, '', 1),
                text + '\nStatus: Stable\n'):
            with self.assertRaises(ValueError):
                maturity(altered)

    def test_skill_and_contract_references_ship_inside_the_repository(self):
        for document in (SKILL, CONTRACT, ROOT / 'AGENTS.md', ROOT / 'README.md',
                         ROOT / 'docs/template-initialization.md'):
            text = document.read_text()
            for target in re.findall(r'\[[^\]]+\]\(([^)\s]+)\)', text):
                url = urllib.parse.urlsplit(target)
                if url.scheme or url.netloc:
                    continue
                with self.subTest(document=str(document.relative_to(ROOT)), target=target):
                    resolved = (document.parent / urllib.parse.unquote(url.path)).resolve() if url.path else document
                    self.assertTrue(resolved.is_relative_to(ROOT), 'Project skills cannot depend on personal files.')
                    self.assertTrue(resolved.exists(), 'Referenced setup material must be shipped.')
                    if url.fragment and resolved.is_file() and resolved.suffix == '.md':
                        self.assertIn(url.fragment, heading_slugs(resolved.read_text()))
            if document in (SKILL, CONTRACT):
                self.assertNotIn('/home/bruno/', text)
                self.assertNotIn('~/.agents/', text)

    def test_resume_record_is_ignored_without_creating_it(self):
        state = ROOT / '.template-initialization/state.json'
        before = state.stat() if state.exists() else None
        result = subprocess.run(['git', 'check-ignore', '--quiet', '.template-initialization/state.json'],
                                cwd=ROOT, capture_output=True, timeout=5)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(state.stat() if state.exists() else None, before,
                         'Contract lint must preserve existing consumer progress.')

    def test_readme_and_agent_pointer_reach_the_same_entry_point(self):
        for document in (ROOT / 'README.md', ROOT / 'AGENTS.md'):
            text = document.read_text()
            self.assertIn('/initialize-project', text)
            self.assertIn('.github/skills/initialize-project/SKILL.md', text)
        self.assertIn('docs/initialization-contract.md', SKILL.read_text())


if __name__ == '__main__':
    unittest.main()
