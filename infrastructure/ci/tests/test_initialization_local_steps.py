"""Consumer-local initialization contracts; no tools, network or databases run."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / "docs/template-initialization/scripts"
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("initialization_local_steps", SCRIPTS / "_local.py")
local = importlib.util.module_from_spec(spec)
spec.loader.exec_module(local)


class LocalInitializationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.ctx = SimpleNamespace(root=self.root, scope="full", values={
            "PROJECT_SLUG": "fixture-project",
            "DISPLAY_NAME": "Fixture Project",
            "PWA_SHORT_NAME": "Fixture",
            "JAVA_PACKAGE": "com.example.fixture",
            "COMPOSE_PROJECT_NAME": "fixture-project-local",
            "DATABASE_NAME": "fixture_project",
            "INITIAL_USERNAME": "fixture-admin",
            "INITIAL_EMAIL": "fixture@vireocode.com",
            "INITIAL_DISPLAY_NAME": "Fixture Administrator",
            "REPOSITORY": "vireocodedev/fixture-project",
        })
        self.output = contextlib.redirect_stdout(io.StringIO())
        self.output.__enter__()
        self.addCleanup(self.output.__exit__, None, None, None)

    def write(self, relative, text):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def java_roots(self):
        self.write("backend/src/main/java/com/vireocode/backend/BackendApplication.java", "package com.vireocode.backend; class BackendApplication {}\n")
        self.write("backend/src/main/java/com/vireocode/backend/auth/Session.java", "package com.vireocode.backend.auth; class Session {}\n")
        self.write("backend/src/test/java/com/vireocode/backend/ApplicationTest.java", "package com.vireocode.backend; import com.vireocode.backend.auth.Session;\n")

    def backend_env(self, **overrides):
        values = {**local.backend_identity(self.ctx), "POSTGRES_PASSWORD": "retained-db-password", "INITIAL_USER_PASSWORD": "retained-user-password", "POSTGRES_PORT": "55480", **overrides}
        return self.write("backend/.env", "# Kept private\n" + "\n".join(f"{key}={value}" for key, value in values.items()) + "\n")

    def test_java_moves_both_roots_and_preserves_relative_packages_and_sql(self):
        self.java_roots()
        sql = self.write("backend/src/main/resources/db/migration/V1__baseline.sql", "-- com.vireocode.backend schema stays byte-identical\n")
        before = sql.read_bytes()
        local.refactor_java_packages(self.ctx)
        self.assertEqual((self.root / "backend/src/main/java/com/example/fixture/auth/Session.java").read_text(), "package com.example.fixture.auth; class Session {}\n")
        self.assertIn("com.example.fixture.auth.Session", (self.root / "backend/src/test/java/com/example/fixture/ApplicationTest.java").read_text())
        self.assertFalse((self.root / "backend/src/main/java/com/vireocode/backend").exists())
        self.assertEqual(sql.read_bytes(), before)

    def test_java_keywords_and_overlapping_roots_fail_before_writing(self):
        self.java_roots()
        before = sorted(path.relative_to(self.root) for path in self.root.rglob("*.java"))
        for namespace in ("com.class.fixture", "com.vireocode.backend.child", "com.vireocode", "com.vireocode.backend", "com.record.app"):
            with self.subTest(namespace=namespace):
                self.ctx.values["JAVA_PACKAGE"] = namespace
                with self.assertRaises(local.InitError):
                    local.refactor_java_packages(self.ctx)
        self.assertEqual(sorted(path.relative_to(self.root) for path in self.root.rglob("*.java")), before)

    def test_java_preflights_both_roots_before_any_move(self):
        self.java_roots()
        self.write("backend/src/test/java/com/vireocode/backend/unexpected.txt", "unrelated")
        with self.assertRaises(local.InitError):
            local.refactor_java_packages(self.ctx)
        self.assertTrue((self.root / "backend/src/main/java/com/vireocode/backend/BackendApplication.java").exists())
        self.assertFalse((self.root / "backend/src/main/java/com/example/fixture").exists())

    def test_java_existing_target_or_symlink_is_preserved(self):
        self.java_roots()
        foreign = self.write("foreign.java", "private outside source")
        (self.root / "backend/src/main/java/com/vireocode/backend/link.java").symlink_to(foreign)
        with self.assertRaises(local.InitError):
            local.refactor_java_packages(self.ctx)
        self.assertEqual(foreign.read_text(), "private outside source")

    def test_backend_existing_env_preserves_all_bytes_and_credentials(self):
        path = self.backend_env()
        before = path.read_bytes()
        with patch.object(local, "run") as command:
            local.prepare_backend_env(self.ctx)
        self.assertEqual(path.read_bytes(), before)
        command.assert_called_once()
        self.assertEqual(command.call_args.args[0][-1], str(self.root / "backend/scripts/setup-local.mjs"))

    def test_backend_mismatched_existing_identity_is_preserved_and_rejected(self):
        path = self.backend_env(COMPOSE_PROJECT_NAME="other-existing-local")
        before = path.read_bytes()
        with patch.object(local, "run"), self.assertRaisesRegex(local.InitError, "preserve credentials/volumes"):
            local.prepare_backend_env(self.ctx)
        self.assertEqual(path.read_bytes(), before)

    def test_backend_new_env_binds_selected_identity_preserving_generated_secrets(self):
        def setup(argv, **kwargs):
            self.backend_env(COMPOSE_PROJECT_NAME="template-local", POSTGRES_DB="template", POSTGRES_USER="template", INITIAL_USER_USERNAME="admin", INITIAL_USER_EMAIL="admin@example.com", INITIAL_USER_DISPLAY_NAME="Local Administrator")
        with patch.object(local, "run", side_effect=setup):
            local.prepare_backend_env(self.ctx)
        path = self.root / "backend/.env"
        values = local.read_literal_env(path)
        self.assertEqual(values["COMPOSE_PROJECT_NAME"], "fixture-project-local")
        self.assertEqual(values["POSTGRES_DB"], "fixture_project")
        self.assertEqual(values["INITIAL_USER_DISPLAY_NAME"], "Fixture Administrator")
        self.assertEqual(values["INITIAL_USER_PASSWORD"], "retained-user-password")
        self.assertEqual(values["POSTGRES_PASSWORD"], "retained-db-password")
        self.assertIn("INITIAL_USER_DISPLAY_NAME=Fixture Administrator\n", path.read_text())
        self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_env_duplicate_assignments_and_symlinks_fail_without_changing_target(self):
        duplicate = self.write("frontend/.env.local", "VITE_API_MODE=http\nVITE_API_MODE=mock\n")
        before = duplicate.read_bytes()
        with self.assertRaises(local.InitError):
            local.merge_literal_env(duplicate, local.HTTP_VALUES)
        self.assertEqual(duplicate.read_bytes(), before)
        duplicate.unlink()
        target = self.write("outside.env", "VITE_API_MODE=mock\n")
        duplicate.symlink_to(target)
        with self.assertRaises(local.InitError):
            local.merge_literal_env(duplicate, local.HTTP_VALUES)
        self.assertEqual(target.read_text(), "VITE_API_MODE=mock\n")

    def test_frontend_merges_http_settings_preserving_other_values(self):
        for relative in local.personalization.FRONTEND_FORMAT_TARGETS:
            self.write("frontend/" + relative, "retained frontend source\n")
        path = self.write("frontend/.env.local", "# Keep optional settings\nVITE_API_MODE=mock\nVITE_SETTINGS_NOCFG_THEME=dark\nVITE_REQUEST_TIMEOUT_MS=12345\n")
        with patch.object(local, "run") as command:
            local.prepare_frontend_env(self.ctx)
        self.assertEqual(command.call_count, 2)
        self.assertEqual(command.call_args_list[0].args[0], ["npm", "--prefix", str(self.root / "frontend"), "ci"])
        self.assertEqual(command.call_args_list[1].args[0], ["bash", str(self.root / "backend/scripts/with-local-node.sh"), str(self.root / "frontend/node_modules/prettier/bin/prettier.cjs"), "--write", *local.personalization.FRONTEND_FORMAT_TARGETS])
        self.assertEqual(command.call_args_list[1].kwargs["cwd"], self.root / "frontend")
        values = local.read_literal_env(path)
        self.assertEqual(values["VITE_SETTINGS_NOCFG_THEME"], "dark")
        self.assertEqual(values["VITE_REQUEST_TIMEOUT_MS"], "12345")
        self.assertEqual({key: values[key] for key in local.HTTP_VALUES}, local.HTTP_VALUES)
        self.assertIn("# Keep optional settings", path.read_text())

    def test_backend_launch_binds_private_env_and_uses_local_profile(self):
        self.backend_env()
        with patch.object(local, "run") as command:
            local.start_backend(self.ctx)
        self.assertEqual(command.call_count, 2)
        startup, java = command.call_args_list
        self.assertEqual(startup.args[0][-1], str(self.root / "backend/scripts/start-local.mjs"))
        self.assertEqual(java.args[0][-1], "--args=--spring.profiles.active=local")
        self.assertEqual(java.kwargs["env"]["COMPOSE_PROJECT_NAME"], "fixture-project-local")
        self.assertEqual(java.kwargs["env"]["POSTGRES_PORT"], "55480")
        self.assertIsNone(java.kwargs["timeout"])

    def test_frontend_requires_http_and_uses_strict_same_origin(self):
        path = self.write("frontend/.env.local", "VITE_API_MODE=mock\n")
        with patch.object(local, "run") as command, self.assertRaises(local.InitError):
            local.start_frontend(self.ctx)
        command.assert_not_called()
        local.merge_literal_env(path, local.HTTP_VALUES)
        with patch.object(local, "run") as command:
            local.start_frontend(self.ctx)
        self.assertEqual(command.call_args.args[0], ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"])
        self.assertEqual(command.call_args.kwargs["env"]["VITE_API_MODE"], "http")

    def test_stop_database_selects_consumer_and_never_removes_volumes(self):
        self.backend_env()
        with patch.object(local, "run") as command:
            local.stop_database(self.ctx)
        argv = command.call_args.args[0]
        self.assertEqual(argv[argv.index("--project-name") + 1], "fixture-project-local")
        self.assertEqual(argv[-2:], ["stop", "postgres"])
        self.assertNotIn("down", argv)
        self.assertNotIn("--volumes", argv)

    def test_verify_runs_sequential_commands_and_chrome_install_is_explicit(self):
        for install, count in ((False, 4), (True, 5)):
            with self.subTest(install=install), patch.object(local, "run") as command:
                local.verify_local(self.ctx, SimpleNamespace(install_browser=install))
                argv = [call.args[0] for call in command.call_args_list]
                self.assertEqual(len(argv), count)
                self.assertEqual(argv[0][-2:], ["test", "bootJar"])
                self.assertEqual(argv[1][-2:], ["run", "verify"])
                self.assertEqual(["npx", "playwright", "install", "chrome"] in argv, install)
                self.assertIn("test:browser:development", argv[-1])

    def test_ide_checks_identity_and_preserves_configs_without_claiming_debugger_acceptance(self):
        for name in ("launch.json", "tasks.json", "extensions.json"):
            contents = (ROOT / ".vscode" / name).read_text()
            if name == "launch.json":
                launch = json.loads(contents)
                backend = next(config for config in launch["configurations"] if config["name"] == "Backend: local dev")
                backend["mainClass"] = self.ctx.values["JAVA_PACKAGE"] + ".BackendApplication"
                contents = json.dumps(launch)
            self.write(".vscode/" + name, contents)
        before = {path.name: path.read_bytes() for path in (self.root / ".vscode").glob("*.json")}
        with patch.object(local, "run") as command:
            local.check_ide_configuration(self.ctx)
        command.assert_not_called()
        self.assertEqual({path.name: path.read_bytes() for path in (self.root / ".vscode").glob("*.json")}, before)
        self.ctx.values["JAVA_PACKAGE"] = "com.other.project"
        with self.assertRaises(local.InitError):
            local.check_ide_configuration(self.ctx)

    def test_entry_refuses_canonical_mutation_before_action(self):
        action = unittest.mock.Mock()
        fake_parser = unittest.mock.Mock()
        fake_parser.parse_args.return_value = SimpleNamespace()
        with patch.object(local, "parser", return_value=fake_parser), patch.object(local, "load_context", return_value=self.ctx), patch.object(local, "require_consumer", side_effect=local.InitError("Canonical template initialization is forbidden.")):
            local.entry(action, "test")
        action.assert_not_called()
        fake_parser.exit.assert_called_once()

    def test_publish_rejects_private_or_unrelated_staged_paths_before_commit(self):
        for path in ("backend/.env", "frontend/.env.local", "backend/secret.pem", "backend/backup.dump", ".github/workflows/ci.yaml", ".template-initialization/values.env"):
            with self.subTest(path=path):
                calls = []
                def command(argv, **kwargs):
                    calls.append(argv)
                    output = "initialization/setup\n" if argv[1] == "branch" else path + "\0"
                    return subprocess.CompletedProcess(argv, 0, output, "")
                with patch.object(local, "run", side_effect=command), self.assertRaises(local.InitError):
                    local.publish_changes(self.ctx)
                self.assertFalse(any("commit" in argv or "push" in argv or "add" in argv for argv in calls))

    def test_publish_cannot_expand_a_local_only_verified_scope(self):
        self.ctx.scope = "local"
        with patch.object(local, "run") as command, self.assertRaisesRegex(local.InitError, "full-scope"):
            local.publish_changes(self.ctx)
        command.assert_not_called()

    def test_publish_rejects_staged_secret_without_printing_it(self):
        calls = []
        def command(argv, **kwargs):
            calls.append(argv)
            output = "initialization/setup\n" if argv[1] == "branch" else "README.md\0" if "--name-only" in argv else "+-----BEGIN PRIVATE KEY-----\n"
            return subprocess.CompletedProcess(argv, 0, output, "")
        with patch.object(local, "run", side_effect=command), self.assertRaises(local.InitError):
            local.publish_changes(self.ctx)
        self.assertFalse(any("commit" in argv or "push" in argv for argv in calls))

    def test_publish_uses_only_reviewed_index_and_exact_consumer_branch(self):
        calls = []
        def command(argv, **kwargs):
            calls.append(argv)
            output = "initialization/setup\n" if argv[1] == "branch" else "README.md\0frontend/package.json\0" if "--name-only" in argv else "+POSTGRES_PASSWORD=\n+POSTGRES_PORT=55436\n"
            return subprocess.CompletedProcess(argv, 0, output, "")
        with patch.object(local, "run", side_effect=command):
            local.publish_changes(self.ctx)
        self.assertFalse(any("add" in argv for argv in calls))
        self.assertEqual(calls[-2], ["git", "commit", "-m", "Initialize project identity and local setup"])
        self.assertEqual(calls[-1], ["git", "push", "-u", "origin", "initialization/setup"])


if __name__ == "__main__":
    unittest.main()
