"""Private, bounded consumer identity transforms; application logic is never generated.

Every step validates its complete plan before replacing any file. Only the exact
starter value or selected identity is admitted; customized fields need inspection.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import html
import json
import os
from pathlib import Path
import re
import stat
import tempfile

from _shared import InitError


OLD_PACKAGE = "com.vireocode.backend"
REFERENCE_ROOT = "backend/src/test/java/referencefixtures"
REFERENCE_IMPORTS = frozenset((
    "crud.BaseEntity", "crud.SoftDeletableEntity", "crud.BaseService",
    "crud.DeleteMode", "crud.ResourceNotFoundException",
    "crud.VersionConflictException", "crud.ResourceInUseException",
    "http.PageResponse",
))
JAVA_KEYWORDS = set("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null _ record sealed permits var yield".split())
IDENTITY = re.compile(r"com\.vireocode\.backend|rgo-frontend-template|vireocode-backend|vireocode-web-app-starter-local|RGO application|RGO aplikacija")
STRING = r'"(?:\\.|[^"\\])*"'
SINGLE = r"'(?:\\.|[^'\\])*'"
JAVA_LITERAL = re.compile(r'//[^\n]*|/\*.*?\*/|"""(?:\\.|(?!""").)*"""|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'', re.DOTALL)
IDENTITY_BEGIN = "<!-- BEGIN INITIALIZATION PROJECT IDENTITY -->"
IDENTITY_END = "<!-- END INITIALIZATION PROJECT IDENTITY -->"
FRONTEND_FORMAT_TARGETS = (
    "package.json", "package-lock.json", "index.html", "public/manifest.json",
    "src/app/localization/translations/translation.en.ts",
    "src/app/localization/translations/translation.hr.ts", "README.md",
    "tests/integration/auth/components/AppAuthFlow.test.tsx",
    "tests/browser/application.spec.ts",
)


def safe_path(root, relative, *, directory=False):
    root = Path(root)
    path = root / relative
    if path == root or not path.is_relative_to(root) or ".." in Path(relative).parts:
        raise InitError("Identity paths must stay within the consumer checkout.")
    for parent in (path, *path.parents):
        if parent.is_symlink():
            raise InitError(f"Identity path traverses a symbolic link: {relative}; preserve it and inspect.")
        if parent == root:
            break
    if directory:
        if not path.is_dir():
            raise InitError(f"Expected Java source directory: {relative}.")
    elif not path.is_file():
        raise InitError(f"Expected an existing identity file: {relative}.")
    return path


def js(value):
    return json.dumps(value, ensure_ascii=False).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def groovy(value):
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def markdown(value):
    return re.sub(r"([\\`*_{}\[\]()#+.!|>-])", r"\\\1", html.escape(value, quote=False))


def quoted(value):
    if value.startswith('"'):
        return json.loads(value)
    # Groovy/TypeScript single-quoted fields only admit ordinary escaped quotes
    # and backslashes. Reject other escapes rather than reinterpret customization.
    inner = value[1:-1]
    if not re.fullmatch(r"(?:[^\\]|\\[\\'])*", inner):
        raise ValueError("Unsupported string escape")
    return re.sub(r"\\([\\'])", r"\1", inner)


@dataclass
class FileEdit:
    root: Path
    relative: str
    before: bytes = field(init=False)
    text: str = field(init=False)
    mode: int = field(init=False)
    changes: list = field(default_factory=list)

    def __post_init__(self):
        path = safe_path(self.root, self.relative)
        self.before = path.read_bytes()
        self.text = self.before.decode("utf-8")
        self.mode = stat.S_IMODE(path.stat().st_mode)

    def set(self, start, end, old, expected, rendered, label, *, decode=lambda value: value):
        try:
            actual = decode(self.text[start:end])
        except (ValueError, TypeError, json.JSONDecodeError):
            raise InitError(f"{self.relative}: unsupported {label}; preserve it and inspect.") from None
        if actual not in (old, expected):
            raise InitError(f"{self.relative}: {label} has a different identity; preserve it and inspect.")
        # Keep already-correct syntax/formatting byte-for-byte.
        target = self.text[start:end] if actual == expected else rendered
        self.changes.append((start, end, target, label))

    def match(self, pattern, old, expected, rendered, label, *, decode=lambda value: value, count=1):
        matches = list(re.finditer(pattern, self.text, re.MULTILINE))
        if len(matches) != count:
            raise InitError(f"{self.relative}: expected {count} unambiguous {label} field(s); preserve it and inspect.")
        for match in matches:
            self.set(*match.span("value"), old, expected, rendered, label, decode=decode)

    def rendered(self, *, mask=False):
        text = self.text
        previous = len(text) + 1
        for start, end, replacement, _ in sorted(self.changes, reverse=True):
            if end > previous:
                raise InitError(f"{self.relative}: overlapping identity fields; inspect before resuming.")
            text = text[:start] + ("<selected identity>" if mask else replacement) + text[end:]
            previous = start
        return text


def commit(plans):
    # Check every source immediately before the first write, and again before
    # each replacement. A partial interruption can be safely rerun field-by-field.
    for plan in plans:
        if safe_path(plan.root, plan.relative).read_bytes() != plan.before:
            raise InitError(f"{plan.relative} changed during planning; rerun after inspecting concurrent edits.")
        plan.rendered()
    for plan in plans:
        after = plan.rendered().encode("utf-8")
        if after == plan.before:
            continue
        path = safe_path(plan.root, plan.relative)
        descriptor, temporary = tempfile.mkstemp(prefix=".initialization-", dir=path.parent)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(after)
                stream.flush()
                os.fsync(stream.fileno())
            os.chmod(temporary, plan.mode)
            if safe_path(plan.root, plan.relative).read_bytes() != plan.before:
                raise InitError(f"{plan.relative} changed before replacement; preserve it and retry after inspection.")
            os.replace(temporary, path)
        finally:
            Path(temporary).unlink(missing_ok=True)


def json_fields(plan):
    """Locate JSON value spans while rejecting duplicate keys at every depth."""
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise InitError(f"{plan.relative}: duplicate JSON field; preserve it and inspect.")
            result[key] = value
        return result
    try:
        json.loads(plan.text, object_pairs_hook=pairs)
    except ValueError:
        raise InitError(f"{plan.relative}: invalid JSON; preserve it and inspect.") from None
    decoder, found = json.JSONDecoder(), {}
    text = plan.text
    def space(index):
        while index < len(text) and text[index].isspace():
            index += 1
        return index
    def visit(index, path):
        index = space(index)
        begin = index
        if text[index] == "{":
            index = space(index + 1)
            while text[index] != "}":
                key, index = decoder.raw_decode(text, index)
                index = visit(space(index) + 1, (*path, key))
                index = space(index)
                if text[index] == ",":
                    index = space(index + 1)
                else:
                    break
            index += 1
        elif text[index] == "[":
            index, number = space(index + 1), 0
            while text[index] != "]":
                index = space(visit(index, (*path, number)))
                number += 1
                if text[index] == ",":
                    index = space(index + 1)
                else:
                    break
            index += 1
        else:
            _, index = decoder.raw_decode(text, index)
        found[path] = (begin, index)
        return index
    visit(0, ())
    return found


def json_value(plan, paths, key, old, expected, label):
    if key not in paths:
        raise InitError(f"{plan.relative}: missing {label}; preserve it and inspect.")
    plan.set(*paths[key], old, expected, js(expected), label, decode=json.loads)


def gradle_identity(plan, key, old, value):
    # Groovy allows indentation, same-line statements and project-qualified
    # assignments. Count them in code (not comments/strings) before editing the
    # single installed field, so a later assignment cannot override the result.
    code = JAVA_LITERAL.sub(lambda match: " " * len(match[0]), plan.text)
    if key == "rootProject.name":
        field_name = r"(?:rootProject|project)\s*\.\s*name"
        setter = r"(?:rootProject|project)\s*\.\s*setName\s*\("
    else:
        field_name = r"(?:(?:rootProject|project)\s*\.\s*)?" + re.escape(key)
        setter = r"(?:(?:rootProject|project)\s*\.\s*)?set" + key[0].upper() + key[1:] + r"\s*\("
    assignments = re.findall(r"(?<![\w$.])" + field_name + r"\s*=(?!=)", code)
    setters = re.findall(r"(?<![\w$.])" + setter, code)
    if len(assignments) != 1 or setters:
        raise InitError(f"{plan.relative}: expected one unambiguous {key} assignment; preserve it and inspect.")
    plan.match(r"^" + re.escape(key) + r"\s*=\s*(?P<value>" + SINGLE + r"|" + STRING + r")\s*$", old, value, groovy(value), key, decode=quoted)


def backend_plan(ctx):
    v, plans = ctx.values, []
    def file(relative):
        plan = FileEdit(ctx.root, relative)
        plans.append(plan)
        return plan
    p = file("backend/settings.gradle")
    gradle_identity(p, "rootProject.name", "backend", v["PROJECT_SLUG"] + "-backend")
    p = file("backend/build.gradle")
    for key, old, value in (("group", "com.vireocode", v["JAVA_PACKAGE"]), ("description", "VireoCode Web App Starter backend", v["DISPLAY_NAME"] + " backend")):
        gradle_identity(p, key, old, value)
    p = file("backend/src/main/resources/application.yaml")
    # The installed YAML is a single document with two-space nested mappings.
    # Limit the name edit to its actual spring.application owner.
    if len(re.findall(r"^[\"\']?spring[\"\']?\s*:", p.text, re.MULTILINE)) != 1:
        raise InitError(f"{p.relative}: expected one spring mapping; inspect before resuming.")
    spring = re.search(r"^spring:\s*\n(?P<body>(?:[ \t].*\n|\n)*)", p.text, re.MULTILINE)
    if not spring or len(re.findall(r"^  [\"\']?application[\"\']?\s*:", spring["body"], re.MULTILINE)) != 1:
        raise InitError(f"{p.relative}: expected one spring.application mapping; inspect before resuming.")
    application = re.search(r"^  application:\s*\n(?P<body>(?: {4}.*\n|\n)*)", spring["body"], re.MULTILINE)
    names = list(re.finditer(r"^    name: (?P<value>[^\r\n]+)$", application["body"] if application else "", re.MULTILINE))
    if len(names) != 1 or len(re.findall(r"^    [\"\']?name[\"\']?\s*:", application["body"] if application else "", re.MULTILINE)) != 1:
        raise InitError(f"{p.relative}: expected one spring.application.name; inspect before resuming.")
    start = spring.start("body") + application.start("body")
    p.set(start + names[0].start("value"), start + names[0].end("value"), "vireocode-backend", v["PROJECT_SLUG"] + "-backend", v["PROJECT_SLUG"] + "-backend", "spring.application.name")
    p = file("backend/compose.yaml")
    if len(re.findall(r"^[\"\']?name[\"\']?\s*:", p.text, re.MULTILINE)) != 1:
        raise InitError(f"{p.relative}: expected one top-level Compose name.")
    p.match(r"^name: (?P<value>[^\r\n]+)$", "vireocode-web-app-starter-local", v["COMPOSE_PROJECT_NAME"], v["COMPOSE_PROJECT_NAME"], "Compose name")
    p = file("backend/.env.example")
    for key, old, value in (("COMPOSE_PROJECT_NAME", "vireocode-web-app-starter-local", v["COMPOSE_PROJECT_NAME"]), ("POSTGRES_DB", "vireocode", v["DATABASE_NAME"]), ("POSTGRES_USER", "vireocode", v["DATABASE_NAME"])):
        if len(re.findall(r"^[ \t]*" + key + r"[ \t]*=", p.text, re.MULTILINE)) != 1:
            raise InitError(f"{p.relative}: expected one {key} assignment.")
        p.match(r"^" + key + r"=(?P<value>[^\r\n]*)$", old, value, value, key)
    for key in ("POSTGRES_PASSWORD", "INITIAL_USER_PASSWORD"):
        if len(re.findall(r"^" + key + r"=$", p.text, re.MULTILINE)) != 1 or len(re.findall(r"^[ \t]*" + key + r"[ \t]*=", p.text, re.MULTILINE)) != 1:
            raise InitError(f"{p.relative}: keep {key} empty; inspect privately before resuming.")
    p = file("backend/scripts/start-local.mjs")
    p.match(r"values\.COMPOSE_PROJECT_NAME\s*\|\|\s*(?P<value>" + STRING + r")", "vireocode-web-app-starter-local", v["COMPOSE_PROJECT_NAME"], js(v["COMPOSE_PROJECT_NAME"]), "Compose fallback", decode=json.loads)
    p = file(".vscode/launch.json")
    paths = json_fields(p)
    config = json.loads(p.text).get("configurations", [])
    indices = [index for index, value in enumerate(config) if value.get("name") == "Backend: local dev"]
    if len(indices) != 1:
        raise InitError(f"{p.relative}: expected one Backend: local dev configuration.")
    json_value(p, paths, ("configurations", indices[0], "mainClass"), OLD_PACKAGE + ".BackendApplication", v["JAVA_PACKAGE"] + ".BackendApplication", "backend mainClass")
    return plans


def identity_block(values):
    return "\n".join((IDENTITY_BEGIN, "## Project identity", "", *[f"- {label}: {markdown(values[key])}" for label, key in (("Slug", "PROJECT_SLUG"), ("Display name", "DISPLAY_NAME"), ("Java namespace", "JAVA_PACKAGE"), ("PWA short name", "PWA_SHORT_NAME"))], "- Branding: supplied RGO artwork is retained with accurate accessibility names and attribution; custom branding is deferred pending visual review.", IDENTITY_END))


def frontend_plan(ctx):
    v, plans = ctx.values, []
    def file(relative):
        plan = FileEdit(ctx.root, relative)
        plans.append(plan)
        return plan
    for relative in ("frontend/package.json", "frontend/package-lock.json"):
        p = file(relative)
        paths = json_fields(p)
        keys = [("name",)] + ([("packages", "", "name")] if relative.endswith("package-lock.json") else [])
        for key in keys:
            json_value(p, paths, key, "rgo-frontend-template", v["PROJECT_SLUG"] + "-frontend", ".".join(key))
    p = file("frontend/index.html")
    p.match(r"<title>(?P<value>[^<]*)</title>", "RGO application", v["DISPLAY_NAME"], html.escape(v["DISPLAY_NAME"]), "HTML title", decode=html.unescape)
    p = file("frontend/public/manifest.json")
    paths = json_fields(p)
    for key, old, value in (("name", "RGO application", v["DISPLAY_NAME"]), ("short_name", "RGO", v["PWA_SHORT_NAME"])):
        json_value(p, paths, (key,), old, value, key)
    for locale, old in (("en", "RGO application"), ("hr", "RGO aplikacija")):
        p = file(f"frontend/src/app/localization/translations/translation.{locale}.ts")
        if len(re.findall(r"^  navigation: \{$", p.text, re.MULTILINE)) != 1:
            raise InitError(f"{p.relative}: expected one navigation owner.")
        navigation = re.search(r"^  navigation: \{\n(?P<body>.*?)^  \},", p.text, re.MULTILINE | re.DOTALL)
        matches = list(re.finditer(r"^    shellTitle:\s*(?P<value>" + STRING + r"|" + SINGLE + r")\s*,$", navigation["body"] if navigation else "", re.MULTILINE))
        if len(matches) != 1 or len(re.findall(r"\bshellTitle\s*:", p.text)) != 1:
            raise InitError(f"{p.relative}: expected one navigation.shellTitle.")
        start = navigation.start("body")
        p.set(start + matches[0].start("value"), start + matches[0].end("value"), old, v["DISPLAY_NAME"], js(v["DISPLAY_NAME"]), "navigation.shellTitle", decode=quoted)
    p = file("README.md")
    title = markdown(v["DISPLAY_NAME"])
    p.match(r"\A# (?P<value>[^\n]+)\n", "VireoCode Web App Starter", title, title, "consumer heading")
    old_intro = "A single-repository starter with a Java Spring Boot backend and a Vite React\nTypeScript frontend. Manual paired GHCR/Hetzner release workflows require the\nexplicit operator setup below; copying this template does not deploy an app."
    intro = f"{title} is a fullstack application with a Java Spring Boot backend and a Vite React\nTypeScript frontend, initialized from VireoCode Web App Starter. Manual paired\nGHCR/Hetzner release workflows require the explicit operator setup below."
    p.match(r"\A#[^\n]+\n\n(?P<value>[\s\S]*?)(?=\n\n)", old_intro, intro, intro, "consumer introduction")
    block = identity_block(v)
    if IDENTITY_BEGIN in p.text or IDENTITY_END in p.text:
        p.match(re.escape(IDENTITY_BEGIN) + r"(?P<value>[\s\S]*?)" + re.escape(IDENTITY_END), block[len(IDENTITY_BEGIN):-len(IDENTITY_END)], block[len(IDENTITY_BEGIN):-len(IDENTITY_END)], block[len(IDENTITY_BEGIN):-len(IDENTITY_END)], "recorded Project identity", count=1)
        if p.text.count(IDENTITY_BEGIN) != 1 or p.text.count(IDENTITY_END) != 1 or len(re.findall(r"^## Project identity\s*$", p.text, re.MULTILINE)) != 1:
            raise InitError("README.md: ambiguous Project identity; preserve it and inspect.")
    else:
        if re.search(r"^#+\s+Project identity\s*$", p.text, re.MULTILINE):
            raise InitError("README.md: existing unmanaged Project identity; preserve it and inspect.")
        intro_match = re.search(r"\A#[^\n]+\n\n.*?(?=\n\n)", p.text, re.DOTALL)
        p.changes.append((intro_match.end(), intro_match.end(), "\n\n" + block, "Project identity record"))
    p = file("frontend/README.md")
    p.match(r"\A# (?P<value>[^\n]+)\n", "RGO frontend application", title + " frontend", title + " frontend", "consumer frontend heading")
    old_intro = "This application was created from the RGO frontend template. It uses Node 24\nand npm 12.0.2; run `npm ci` before development."
    intro = f"{title} was created from the RGO frontend template. It uses Node 24\nand npm 12.0.2; run `npm ci` before development."
    normalize = lambda value: re.sub(r"\s+", " ", value).strip()
    p.match(r"\A#[^\n]+\n\n(?P<value>[\s\S]*?)(?=\n\n)", normalize(old_intro), normalize(intro), intro, "frontend introduction", decode=normalize)
    return plans


def titles_plan(ctx):
    plans = []
    for relative, prefix, count, expression in (("frontend/tests/integration/auth/components/AppAuthFlow.test.tsx", "Sign in", 2, r"expect\(document\.title\)\.toBe\("), ("frontend/tests/browser/application.spec.ts", "Home", 3, r"expect\(page\)\.toHaveTitle\(")):
        p = FileEdit(ctx.root, relative)
        value = prefix + " · " + ctx.values["DISPLAY_NAME"]
        p.match(expression + r"\s*(?P<value>" + STRING + r"|" + SINGLE + r")\s*,?\s*\)", prefix + " · RGO application", value, js(value), "title assertion", decode=quoted, count=count)
        plans.append(p)
    p = FileEdit(ctx.root, "frontend/tests/browser/documentation.development.spec.ts")
    if re.search(r"toHaveTitle\s*\(|document\.title", p.text):
        raise InitError(f"{p.relative}: unexpected title assertions; preserve it and inspect.")
    plans.append(p)
    return plans


def java_code(text):
    return JAVA_LITERAL.sub(lambda match: "\n" if match[0].startswith("//") else " " * len(match[0]), text)


def namespace(values):
    new = values["JAVA_PACKAGE"]
    if not re.fullmatch(r"[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+", new) or any(part in JAVA_KEYWORDS for part in new.split(".")):
        raise InitError("Use dotted lowercase Java identifiers without keywords.")
    if new == OLD_PACKAGE or new.startswith(OLD_PACKAGE + ".") or OLD_PACKAGE.startswith(new + "."):
        raise InitError("Use a distinct non-overlapping Java package root.")
    return new


def java_plan(ctx, *, completed=False):
    new = namespace(ctx.values)
    trees, plans, states = [], [], []
    expression = re.compile(r"(?<![\w$.])" + re.escape(OLD_PACKAGE) + r"(?=\.|[^\w$]|$)")
    spaced_expression = re.compile(r"(?<![\w$.])com\s*\.\s*vireocode\s*\.\s*backend(?=\s*\.|[^\w$]|$)")
    for source_name in ("main", "test"):
        source = safe_path(ctx.root, f"backend/src/{source_name}/java", directory=True)
        origin, target = source / OLD_PACKAGE.replace(".", "/"), source / new.replace(".", "/")
        for candidate in (origin, target):
            for parent in (candidate, *candidate.parents):
                if parent.is_symlink():
                    raise InitError("Java package paths must not traverse symbolic links.")
                if parent == ctx.root:
                    break
        old_exists, new_exists = origin.exists(), target.exists()
        if old_exists == new_exists or (completed and old_exists):
            raise InitError(f"Java {source_name} package roots are incomplete, colliding or still template-owned; inspect step 4.2.")
        current, base = (origin, OLD_PACKAGE) if old_exists else (target, new)
        if not current.is_dir():
            raise InitError("Java package root must be an existing directory.")
        states.append(old_exists)
        files = list(current.rglob("*"))
        if not any(path.is_file() for path in files):
            raise InitError("Java package root must contain source files.")
        for path in files:
            if path.is_symlink() or (not path.is_dir() and (not path.is_file() or path.suffix != ".java")):
                raise InitError("Unexpected Java package content; preserve it and inspect step 4.2.")
            if not path.is_file():
                continue
            relative = path.relative_to(current)
            plan = FileEdit(ctx.root, str(path.relative_to(ctx.root)))
            code = java_code(plan.text)
            if any(match[0] != OLD_PACKAGE for match in spaced_expression.finditer(code)):
                raise InitError(f"{plan.relative}: token-spaced template package reference; preserve both roots and inspect step 4.2.")
            declarations = re.findall(r"\bpackage\s+([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*;", code)
            expected = base + ("." + ".".join(relative.parent.parts) if relative.parent.parts else "")
            if declarations != [expected]:
                raise InitError(f"{plan.relative}: Java declaration differs from its owning path; inspect step 4.2.")
            if old_exists:
                # Only code spans are rewritten: comments, strings, text blocks
                # and neutral architecture fixture trees stay byte-identical.
                masked = JAVA_LITERAL.sub(lambda match: " " * len(match[0]), plan.text)
                for match in expression.finditer(masked):
                    plan.changes.append((*match.span(), new, "Java package reference"))
            elif expression.search(code):
                raise InitError(f"{plan.relative}: stale Java import/reference; inspect step 4.2.")
            plans.append((plan, target / relative))
        trees.append((origin, target))
    if len(set(states)) != 1:
        raise InitError("Java main/test roots are partially moved; preserve them and inspect step 4.2.")
    return plans, trees, states[0]


def reference_java_plan(ctx, *, completed=False):
    """Keep the reference package neutral; personalize only its published imports."""
    new = namespace(ctx.values)
    source = safe_path(ctx.root, "backend/src/test/java", directory=True)
    candidate = source / "referencefixtures"
    # Older consumer snapshots and minimal source fixtures have no reference
    # capability. Never invent it, but refuse a dangling symlink as well.
    if not candidate.exists() and not candidate.is_symlink():
        return []
    root = safe_path(ctx.root, REFERENCE_ROOT, directory=True)
    plans = []
    files = sorted(root.rglob("*"))
    if not any(path.is_file() for path in files):
        raise InitError("Reference Java root must contain source files; inspect step 4.2.")
    prefixes = (OLD_PACKAGE, new)
    owned = re.compile(r"(?<![\w$.])(?:" + "|".join(re.escape(prefix) for prefix in prefixes) + r")(?=\.|[^\w$]|$)")
    # Count package tokens in masked code, but retain offsets into the original
    # source. Whitespace/comments between tokens are refused rather than erased.
    spaced = re.compile(r"(?<![\w$.])(?:" + "|".join(r"\s*\.\s*".join(map(re.escape, prefix.split("."))) for prefix in prefixes) + r")(?=\s*\.|[^\w$]|$)")
    imports = re.compile(r"\bimport\s+(?P<static>static\s+)?(?P<name>[\w$.*\s]+?)\s*;")
    for path in files:
        if path.is_symlink() or (not path.is_dir() and (not path.is_file() or path.suffix != ".java")):
            raise InitError("Unexpected reference Java content or symbolic link; inspect step 4.2.")
        if not path.is_file():
            continue
        plan = FileEdit(ctx.root, str(path.relative_to(ctx.root)))
        masked = JAVA_LITERAL.sub(lambda match: " " * len(match[0]), plan.text)
        declarations = re.findall(r"\bpackage\s+([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*;", masked)
        relative = path.relative_to(root)
        expected = "referencefixtures" + ("." + ".".join(relative.parent.parts) if relative.parent.parts else "")
        if declarations != [expected]:
            raise InitError(f"{plan.relative}: reference declaration differs from its neutral path; inspect step 4.2.")
        if any(match[0] not in prefixes for match in spaced.finditer(masked)):
            raise InitError(f"{plan.relative}: token-spaced reference import; inspect step 4.2.")
        recognized, identities, seen = [], set(), set()
        for match in imports.finditer(masked):
            name = match["name"].strip()
            compact = re.sub(r"\s+", "", name)
            suffix = next((suffix for suffix in REFERENCE_IMPORTS if compact.endswith("." + suffix)), None)
            prefix = next((prefix for prefix in prefixes if compact == prefix or compact.startswith(prefix + ".")), None)
            if prefix is None and suffix is None:
                continue
            if prefix is None or suffix is None or compact != prefix + "." + suffix or name != compact or match["static"]:
                raise InitError(f"{plan.relative}: unexpected production reference import; preserve it and inspect step 4.2.")
            if suffix in seen:
                raise InitError(f"{plan.relative}: ambiguous production reference imports; inspect step 4.2.")
            if completed and prefix != new:
                raise InitError(f"{plan.relative}: stale reference import; run step 4.2.")
            seen.add(suffix)
            identities.add(prefix)
            start = match.start("name")
            # The regex may include trailing whitespace; change the type only.
            end = start + len(match["name"].rstrip())
            plan.set(start, end, OLD_PACKAGE + "." + suffix, new + "." + suffix, new + "." + suffix, "reference production import")
            recognized.append((start, end))
        if len(identities) > 1:
            raise InitError(f"{plan.relative}: mixed production reference namespaces; inspect step 4.2.")
        for match in owned.finditer(masked):
            if not any(start <= match.start() and match.end() <= end for start, end in recognized):
                raise InitError(f"{plan.relative}: production reference must use an approved explicit import; inspect step 4.2.")
        plans.append(plan)
    return plans


def refactor_java(ctx):
    plans, trees, fresh = java_plan(ctx)
    references = reference_java_plan(ctx)
    # Validate every neutral file before moving either application root. Commit
    # rechecks these snapshots before and during atomic reference replacements.
    for plan in references:
        if safe_path(plan.root, plan.relative).read_bytes() != plan.before:
            raise InitError("Reference source changed during preflight; inspect step 4.2.")
        plan.rendered()
    if not fresh:
        commit(references)
        reference_java_plan(ctx, completed=True)
        print("Java package roots verified; approved neutral reference imports match the selected namespace.")
        return
    for plan, target in plans:
        if target.exists() or target.is_symlink() or safe_path(plan.root, plan.relative).read_bytes() != plan.before:
            raise InitError("Java source or target changed during preflight; inspect step 4.2.")
    # Writes are exclusive. A partially interrupted tree is refused on retry;
    # neither an existing target file nor a foreign package tree is overwritten.
    for plan, target in plans:
        for parent in (target, *target.parents):
            if parent.is_symlink():
                raise InitError("Java target changed to a symbolic link; preserve both trees and inspect step 4.2.")
            if parent == ctx.root:
                break
        target.parent.mkdir(parents=True, exist_ok=True)
        if safe_path(plan.root, plan.relative).read_bytes() != plan.before:
            raise InitError("Java source changed before moving; preserve both trees and inspect step 4.2.")
        descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, plan.mode)
        with os.fdopen(descriptor, "wb") as stream:
            os.fchmod(stream.fileno(), plan.mode)
            stream.write(plan.rendered().encode("utf-8"))
        safe_path(plan.root, plan.relative).unlink()
    for origin, _ in trees:
        for directory in sorted((path for path in origin.rglob("*") if path.is_dir()), key=lambda path: len(path.parts), reverse=True):
            directory.rmdir()
        origin.rmdir()
    java_plan(ctx, completed=True)
    commit(references)
    reference_java_plan(ctx, completed=True)
    print("Moved both Java package roots and approved reference imports; neutral packages, comments, literals and migrations are preserved.")


