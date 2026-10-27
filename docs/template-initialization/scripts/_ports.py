"""Read-only host port inventory and protected pre-verification value selection."""
import json
import os
from pathlib import Path
import shlex
import tempfile

from _shared import InitError, load_context, parser, private_file, require_consumer, run

PORT_KEYS = ("STAGING_FRONTEND_PORT", "STAGING_BACKEND_PORT",
             "PRODUCTION_FRONTEND_PORT", "PRODUCTION_BACKEND_PORT")

# Fixed code only. Project inputs travel as JSON, never executable shell text.
PROBE = r'''import json, os, pathlib, stat, subprocess, sys
v = json.load(sys.stdin)
if os.geteuid() != 0:
    raise SystemExit("operator-root-required")
used = set()
for line in subprocess.check_output(["ss", "-H", "-ltn"], text=True).splitlines():
    port = int(line.split()[3].rsplit(":", 1)[1])
    if not 1 <= port <= 65535:
        raise SystemExit("invalid-listener-port")
    used.add(port)
base = pathlib.Path("/etc/web-app-deploy")
if base.is_symlink():
    raise SystemExit("unsafe-runtime-directory")
if base.exists():
    info = base.lstat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
        raise SystemExit("unsafe-runtime-directory")
    for directory in base.iterdir():
        info = directory.lstat()
        if directory.is_symlink() or not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise SystemExit("unsafe-project-directory")
        path = directory / "runtime.json"
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or stat.S_IMODE(info.st_mode) != 0o600 or info.st_size > 65536:
            raise SystemExit("unsafe-runtime-file")
        config = json.loads(path.read_text())
        if set(config["environments"]) != {"staging", "production"}:
            raise SystemExit("invalid-runtime-environments")
        for settings in config["environments"].values():
            for key in ("frontend_port", "backend_port"):
                port = settings[key]
                if type(port) is not int or not 1024 <= port <= 65535:
                    raise SystemExit("invalid-reserved-port")
                used.add(port)
slug = v["PROJECT_SLUG"]
paths = ["/etc/web-app-deploy/" + slug, "/var/lib/web-app-deploy/" + slug,
         "/usr/local/lib/web-app-deploy/" + slug, v["RELEASE_SOURCE"]]
print(json.dumps({"ports": sorted(used), "namespace_exists": any(pathlib.Path(p).exists() or pathlib.Path(p).is_symlink() for p in paths)}))
'''


def inventory(ctx):
    result = run(["ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
                  "-o", "ConnectTimeout=10", "-o", "ConnectionAttempts=1",
                  ctx.values["OPERATOR_SSH"], "python3 -I -c " + shlex.quote(PROBE)],
                 input=json.dumps({key: ctx.values[key] for key in ("PROJECT_SLUG", "RELEASE_SOURCE")}),
                 capture=True, timeout=30)
    try:
        value = json.loads(result.stdout)
        if (not isinstance(value, dict) or set(value) != {"ports", "namespace_exists"}
                or type(value["namespace_exists"]) is not bool or not isinstance(value["ports"], list)
                or any(type(port) is not int or not 1 <= port <= 65535 for port in value["ports"])):
            raise ValueError()
        return value
    except (ValueError, TypeError):
        raise InitError("Host port inventory is invalid; values were not changed.") from None


def choose(current, used):
    if used.isdisjoint(current):
        return current
    for base in range(18280, 65000, 200):
        candidate = (base, base + 1, base + 100, base + 101)
        if used.isdisjoint(candidate):
            return candidate
    raise InitError("No available four-port block in the scanned range; values were not changed.")


def select(ctx):
    require_consumer(ctx)
    original = private_file(ctx.env_path).read_bytes()
    observed = inventory(ctx)
    if observed["namespace_exists"]:
        raise InitError("This deployment namespace already exists; preserve its ports and reconcile resume state.")
    current = tuple(int(ctx.values[key]) for key in PORT_KEYS)
    selected = choose(current, set(observed["ports"]))
    if selected != current:
        for name in ("verification.json", "progress.json", "result.json"):
            path = ctx.env_path.parent / name
            if path.exists() or path.is_symlink():
                raise InitError("Changing ports would invalidate existing verification/progress; preserve and reconcile it first.")
        replacements = dict(zip(PORT_KEYS, selected))
        lines = original.decode("utf-8").splitlines(keepends=True)
        for index, line in enumerate(lines):
            key = line.split("=", 1)[0]
            if key in replacements:
                ending = "\r\n" if line.endswith("\r\n") else "\n" if line.endswith("\n") else ""
                lines[index] = key + "=" + str(replacements[key]) + ending
        descriptor, temporary = tempfile.mkstemp(prefix=".values-ports-", dir=ctx.env_path.parent)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                os.fchmod(stream.fileno(), 0o600)
                stream.write("".join(lines).encode("utf-8"))
                stream.flush()
                os.fsync(stream.fileno())
            if private_file(ctx.env_path).read_bytes() != original:
                raise InitError("Values changed during host inspection; nothing was replaced.")
            os.replace(temporary, ctx.env_path)
        finally:
            Path(temporary).unlink(missing_ok=True)
    for key, value in zip(PORT_KEYS, selected):
        print(f"{key}={value}")
    print("Available deployment ports saved/confirmed. Nothing is reserved; step 2.4 rechecks availability.")


def cli():
    arguments = parser("Select available deployment ports before values verification; run from the workstation consumer.")
    args = arguments.parse_args()
    try:
        select(load_context(args, require_verified=False))
    except Exception as error:
        message = str(error) if isinstance(error, InitError) else "Port selection failed; values were preserved."
        arguments.exit(1, "Initialization stopped: " + message + "\n")
