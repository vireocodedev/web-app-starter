"""Lint the portable skill contract; real consumer execution is a separate rehearsal."""
import json
from pathlib import Path
import re
import subprocess
import unittest
import urllib.parse

PACKAGE = Path(__file__).resolve().parents[1]
ROOT = PACKAGE.parents[2]
SKILL = PACKAGE / 'SKILL.md'
CONTRACT = PACKAGE / 'references/contract.md'
PREPARATION = PACKAGE / 'references/preparation.md'
REHEARSAL = PACKAGE / 'references/rehearsal-lessons.md'
HAS_TEMPLATE = (ROOT / 'backend/build.gradle').is_file()


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
        documents = [SKILL, CONTRACT, PREPARATION, REHEARSAL, PACKAGE / 'references/runbook.md']
        if HAS_TEMPLATE:
            documents += [ROOT / 'AGENTS.md', ROOT / 'README.md', ROOT / 'docs/template-initialization.md']
        for document in documents:
            text = document.read_text()
            for target in re.findall(r'\[[^\]]+\]\(([^)\s]+)\)', text):
                url = urllib.parse.urlsplit(target)
                if url.scheme or url.netloc:
                    continue
                with self.subTest(document=str(document.relative_to(ROOT)), target=target):
                    resolved = (document.parent / urllib.parse.unquote(url.path)).resolve() if url.path else document
                    self.assertTrue(resolved.is_relative_to(ROOT), 'Project skills cannot depend on personal files.')
                    if not HAS_TEMPLATE and not resolved.is_relative_to(PACKAGE):
                        continue
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

    def test_preparation_answers_and_readiness_report_stay_private(self):
        for name in ('preparation.md', 'readiness.md', 'preparation-draft.json',
                     'preparation-launch.html', 'preparation-session.json',
                     'preparation-server.lock'):
            result = subprocess.run(
                ['git', 'check-ignore', '--quiet', '.template-initialization/' + name],
                cwd=ROOT, capture_output=True, timeout=5)
            self.assertEqual(result.returncode, 0, name + ' must not be committed.')

    def test_preparation_references_ship_without_creating_a_private_copy(self):
        destination = ROOT / '.template-initialization/preparation.md'
        before = destination.stat() if destination.exists() else None
        for target in re.findall(r'\[[^\]]+\]\(([^)\s]+)\)', PREPARATION.read_text()):
            url = urllib.parse.urlsplit(target)
            if url.scheme or url.netloc or not url.path:
                continue
            with self.subTest(target=target):
                expected = (PREPARATION.parent / urllib.parse.unquote(url.path)).resolve()
                if not HAS_TEMPLATE and not expected.is_relative_to(PACKAGE):
                    continue
                self.assertTrue(expected.exists())
        self.assertEqual(destination.stat() if destination.exists() else None, before)

    def test_workbook_ships_complete_but_without_human_authorization(self):
        text = PREPARATION.read_text()
        rows = re.findall(r'^\| `([a-z_]+)` \| ([^|]+) \|', text, re.MULTILINE)
        fields = dict((key, value.strip()) for key, value in rows)
        self.assertEqual(len(rows), len(fields), 'Input labels must be unique.')
        self.assertTrue({
            'repository', 'github_account', 'operator_profile', 'reuse_existing_operator',
            'allow_global_cli_switch', 'project_slug', 'display_name', 'java_base_package',
            'pwa_short_name', 'localization_policy', 'artwork_source', 'theme_policy',
            'data_boundary', 'preserve_resources', 'production_hostname', 'staging_hostname',
            'dns_mode', 'authorized_maintainers', 'initial_username', 'initial_display_name',
            'initial_email', 'backup_destination', 'same_server_loss_acknowledged',
            'backup_time', 'backup_timezone', 'backup_retention_days',
            'deployment_port_range', 'local_port_policy', 'prerequisite_policy',
            'new_paid_resource_ceiling', 'registry_policy', 'registry_delete_auth',
            'old_image_loss_acknowledged', 'execution_mode', 'approval_signer',
            'approval_signed_at', 'approval_expires_at', 'stable_learning_proposals'
        }.issubset(fields))
        for key in ('repository', 'operator_profile', 'reuse_existing_operator',
                    'project_slug', 'display_name', 'java_base_package', 'pwa_short_name',
                    'data_boundary', 'production_hostname', 'staging_hostname', 'dns_mode',
                    'initial_username', 'initial_display_name', 'initial_email',
                    'backup_destination', 'same_server_loss_acknowledged',
                    'backup_time', 'backup_timezone', 'local_port_policy',
                    'execution_mode', 'approval_signer', 'approval_signed_at',
                    'approval_expires_at'):
            self.assertEqual(fields[key], 'REQUIRED', 'The template cannot approve ' + key)
        for key in ('github_account', 'authorized_maintainers', 'deployment_port_range'):
            self.assertEqual(fields[key], 'use-profile')
        self.assertEqual(fields['form_version'], '1')
        self.assertEqual(fields['new_paid_resource_ceiling'], '0')
        self.assertEqual(fields['registry_policy'], 'require-absent')
        self.assertEqual(fields['registry_delete_auth'], 'not-required')
        self.assertEqual(fields['stable_learning_proposals'], 'none')
        self.assertNotRegex(text, r'(?m)^- \[[xX]\]')
        self.assertFalse({'password', 'github_token', 'hcloud_token', 'private_key'} & fields.keys())
        self.assertIn('All versions to delete', text)
        self.assertIn('gh auth refresh --hostname github.com --scopes delete:packages', text)
        self.assertIn('settings/installations', text)
        self.assertIn('server-project token', text)

    def test_file_first_gate_preserves_current_authority_and_completed_consumers(self):
        skill = ' '.join(SKILL.read_text().split())
        contract = ' '.join(CONTRACT.read_text().split())
        for value in ('.template-initialization/preparation.md',
                      '.template-initialization/readiness.md', 'plan-only',
                      'execute-listed-scope', 'SHA-256', 'signed/unexpired'):
            self.assertIn(value, skill)
        self.assertIn('do not start a chat questionnaire', skill)
        self.assertNotIn('asking one focused question at a time', skill)
        self.assertNotIn('Ask one question at a time', contract)
        self.assertLess(skill.index('If completion is recorded'),
                        skill.index('Read the complete ignored'))
        self.assertIn('without mutations or requiring a new workbook', skill)
        self.assertIn('The agent never fills human approvals', contract)
        self.assertIn('current user', contract)
        self.assertIn('signed/expiry times', contract)
        self.assertIn('never grants execution', contract)
        self.assertIn('Mandatory tool/provider approvals still apply', contract)
        self.assertIn('stable_learning_proposals', skill)
        self.assertIn('duplicate/conflicting fields', skill)
        self.assertIn('unknown authorization values block execution', skill)
        self.assertNotIn('brunotot', SKILL.read_text())

    def test_rehearsal_lessons_do_not_ship_consumer_receipts_or_identity(self):
        text = REHEARSAL.read_text()
        self.assertIn('not\nacceptance evidence', text)
        self.assertNotIn('Belts', text)
        self.assertNotIn('acceptance/initialization-acceptance.json', text)
        self.assertIn('Actual IDE acceptance happens **after personalization**', PREPARATION.read_text())
        self.assertIn('a program that has not been personalized', PREPARATION.read_text())

    @unittest.skipUnless(HAS_TEMPLATE, 'Template application is not part of a skill-only installation.')
    def test_single_app_launch_does_not_assume_an_ide_project_name(self):
        configurations = json.loads((ROOT / '.vscode/launch.json').read_text())['configurations']
        backend = next(config for config in configurations if config['name'] == 'Backend: local dev')
        self.assertNotIn('projectName', backend,
                         'The imported IDE project name need not match the Gradle root name.')
        main_class = backend['mainClass']
        source = ROOT / 'backend/src/main/java' / (main_class.replace('.', '/') + '.java')
        self.assertTrue(source.is_file(), 'The launch main class must resolve to the owned source.')
        self.assertIn('package ' + main_class.rsplit('.', 1)[0] + ';', source.read_text())

    @unittest.skipUnless(HAS_TEMPLATE, 'Template historical receipts are not part of a skill-only installation.')
    def test_documentation_acceptance_records_have_one_directory(self):
        directory = ROOT / 'docs/acceptance'
        records = list((ROOT / 'docs').rglob('*-acceptance.json'))
        self.assertTrue(records, 'The documented acceptance evidence must be preserved.')
        for record in records:
            with self.subTest(record=str(record.relative_to(ROOT))):
                self.assertEqual(record.parent, directory)
                self.assertIsInstance(json.loads(record.read_text()), dict)
        self.assertIn('docs/acceptance/', SKILL.read_text())
        self.assertIn('docs/acceptance/initialization-acceptance.json', CONTRACT.read_text())

    @unittest.skipUnless(HAS_TEMPLATE, 'Template CI is not part of a skill-only installation.')
    def test_project_dashboard_is_checked_even_for_documentation_only_ci(self):
        self.assertTrue((ROOT / 'docs/project.html').is_file())
        changes_job = (ROOT / '.github/workflows/ci.yml').read_text().split('\n  backend:')[0]
        self.assertIn('package=.github/skills/initialize-project', changes_job)
        self.assertIn('npm --prefix "$package" run verify', changes_job)
        self.assertNotIn('npm --prefix frontend ci', changes_job)
        self.assertIn('npm --prefix .github/skills/initialize-project run docs:build', SKILL.read_text())
        self.assertIn('docs/project.html', CONTRACT.read_text())

    def test_guided_browser_produces_the_same_private_workbook_not_an_executor(self):
        scripts = json.loads((PACKAGE / 'package.json').read_text())['scripts']
        self.assertEqual(scripts['init:prepare'], 'node scripts/prepare.mjs')
        self.assertIn('test:preparation', scripts['test'])
        self.assertIn('node .github/skills/initialize-project/scripts/prepare.mjs', SKILL.read_text())
        self.assertIn('preparation-draft.json', PREPARATION.read_text())
        self.assertIn('Browser drafts and checked UI steps alone are not input', SKILL.read_text())
        self.assertIn('never probes providers', CONTRACT.read_text())
        self.assertIn('matching file revision', PREPARATION.read_text())

    @unittest.skipUnless(HAS_TEMPLATE, 'Template workspace entry points are not part of a skill-only installation.')
    def test_readme_and_agent_pointer_reach_the_same_entry_point(self):
        for document in (ROOT / 'README.md', ROOT / 'AGENTS.md'):
            text = document.read_text()
            self.assertIn('/initialize-project', text)
            self.assertIn('.github/skills/initialize-project/SKILL.md', text)
        self.assertIn('./references/contract.md', SKILL.read_text())


if __name__ == '__main__':
    unittest.main()