def audit(ctx):
    plans = backend_plan(ctx) + frontend_plan(ctx) + titles_plan(ctx)
    for plan in plans:
        if plan.rendered().encode("utf-8") != plan.before:
            step = "4.1" if plan.relative.startswith("backend/") or plan.relative.startswith(".vscode/") else "5.2" if plan.relative.startswith("frontend/tests/") else "5.1"
            raise InitError(f"{plan.relative}: unfinished identity field; run step {step}.")
    java_plan(ctx, completed=True)
    reference_java_plan(ctx, completed=True)
    covered = {plan.relative: plan.rendered(mask=True) for plan in plans}
    owned = set(covered)
    for relative in ("frontend/src", "frontend/tests", "backend/scripts", "backend/src/main/resources", ".vscode"):
        folder = safe_path(ctx.root, relative, directory=True)
        for path in folder.rglob("*"):
            if path.is_symlink():
                raise InitError(f"{path.relative_to(ctx.root)}: identity audit refuses symbolic links.")
            if path.is_file() and path.suffix in (".ts", ".tsx", ".js", ".mjs", ".json", ".sh", ".yaml", ".yml", ".properties"):
                owned.add(str(path.relative_to(ctx.root)))
    for relative in sorted(owned):
        text = covered.get(relative)
        if text is None:
            text = safe_path(ctx.root, relative).read_text()
        # The exact explanatory comment describes installed framework tokens.
        # Only this known comment is excluded, never its whole runtime owner.
        if relative == "frontend/src/app/theme/themeSetup.ts":
            text = text.replace("/** The one typed source for RGO application-brand tokens. */", "")
        if IDENTITY.search(text):
            raise InitError(f"{relative}: unexpected template identity remains; inspect steps 4–5 before resuming.")
    print("Owned application identity is coherent; known framework artwork, attribution and fixtures are retained.")
