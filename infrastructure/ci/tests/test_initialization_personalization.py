"""Mechanical identity contracts use stable test-owned starter fixtures.

Consumer personalization changes application sources, never these fixture inputs.
Real template/build compatibility is verified separately by integration rehearsal.
"""
import base64
import contextlib
import io
import json
from pathlib import Path
import shutil
import stat
import sys
import tempfile
import textwrap
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / "docs/template-initialization/scripts"
sys.path.insert(0, str(SCRIPTS))
import _local as local
import _personalization as personalization


class PersonalizationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.ctx = SimpleNamespace(root=self.root, values={
            "PROJECT_SLUG": "sample-app", "JAVA_PACKAGE": "org.example.sample",
            "DISPLAY_NAME": "Sample App", "PWA_SHORT_NAME": "Sample",
            "COMPOSE_PROJECT_NAME": "sample-app-local", "DATABASE_NAME": "sample_app",
        })
        self.args = SimpleNamespace(open=False)
        self.output = contextlib.redirect_stdout(io.StringIO())
        self.output.__enter__()
        self.addCleanup(self.output.__exit__, None, None, None)
        fixture_path = Path(__file__).with_name("fixtures") / "initialization-personalization.json"
        fixture = json.loads(fixture_path.read_text())
        for relative, text in fixture["files"].items():
            self.write(relative, text)
        for relative, encoded in fixture["binary_files"].items():
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(base64.b64decode(encoded, validate=True))

    def read(self, relative):
        return (self.root / relative).read_text()

    def write(self, relative, value):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value)
        return path

    def snapshot(self):
        return {str(path.relative_to(self.root)): path.read_bytes() for path in self.root.rglob("*") if path.is_file()}

    def apply(self):
        local.edit_backend_identity(self.ctx, self.args)
        local.refactor_java_packages(self.ctx)
        local.edit_frontend_identity(self.ctx, self.args)
        local.edit_title_expectations(self.ctx, self.args)

    def audit(self):
        with patch.object(local, "run") as command:
            local.audit_identity(self.ctx)
        command.assert_called_once_with(["git", "diff", "--check"], cwd=self.root)

    def test_starter_contract_end_to_end_all_fields_and_untouched_contracts(self):
        before = self.snapshot()
        original_lock = json.loads(self.read("frontend/package-lock.json"))
        original_package = json.loads(self.read("frontend/package.json"))
        self.apply()
        self.audit()
        self.assertEqual(self.read("backend/settings.gradle"), "rootProject.name = 'sample-app-backend'\n")
        self.assertIn("group = 'org.example.sample'", self.read("backend/build.gradle"))
        self.assertIn("description = 'Sample App backend'", self.read("backend/build.gradle"))
        self.assertIn("name: sample-app-backend", self.read("backend/src/main/resources/application.yaml"))
        self.assertIn("name: sample-app-local", self.read("backend/compose.yaml"))
        env = self.read("backend/.env.example")
        for line in ("COMPOSE_PROJECT_NAME=sample-app-local", "POSTGRES_DB=sample_app", "POSTGRES_USER=sample_app", "POSTGRES_PASSWORD=\n", "INITIAL_USER_PASSWORD=\n"):
            self.assertIn(line, env)
        self.assertIn('values.COMPOSE_PROJECT_NAME || "sample-app-local"', self.read("backend/scripts/start-local.mjs"))
        launch = json.loads(self.read(".vscode/launch.json"))
        self.assertEqual(launch["configurations"][1]["mainClass"], "org.example.sample.BackendApplication")
        self.assertEqual(launch["configurations"][1]["envFile"], "${workspaceFolder}/backend/.env")
        for source in ("main", "test"):
            target = self.root / f"backend/src/{source}/java/org/example/sample"
            self.assertTrue(target.is_dir())
            self.assertFalse((self.root / f"backend/src/{source}/java/com/vireocode/backend").exists())
            self.assertIn("package org.example.sample", next(target.glob("*.java")).read_text())
        expected_lock = {**original_lock, "name": "sample-app-frontend"}
        expected_lock["packages"][""]["name"] = "sample-app-frontend"
        self.assertEqual(json.loads(self.read("frontend/package-lock.json")), expected_lock)
        self.assertEqual(json.loads(self.read("frontend/package.json")), {**original_package, "name": "sample-app-frontend"})
        self.assertEqual(self.read("frontend/package-lock.json"), before["frontend/package-lock.json"].decode().replace('"name": "rgo-frontend-template"', '"name": "sample-app-frontend"'))
        for locale in ("en", "hr"):
            self.assertIn('shellTitle: "Sample App"', self.read(f"frontend/src/app/localization/translations/translation.{locale}.ts"))
        self.assertIn("<title>Sample App</title>", self.read("frontend/index.html"))
        manifest = json.loads(self.read("frontend/public/manifest.json"))
        self.assertEqual((manifest["name"], manifest["short_name"], manifest["start_url"], manifest["scope"]), ("Sample App", "Sample", "/", "/"))
        self.assertIn("## Project identity", self.read("README.md"))
        self.assertIn("RGO frontend template", self.read("frontend/README.md"))
        self.assertEqual(self.read("frontend/tests/integration/auth/components/AppAuthFlow.test.tsx").count('"Sign in · Sample App"'), 2)
        self.assertEqual(self.read("frontend/tests/browser/application.spec.ts").count('"Home · Sample App"'), 3)
        for relative, content in before.items():
            if relative.startswith(("backend/src/main/resources/db/", "backend/src/test/java/architecturefixtures/", "frontend/mocks/", "frontend/public/brand/")) or relative in ("frontend/src/app/shell/components/AppShell.tsx", "frontend/tests/browser/documentation.development.spec.ts"):
                self.assertEqual((self.root / relative).read_bytes(), content, relative)
        self.assertEqual(self.read("frontend/tests/browser/application.spec.ts"), before["frontend/tests/browser/application.spec.ts"].decode().replace('"Home · RGO application"', '"Home · Sample App"'))
        self.assertEqual(self.read("backend/build.gradle"), before["backend/build.gradle"].decode().replace("group = 'com.vireocode'", "group = 'org.example.sample'").replace("description = 'VireoCode Web App Starter backend'", "description = 'Sample App backend'"))

    def test_repeated_steps_are_byte_identical_noops(self):
        self.apply()
        before = self.snapshot()
        with patch.object(personalization.os, "replace") as replace:
            self.apply()
        replace.assert_not_called()
        self.audit()
        self.assertEqual(self.snapshot(), before)

    def test_package_under_com_vireocode_sibling_is_supported(self):
        self.ctx.values["JAVA_PACKAGE"] = "com.vireocode.sample"
        self.apply()
        self.audit()
        self.assertTrue((self.root / "backend/src/main/java/com/vireocode/sample/BackendApplication.java").exists())

    def test_syntax_specific_escaping_for_display_and_pwa_names(self):
        display = 'O\'Brien "Demo" \\ <A&B> · Ž\u2028\u2029'
        short = '"<Ž&>\\\''
        self.ctx.values.update(DISPLAY_NAME=display, PWA_SHORT_NAME=short)
        self.apply()
        self.audit()
        self.assertIn('description = ' + personalization.groovy(display + " backend"), self.read("backend/build.gradle"))
        self.assertIn("<title>" + personalization.html.escape(display) + "</title>", self.read("frontend/index.html"))
        self.assertEqual(json.loads(self.read("frontend/public/manifest.json"))["name"], display)
        self.assertEqual(json.loads(self.read("frontend/public/manifest.json"))["short_name"], short)
        for locale in ("en", "hr"):
            text = self.read(f"frontend/src/app/localization/translations/translation.{locale}.ts")
            self.assertIn("shellTitle: " + personalization.js(display), text)
            self.assertNotIn("\u2028", text)
            self.assertNotIn("\u2029", text)
        self.assertIn("Display name: " + personalization.markdown(display), self.read("README.md"))
        before = self.snapshot()
        self.apply()
        self.assertEqual(self.snapshot(), before)

    def test_selected_display_may_contain_old_template_title_without_false_audit(self):
        self.ctx.values["DISPLAY_NAME"] = "RGO application"
        self.apply()
        self.audit()

    def test_field_preflight_preserves_every_file_on_foreign_backend_identity(self):
        self.write(".vscode/launch.json", self.read(".vscode/launch.json").replace("com.vireocode.backend.BackendApplication", "org.foreign.app.BackendApplication"))
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "different identity"):
            local.edit_backend_identity(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_gradle_duplicate_variants_are_refused_before_any_write(self):
        cases = (
            ("backend/settings.gradle", "  rootProject.name = 'foreign'\n"),
            ("backend/settings.gradle", "rootProject.name = 'foreign'; rootProject.name = 'foreign'\n"),
            ("backend/build.gradle", "  group = 'org.foreign.app'\n"),
            ("backend/build.gradle", "project.group = 'org.foreign.app'\n"),
            ("backend/build.gradle", "  description = 'Foreign app backend'\n"),
            ("backend/build.gradle", "group = 'org.foreign.app'; description = 'Foreign app backend'\n"),
            ("backend/build.gradle", "setGroup('org.foreign.app')\n"),
        )
        for relative, suffix in cases:
            with self.subTest(relative=relative, suffix=suffix):
                original = self.read(relative)
                self.write(relative, original + suffix)
                before = self.snapshot()
                with self.assertRaisesRegex(local.InitError, "unambiguous"):
                    local.edit_backend_identity(self.ctx, self.args)
                self.assertEqual(self.snapshot(), before)
                self.write(relative, original)

    def test_audit_rejects_later_gradle_identity_overrides(self):
        self.apply()
        self.write("backend/build.gradle", self.read("backend/build.gradle") + "  description = 'Foreign app backend'\n")
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "unambiguous"):
            self.audit()
        self.assertEqual(self.snapshot(), before)

    def test_duplicate_json_key_preflight_preserves_all_frontend_files(self):
        self.write("frontend/public/manifest.json", self.read("frontend/public/manifest.json").replace('"name": "RGO application",', '"name": "RGO application",\n  "name": "RGO application",'))
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "duplicate JSON"):
            local.edit_frontend_identity(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_duplicate_yaml_field_preflight_preserves_all_backend_files(self):
        self.write("backend/src/main/resources/application.yaml", self.read("backend/src/main/resources/application.yaml").replace("    name: vireocode-backend", "    name: vireocode-backend\n    name: vireocode-backend"))
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "one spring.application.name"):
            local.edit_backend_identity(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_symlink_field_is_refused_before_writes_and_target_is_unchanged(self):
        relative = "frontend/public/manifest.json"
        target = self.write("foreign-manifest.json", self.read(relative))
        (self.root / relative).unlink()
        (self.root / relative).symlink_to(target)
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "symbolic link"):
            local.edit_frontend_identity(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_symlink_parent_is_refused_before_writes(self):
        path = self.root / ".vscode"
        path.rename(self.root / "foreign-editor")
        path.symlink_to(self.root / "foreign-editor", target_is_directory=True)
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "symbolic link"):
            local.edit_backend_identity(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_interrupted_field_edits_converge_on_safe_retry(self):
        real_replace = personalization.os.replace
        count = 0
        def interrupt(temporary, target):
            nonlocal count
            count += 1
            if count == 3:
                raise OSError("interruption")
            return real_replace(temporary, target)
        with patch.object(personalization.os, "replace", side_effect=interrupt), self.assertRaises(OSError):
            local.edit_backend_identity(self.ctx, self.args)
        self.assertIn("sample-app-backend", self.read("backend/settings.gradle"))
        self.assertIn("vireocode-backend", self.read("backend/src/main/resources/application.yaml"))
        self.apply()
        self.audit()
        self.assertFalse(list(self.root.rglob(".initialization-*")))

    def test_already_correct_individual_fields_and_modes_are_preserved(self):
        path = self.write("backend/build.gradle", self.read("backend/build.gradle").replace("group = 'com.vireocode'", 'group = "org.example.sample"'))
        path.chmod(0o640)
        local.edit_backend_identity(self.ctx, self.args)
        self.assertIn('group = "org.example.sample"', path.read_text())
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o640)

    def test_concurrent_change_is_detected_without_overwriting_it(self):
        plans = personalization.backend_plan(self.ctx)
        self.write("backend/settings.gradle", "concurrent owner edit\n")
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "changed during planning"):
            personalization.commit(plans)
        self.assertEqual(self.snapshot(), before)

    def test_existing_custom_identity_block_is_refused_without_writes(self):
        self.write("README.md", self.read("README.md") + "\n## Project identity\n\nCustom application\n")
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "unmanaged Project identity"):
            local.edit_frontend_identity(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_foreign_recorded_identity_is_refused_without_writes(self):
        local.edit_frontend_identity(self.ctx, self.args)
        self.write("README.md", self.read("README.md").replace("Slug: sample\\-app", "Slug: other\\-app"))
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "different identity"):
            local.edit_frontend_identity(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_java_refactoring_preserves_literals_comments_and_longer_namespace(self):
        path = "backend/src/main/java/com/vireocode/backend/Reference.java"
        self.write(path, 'package com.vireocode.backend;\nimport com.vireocode.backend.user.AppUser;\nimport com.vireocode.backendextra.Helper;\n// com.vireocode.backend fixture\n/* com.vireocode.backend */\nclass Reference { String value = "com.vireocode.backend"; String block = """\ncom.vireocode.backend\n"""; }\n')
        local.refactor_java_packages(self.ctx)
        actual = self.read("backend/src/main/java/org/example/sample/Reference.java")
        self.assertIn("import org.example.sample.user.AppUser;", actual)
        self.assertIn("import com.vireocode.backendextra.Helper;", actual)
        self.assertIn('String value = "com.vireocode.backend"', actual)
        self.assertIn("// com.vireocode.backend fixture", actual)
        self.assertIn("/* com.vireocode.backend */", actual)
        self.assertIn('"""\ncom.vireocode.backend\n"""', actual)

    def test_java_escaped_text_block_delimiter_preserves_the_entire_literal(self):
        escaped_delimiter = "\\" + '"""'
        literal = '"""\nquoted ' + escaped_delimiter + ' com.vireocode.backend\n"""'
        self.write("backend/src/main/java/com/vireocode/backend/TextFixture.java", "package com.vireocode.backend;\nclass TextFixture { String fixture = " + literal + "; }\n")
        local.refactor_java_packages(self.ctx)
        actual = self.read("backend/src/main/java/org/example/sample/TextFixture.java")
        self.assertIn(literal, actual)
        self.assertIn("package org.example.sample;", actual)

    def test_java_token_spaced_or_comment_separated_reference_refuses_both_moves(self):
        for reference in ("com.vireocode . backend.user.AppUser", "com . vireocode.backend.user.AppUser", "com.vireocode/* fixture boundary */.backend.user.AppUser"):
            with self.subTest(reference=reference):
                path = self.write("backend/src/main/java/com/vireocode/backend/Spaced.java", "package com.vireocode.backend;\nimport " + reference + ";\nclass Spaced {}\n")
                before = self.snapshot()
                with self.assertRaisesRegex(local.InitError, "token-spaced"):
                    local.refactor_java_packages(self.ctx)
                self.assertEqual(self.snapshot(), before)
                path.unlink()

    def test_audit_rejects_token_spaced_stale_java_reference(self):
        self.apply()
        self.write("backend/src/test/java/org/example/sample/Spaced.java", "package org.example.sample;\nimport com.vireocode /* stale */ . backend.user.AppUser;\nclass Spaced {}\n")
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "token-spaced"):
            self.audit()
        self.assertEqual(self.snapshot(), before)

    def test_formatter_wrapped_selected_fields_remain_byte_identical_on_retry(self):
        self.ctx.values["DISPLAY_NAME"] = "An example consumer application with a deliberately long display name for wrapping"
        self.apply()
        display = personalization.js(self.ctx.values["DISPLAY_NAME"])
        for locale in ("en", "hr"):
            relative = f"frontend/src/app/localization/translations/translation.{locale}.ts"
            self.write(relative, self.read(relative).replace("shellTitle: " + display + ",", "shellTitle:\n      " + display + ","))
        for relative, method, prefix in (("frontend/tests/integration/auth/components/AppAuthFlow.test.tsx", "toBe", "Sign in"), ("frontend/tests/browser/application.spec.ts", "toHaveTitle", "Home")):
            value = personalization.js(prefix + " · " + self.ctx.values["DISPLAY_NAME"])
            self.write(relative, self.read(relative).replace(method + "(" + value + ")", method + "(\n        " + value + ",\n      )"))
        relative = "frontend/README.md"
        intro = self.read(relative).split("\n\n")[1]
        self.write(relative, self.read(relative).replace(intro, textwrap.fill(intro.replace("\n", " "), width=64)))
        before = self.snapshot()
        self.apply()
        self.audit()
        self.assertEqual(self.snapshot(), before)

    def test_java_collision_and_foreign_declaration_fail_before_any_move(self):
        for case in ("collision", "foreign"):
            with self.subTest(case=case):
                if case == "collision":
                    path = self.write("backend/src/test/java/org/example/sample/Foreign.java", "foreign")
                else:
                    path = self.write("backend/src/test/java/com/vireocode/backend/Foreign.java", "package org.foreign; class Foreign {}\n")
                before = self.snapshot()
                with self.assertRaises(local.InitError):
                    local.refactor_java_packages(self.ctx)
                self.assertEqual(self.snapshot(), before)
                path.unlink()
                if case == "collision":
                    path.parent.rmdir()

    def test_completed_java_retry_checks_declarations_and_rejects_stale_import(self):
        local.refactor_java_packages(self.ctx)
        self.write("backend/src/test/java/org/example/sample/Foreign.java", "package org.example.sample; import com.vireocode.backend.user.AppUser; class Foreign {}\n")
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "stale Java"):
            local.refactor_java_packages(self.ctx)
        self.assertEqual(self.snapshot(), before)

    def test_java_mixed_main_test_tree_is_refused(self):
        old = self.root / "backend/src/main/java/com/vireocode/backend"
        target = self.root / "backend/src/main/java/org/example/sample"
        target.parent.mkdir(parents=True)
        shutil.move(old, target)
        for path in target.rglob("*.java"):
            path.write_text(path.read_text().replace("com.vireocode.backend", "org.example.sample"))
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "partially moved"):
            local.refactor_java_packages(self.ctx)
        self.assertEqual(self.snapshot(), before)

    def test_audit_is_read_only_and_rejects_unfinished_owned_field(self):
        self.apply()
        self.write("frontend/index.html", self.read("frontend/index.html").replace("<title>Sample App</title>", "<title>RGO application</title>"))
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "step 5.1"):
            self.audit()
        self.assertEqual(self.snapshot(), before)

    def test_audit_does_not_blanket_ignore_runtime_files_with_known_comment(self):
        self.apply()
        relative = "frontend/src/app/theme/themeSetup.ts"
        self.write(relative, self.read(relative) + '\nconst stale = "RGO application";\n')
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "unexpected template identity"):
            self.audit()
        self.assertEqual(self.snapshot(), before)

    def test_audit_rejects_stale_ide_mainclass(self):
        self.apply()
        self.write(".vscode/launch.json", self.read(".vscode/launch.json").replace("org.example.sample.BackendApplication", "com.vireocode.backend.BackendApplication"))
        with self.assertRaisesRegex(local.InitError, "step 4.1"):
            self.audit()

    def test_title_preflight_rejects_foreign_suffix_without_changing_other_test(self):
        relative = "frontend/tests/browser/application.spec.ts"
        self.write(relative, self.read(relative).replace("Home · RGO application", "Home · Foreign App", 1))
        before = self.snapshot()
        with self.assertRaisesRegex(local.InitError, "different identity"):
            local.edit_title_expectations(self.ctx, self.args)
        self.assertEqual(self.snapshot(), before)

    def test_quoted_literals_consume_escaped_backslashes_once(self):
        for value in ("one\\two", "two\\\\slashes", "ends in\\", "apostrophe's", "a\\'b"):
            with self.subTest(value=value):
                self.assertEqual(personalization.quoted(personalization.groovy(value)), value)
        with self.assertRaises(ValueError):
            personalization.quoted("'foreign\\nescape'")

    def test_optional_editor_os_failure_does_not_fail_completed_personalization(self):
        with patch.object(local.shutil, "which", return_value="code"), patch.object(local, "run", side_effect=OSError("editor unavailable")):
            local.edit_backend_identity(self.ctx, SimpleNamespace(open=True))
        self.assertIn("sample-app-backend", self.read("backend/settings.gradle"))

    def test_optional_editor_unavailable_does_not_fail_completed_personalization(self):
        with patch.object(local.shutil, "which", return_value=None), patch.object(local, "run") as command:
            local.edit_backend_identity(self.ctx, SimpleNamespace(open=True))
        command.assert_not_called()
        self.assertIn("sample-app-backend", self.read("backend/settings.gradle"))


if __name__ == "__main__":
    unittest.main()
