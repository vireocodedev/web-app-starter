"""Private implementation for the numbered local-initialization entrypoints.

Only literal configuration is read. No initialization values are shell code.
Public entrypoints load the same verified env and prove consumer identity first.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
from pathlib import Path

from _shared import InitError, load_context, parser, require_consumer, run
import _personalization as personalization


HTTP_VALUES = {
    "VITE_API_BASE_URL": "/api",
    "VITE_API_MODE": "http",
    "VITE_API_WITH_CREDENTIALS": "true",
    "VITE_APP_ENV": "development",
}


def entry(action, description, *, editor=False, browser=False):
    arguments = parser(description)
    if editor:
        arguments.add_argument("--open", action="store_true", help="Open the named existing files with VS Code")
    if browser:
        arguments.add_argument("--install-browser", action="store_true", help="Explicitly install the configured Chrome channel before browser checks")
    args = arguments.parse_args()
    try:
        ctx = load_context(args)
        require_consumer(ctx)
        action(ctx, args)
    except (InitError, OSError, ValueError, KeyError, TypeError) as error:
        # Never dump command environments, response bodies or private file text.
        message = str(error) if isinstance(error, InitError) else "Local initialization operation failed; inspect the named files privately."
        arguments.exit(1, f"Error: {message}\n")


def regular(path):
    if path.is_symlink() or not path.is_file() or any(parent.is_symlink() for parent in path.parents):
        raise InitError(f"Expected an existing regular file: {path.name}; inspect before resuming.")
    return path


def inspect_personalized_files(ctx, args, plans):
    if not getattr(args, "open", False):
        return
    if shutil.which("code") is None:
        print("Identity applied. VS Code command 'code' is unavailable; inspect the diff in your editor.")
        return
    try:
        result = run(["code", *[str(ctx.root / plan.relative) for plan in plans]], cwd=ctx.root, check=False)
    except (OSError, InitError):
        print("Identity applied; the optional editor could not open. Inspect the diff in your editor.")
        return
    if result.returncode:
        print("Identity applied; the optional editor could not open. Inspect the diff in your editor.")


def edit_backend_identity(ctx, args):
    plans = personalization.backend_plan(ctx)
    personalization.commit(plans)
    print("Applied backend identity fields; dependencies, authentication, database data and SQL are preserved.")
    inspect_personalized_files(ctx, args, plans)


def refactor_java_packages(ctx, args=None):
    personalization.refactor_java(ctx)


def edit_frontend_identity(ctx, args):
    plans = personalization.frontend_plan(ctx)
    personalization.commit(plans)
    print("Applied frontend identity and recorded deferred custom branding; retained artwork keeps its accurate RGO accessibility name.")
    inspect_personalized_files(ctx, args, plans)


def edit_title_expectations(ctx, args):
    plans = personalization.titles_plan(ctx)
    personalization.commit(plans)
    print("Updated title expectations; localized page prefixes and mock credentials are preserved.")
    inspect_personalized_files(ctx, args, plans)


def audit_identity(ctx, args=None):
    personalization.audit(ctx)
    run(["git", "diff", "--check"], cwd=ctx.root)
    print("Identity audit and whitespace checks passed; no manual residual-match classification is required.")


def read_literal_env(path):
    """Read conventional local .env fields without interpreting shell syntax."""
    regular(path)
    result = {}
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        match = re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)", stripped)
        if not match or match[1] in result:
            raise InitError("Local env has unsupported or duplicate assignments; inspect it privately.")
        value = match[2]
        if value.startswith(("'", '"')):
            if len(value) < 2 or value[-1] != value[0]:
                raise InitError("Local env contains an incomplete quoted assignment.")
            value = value[1:-1]
        else:
            value = re.split(r"\s+#", value, maxsplit=1)[0].rstrip()
        result[match[1]] = value
    return result


def merge_literal_env(path, replacements):
    text = regular(path).read_text()
    # Read before changing to reject ambiguous duplicate/unsupported syntax.
    read_literal_env(path)
    for key, value in replacements.items():
        if "\n" in value or "\r" in value or "\x00" in value:
            raise InitError("Local env values must fit on one line.")
        # Spring reads backend/.env as .properties while Node reads it as dotenv.
        # Plain validated text (including spaces) works in both; adding dotenv
        # quotes would make those quotes part of Spring's display-name value.
        if re.search(r"[#'\"\\]", value):
            raise InitError("Selected env identity contains incompatible dotenv/properties syntax.")
        rendered = value
        expression = re.compile(rf"^{re.escape(key)}\s*=.*$", re.MULTILINE)
        if expression.search(text):
            text = expression.sub(lambda _: f"{key}={rendered}", text)
        else:
            text = text.rstrip("\n") + f"\n{key}={rendered}\n"
    descriptor, temporary = tempfile.mkstemp(prefix=".initialization-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w") as stream:
            stream.write(text)
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def backend_identity(ctx):
    return {
        "COMPOSE_PROJECT_NAME": ctx.values["COMPOSE_PROJECT_NAME"],
        "POSTGRES_DB": ctx.values["DATABASE_NAME"],
        "POSTGRES_USER": ctx.values["DATABASE_NAME"],
        "INITIAL_USER_USERNAME": ctx.values["INITIAL_USERNAME"],
        "INITIAL_USER_EMAIL": ctx.values["INITIAL_EMAIL"],
        "INITIAL_USER_DISPLAY_NAME": ctx.values["INITIAL_DISPLAY_NAME"],
    }


def checked_backend_env(ctx):
    path = ctx.root / "backend/.env"
    values = read_literal_env(path)
    mismatches = [key for key, expected in backend_identity(ctx).items() if values.get(key) != expected]
    if mismatches:
        raise InitError("Existing backend/.env identity differs for " + ", ".join(mismatches) + "; preserve credentials/volumes and reconcile privately before startup.")
    for key in ("POSTGRES_PASSWORD", "INITIAL_USER_PASSWORD"):
        value = values.get(key, "")
        if len(value) < 12 or len(value.encode("utf-8")) > 72:
            raise InitError(f"{key} must contain at least 12 characters and at most 72 UTF-8 bytes; inspect privately.")
    if not values.get("POSTGRES_PORT", "55436").isdigit() or not 1 <= int(values.get("POSTGRES_PORT", "55436")) <= 65535:
        raise InitError("POSTGRES_PORT must be a valid local port.")
    return values


def prepare_backend_env(ctx, args=None):
    path = ctx.root / "backend/.env"
    existed = path.exists() or path.is_symlink()
    if existed:
        regular(path)
    run(["bash", str(ctx.root / "backend/scripts/with-local-node.sh"), str(ctx.root / "backend/scripts/setup-local.mjs")], cwd=ctx.root)
    if not existed:
        merge_literal_env(path, backend_identity(ctx))
    checked_backend_env(ctx)
    print("Local backend credentials prepared; existing files and passwords are preserved. Read the ignored backend/.env privately for login.")


def prepare_frontend_env(ctx, args=None):
    run(["npm", "--prefix", str(ctx.root / "frontend"), "ci"], cwd=ctx.root, timeout=None)
    # npm ci installs the lockfile-pinned formatter. Invoke that local binary
    # directly; 5.x also works before dependencies are installed.
    for relative in personalization.FRONTEND_FORMAT_TARGETS:
        regular(ctx.root / "frontend" / relative)
    run(["bash", str(ctx.root / "backend/scripts/with-local-node.sh"), str(ctx.root / "frontend/node_modules/prettier/bin/prettier.cjs"), "--write", *personalization.FRONTEND_FORMAT_TARGETS], cwd=ctx.root / "frontend", timeout=None)
    path = ctx.root / "frontend/.env.local"
    if not path.exists() and not path.is_symlink():
        contents = regular(ctx.root / "frontend/.env.example").read_text()
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w") as stream:
            stream.write(contents)
    merge_literal_env(path, HTTP_VALUES)
    print("Formatted the personalized frontend files and merged public HTTP development settings; other frontend values are preserved. Vite configuration is public: keep secrets out.")


def verify_ignored_env(ctx, args=None):
    for relative in ("backend/.env", "frontend/.env.local"):
        regular(ctx.root / relative)
        tracked = run(["git", "ls-files", "--error-unmatch", "--", relative], cwd=ctx.root, capture=True, check=False)
        if tracked.returncode == 0:
            raise InitError(f"{relative} is tracked; remove it from the index without deleting the private file.")
        run(["git", "check-ignore", "--quiet", "--", relative], cwd=ctx.root)
    print("Both checkout-local env files exist, are untracked and ignored.")


def start_backend(ctx, args=None):
    values = checked_backend_env(ctx)
    process_env = {**os.environ, **values}
    run(["bash", str(ctx.root / "backend/scripts/with-local-node.sh"), str(ctx.root / "backend/scripts/start-local.mjs")], cwd=ctx.root, env=process_env, timeout=None)
    run([str(ctx.root / "backend/gradlew"), "--no-daemon", "--console=plain", "bootRun", "--args=--spring.profiles.active=local"], cwd=ctx.root / "backend", env=process_env, timeout=None)


def start_frontend(ctx, args=None):
    values = read_literal_env(ctx.root / "frontend/.env.local")
    if any(values.get(key) != value for key, value in HTTP_VALUES.items()):
        raise InitError("Prepare frontend HTTP settings with 7_2_prepare_frontend_env.py first.")
    run(["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"], cwd=ctx.root / "frontend", env={**os.environ, **HTTP_VALUES}, timeout=None)


def check_local_health(ctx, args=None):
    run(["curl", "--fail", "--silent", "--show-error", "--max-time", "15", "http://127.0.0.1:8080/api/actuator/health"], cwd=ctx.root)
    print("Health alone does not prove login. Manually verify real HTTP login, navigation, reload/session persistence, logout and both locales at http://127.0.0.1:5173.")


def stop_database(ctx, args=None):
    values = checked_backend_env(ctx)
    run(["docker", "compose", "--project-name", ctx.values["COMPOSE_PROJECT_NAME"], "--file", str(ctx.root / "backend/compose.yaml"), "--env-file", str(ctx.root / "backend/.env"), "stop", "postgres"], cwd=ctx.root / "backend", env={**os.environ, **values}, timeout=None)
    print("Stopped this checkout's PostgreSQL; its persistent volume is preserved.")


def check_ide_configuration(ctx, args=None):
    launch = json.loads(regular(ctx.root / ".vscode/launch.json").read_text())
    tasks = json.loads(regular(ctx.root / ".vscode/tasks.json").read_text())
    configs = {item["name"]: item for item in launch["configurations"]}
    labels = {item["label"]: item for item in tasks["tasks"]}
    backend, frontend = configs["Backend: local dev"], configs["Frontend: local dev"]
    checks = [
        backend.get("mainClass") == ctx.values["JAVA_PACKAGE"] + ".BackendApplication",
        backend.get("cwd") == "${workspaceFolder}/backend",
        backend.get("envFile") == "${workspaceFolder}/backend/.env",
        backend.get("args") == "--spring.profiles.active=local",
        backend.get("preLaunchTask") == "Backend: start local PostgreSQL",
        labels["Backend: start local PostgreSQL"].get("dependsOn") == "Backend: prepare local credentials",
        frontend.get("cwd") == "${workspaceFolder}/frontend",
        frontend.get("command") == "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
        all(frontend.get("env", {}).get(key) == value for key, value in HTTP_VALUES.items()),
    ]
    for label, script in (("Backend: prepare local credentials", "setup-local.mjs"), ("Backend: start local PostgreSQL", "start-local.mjs")):
        task = labels[label]
        checks.extend([task.get("type") == "process", task.get("command") == "bash", task.get("args") == ["${workspaceFolder}/backend/scripts/with-local-node.sh", f"${{workspaceFolder}}/backend/scripts/{script}"]])
    if not all(checks):
        raise InitError("VS Code configuration differs from the selected identity or documented launch chain; review .vscode files.")
    regular(ctx.root / ".vscode/extensions.json")
    print("Static launch configuration agrees. Open the trusted root workspace, install recommended extensions and finish Java/Gradle import; manually verify both launchers, login and a backend breakpoint. Stop conflicting terminal processes first.")


def verify_local(ctx, args):
    run([str(ctx.root / "backend/gradlew"), "--no-daemon", "--console=plain", "test", "bootJar"], cwd=ctx.root / "backend", timeout=None)
    run(["npm", "--prefix", str(ctx.root / "frontend"), "run", "verify"], cwd=ctx.root, timeout=None)
    if args.install_browser:
        run(["npx", "playwright", "install", "chrome"], cwd=ctx.root / "frontend", timeout=None)
    run(["npm", "--prefix", str(ctx.root / "frontend"), "run", "test:browser", "--", "tests/browser/application.spec.ts", "--grep", "supports keyboard navigation|offers the account menu", "--reporter=list"], cwd=ctx.root, timeout=None)
    run(["npm", "--prefix", str(ctx.root / "frontend"), "run", "test:browser:development", "--", "tests/browser/documentation.development.spec.ts", "--reporter=list"], cwd=ctx.root, timeout=None)
    print("Local gates completed sequentially. This is not remote CI or business acceptance evidence.")


def review_changes(ctx, args=None):
    for command in (["git", "status", "--short"], ["git", "diff", "--check"], ["git", "diff"]):
        run(command, cwd=ctx.root)
    print("Review privately, then stage only intended paths with git add -p or explicit git add PATH for new/moved files. No files have been staged by this script.")


def publish_changes(ctx, args=None):
    if ctx.scope != "full":
        raise InitError("Publication requires a full-scope verified receipt; local-only setup stops after local verification.")
    branch = run(["git", "branch", "--show-current"], cwd=ctx.root, capture=True).stdout.strip()
    if branch != "initialization/setup":
        raise InitError("Publish only the initialization/setup consumer branch; inspect the current branch.")
    staged = run(["git", "diff", "--cached", "--name-only", "-z"], cwd=ctx.root, capture=True).stdout.split("\0")
    paths = [path for path in staged if path]
    if not paths:
        raise InitError("No reviewed staged changes; this script never stages files.")
    for path in paths:
        item = Path(path)
        allowed = path == "README.md" or path.startswith(("backend/", "frontend/", ".vscode/", "docs/template-initialization/"))
        private = any(part in {"node_modules", ".git", ".template-initialization", "build", "dist", "storybook-static"} for part in item.parts)
        private |= (item.name == ".env" or item.name.startswith(".env.") and item.name != ".env.example" or item.suffix.lower() in {".pem", ".key", ".p12", ".pfx", ".dump", ".sql", ".gz", ".zip"})
        if not allowed or private:
            raise InitError("The staged set contains a private/generated or out-of-initialization path; review and stage intended identity changes only.")
    diff = run(["git", "diff", "--cached", "--no-ext-diff", "--unified=0"], cwd=ctx.root, capture=True).stdout
    additions = "\n".join(line[1:] for line in diff.splitlines() if line.startswith("+") and not line.startswith("+++"))
    if re.search(r"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})|(?:POSTGRES_PASSWORD|INITIAL_USER_PASSWORD|HCLOUD_TOKEN|HETZNER_DNS_TOKEN)[ \t]*=[ \t]*[^\s#]", additions):
        raise InitError("Potential secret material is staged; inspect privately and remove it before publishing.")
    run(["git", "diff", "--cached", "--check"], cwd=ctx.root)
    run(["git", "diff", "--cached", "--stat"], cwd=ctx.root)
    run(["git", "commit", "-m", "Initialize project identity and local setup"], cwd=ctx.root)
    run(["git", "push", "-u", "origin", "initialization/setup"], cwd=ctx.root, timeout=None)
