"""Initialization data, receipts and read-only probes. Never evaluate env as code."""
import argparse
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import shlex
import socket
import stat
import subprocess
import tempfile
import time
from types import SimpleNamespace
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
TEMPLATE = 'vireocodedev/web-app-starter'
FIELDS = frozenset(('PROJECT_SLUG DISPLAY_NAME JAVA_PACKAGE PWA_SHORT_NAME GH_ORG '
    'MAINTAINER_LOGIN INITIAL_USERNAME INITIAL_DISPLAY_NAME INITIAL_EMAIL DNS_ZONE '
    'STAGING_HOSTNAME PRODUCTION_HOSTNAME OPERATOR_SSH OPERATOR_IPV4 DNS_ZONE_ID '
    'DNS_PROJECT_ID DNS_TOKEN_FILE CI_SOURCE STAGING_FRONTEND_PORT STAGING_BACKEND_PORT '
    'PRODUCTION_FRONTEND_PORT PRODUCTION_BACKEND_PORT').split())
JAVA_KEYWORDS = frozenset(('abstract assert boolean break byte case catch char class '
    'const continue default do double else enum extends final finally float for goto '
    'if implements import instanceof int interface long native new package private '
    'protected public return short static strictfp super switch synchronized this '
    'throw throws transient try void volatile while true false null _ var yield record '
    'sealed permits').split())


class InitError(RuntimeError):
    """Safe operator-facing failure, without raw command or API output."""


def parser(description):
    result = argparse.ArgumentParser(description=description)
    result.add_argument('--env', type=Path, default=ROOT / '.template-initialization/values.env')
    return result


def run(argv, *, cwd=None, env=None, capture=False, check=True, timeout=120, input=None):
    """Run an argument vector; suppress captured failures that might contain secrets."""
    if Path(str(argv[0])).name == 'gh':
        env = dict(os.environ if env is None else env)
        env['GH_HOST'] = 'github.com'
        env.pop('GH_REPO', None)
    try:
        result = subprocess.run([str(x) for x in argv], cwd=cwd, env=env,
            capture_output=capture, text=True, timeout=timeout, input=input, check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise InitError('Command could not complete; inspect tools/access and retry the step.') from None
    if check and result.returncode:
        raise InitError(f'{Path(str(argv[0])).name} failed (exit {result.returncode}); no progress recorded.')
    return result


def _location_git(directory, arguments):
    # User shell Git overrides must not redirect discovery to a different checkout.
    environment = {key:value for key,value in os.environ.items() if not key.startswith('GIT_')}
    environment.update(LC_ALL='C', GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null',
        GIT_DISCOVERY_ACROSS_FILESYSTEM='1')
    try:
        return subprocess.run(['git', '-C', str(directory), *arguments],
            capture_output=True, text=True, check=False, timeout=10, env=environment)
    except (OSError, subprocess.TimeoutExpired):
        raise InitError('Git is required to prove private initialization paths are outside tracked content.') from None


def require_private_location(path):
    """Allow external storage, or an entirely ignored/untracked private Git directory."""
    path = Path(path).expanduser().absolute()
    for item in (path, *path.parents):
        if item.is_symlink():
            raise InitError('Private initialization paths must not contain symlinks.')
    path = path.resolve()
    existing = path.parent
    while not existing.exists():
        existing = existing.parent
    discovery = _location_git(existing, ['rev-parse', '--show-toplevel'])
    if discovery.returncode:
        if discovery.returncode == 128 and 'not a git repository' in discovery.stderr.lower():
            return path
        raise InitError('Cannot prove the private path Git boundary; resolve repository access before continuing.')
    try:
        worktree = Path(discovery.stdout.strip()).resolve(strict=True)
        relative = path.relative_to(worktree).as_posix()
        directory = path.parent.relative_to(worktree).as_posix().rstrip('/') + '/'
    except (OSError, ValueError):
        raise InitError('Private path does not match the discovered Git worktree.') from None
    # Protect the whole directory so atomic temporary files cannot become tracked.
    for candidate in (relative, directory):
        ignored = _location_git(worktree, ['-c', 'core.excludesFile=/dev/null',
            'check-ignore', '--quiet', '--no-index', '--', candidate])
        tracked = _location_git(worktree, ['ls-files', '-z', '--', candidate])
        if ignored.returncode != 0 or tracked.returncode != 0 or tracked.stdout:
            raise InitError('Private initialization data must be outside Git or in a Git-ignored, entirely untracked directory.')
    return path


def require_private_inputs(path):
    path = require_private_location(path)
    for name in ('verification.json', 'progress.json', 'result.json'):
        require_private_location(path.parent / name)
    return path


def private_file(path):
    path = require_private_location(path)
    try:
        info = path.lstat()
        parent = path.parent.lstat()
    except OSError:
        raise InitError('Required protected file is missing.') from None
    if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid()
            or stat.S_IMODE(info.st_mode) != 0o600 or not stat.S_ISDIR(parent.st_mode)
            or parent.st_uid != os.getuid() or stat.S_IMODE(parent.st_mode) != 0o700):
        raise InitError('Protected files require owner-only regular files (0600) in owned directories (0700).')
    for ancestor in path.parents:
        if ancestor.is_symlink():
            raise InitError('Protected file paths must not contain symlinks.')
    return path


def read_values(path, *, fields=FIELDS):
    path = private_file(path)
    values = {}
    try:
        if path.stat().st_size > 65536:
            raise InitError('Protected data file is unexpectedly large.')
        lines = path.read_text(encoding='utf-8').splitlines()
    except (OSError, UnicodeError):
        raise InitError('Cannot read protected UTF-8 data file.') from None
    for number, line in enumerate(lines, 1):
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        match = re.fullmatch(r'([A-Z][A-Z0-9_]*)=(.*)', line)
        if not match or match[1] not in fields or match[1] in values:
            raise InitError(f'Invalid, duplicate or unknown input key at line {number}.')
        value = match[2]
        # Plain UTF-8 data, not dotenv/shell syntax. Shell metacharacters are rejected.
        if not value or value != value.strip() or re.search(r'[\x00-\x1f\x7f`$;|&<>\\\"\']', value):
            raise InitError(f'Invalid literal data for {match[1]} at line {number}.')
        values[match[1]] = value
    missing = fields - values.keys()
    if missing:
        raise InitError('Missing input keys: ' + ', '.join(sorted(missing)))
    return values


def validate_values(values):
    """Validate all nonsecret inputs and fixed shared-infrastructure assumptions."""
    def require(condition, field):
        if not condition:
            raise InitError(f'Invalid or unsupported {field}; review .env.example and the guide.')
    slug = values['PROJECT_SLUG']
    require(3 <= len(slug) <= 40 and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug), 'PROJECT_SLUG')
    require(slug not in {'web-app-starter', 'your-project', 'project-slug', 'changeme'}, 'PROJECT_SLUG')
    package = values['JAVA_PACKAGE'].split('.')
    require(len(package) >= 2 and all(re.fullmatch(r'[a-z][a-z0-9_]*', part)
        and part not in JAVA_KEYWORDS for part in package), 'JAVA_PACKAGE')
    require(values['JAVA_PACKAGE'] != 'com.vireocode.backend', 'JAVA_PACKAGE')
    for key in ('DISPLAY_NAME', 'INITIAL_DISPLAY_NAME'):
        require(1 <= len(values[key]) <= 100 and '#' not in values[key], key)
    require(1 <= len(values['PWA_SHORT_NAME']) <= 12, 'PWA_SHORT_NAME')
    require(re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?', values['MAINTAINER_LOGIN'])
        and values['MAINTAINER_LOGIN'] != 'your-github-login', 'MAINTAINER_LOGIN')
    require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,63}', values['INITIAL_USERNAME']), 'INITIAL_USERNAME')
    require(re.fullmatch(r'[A-Za-z0-9.!%+_=-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', values['INITIAL_EMAIL'])
        and not values['INITIAL_EMAIL'].lower().endswith(('@example.com', '@example.org', '@example.net')), 'INITIAL_EMAIL')
    for key, expected in {'GH_ORG':'vireocodedev', 'DNS_ZONE':'vireocode.com',
            'DNS_ZONE_ID':'1423739', 'DNS_PROJECT_ID':'15086223',
            'OPERATOR_SSH':'root@46.224.72.162', 'OPERATOR_IPV4':'46.224.72.162',
            'CI_SOURCE':'/root/web-app-starter'}.items():
        require(values[key] == expected, key)
    require(ipaddress.ip_address(values['OPERATOR_IPV4']).version == 4, 'OPERATOR_IPV4')
    for key in ('STAGING_HOSTNAME', 'PRODUCTION_HOSTNAME'):
        name = values[key]
        require(len(name) <= 253 and name.endswith('.' + values['DNS_ZONE']) and
            all(re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?', label)
                for label in name.split('.')), key)
        require(name not in {'starter.vireocode.com', 'starter-staging.vireocode.com'}, key)
    require(values['STAGING_HOSTNAME'] != values['PRODUCTION_HOSTNAME'], 'environment hostnames')
    token = Path(values['DNS_TOKEN_FILE']).expanduser()
    require(token.is_absolute(), 'DNS_TOKEN_FILE')
    require(not token.resolve().is_relative_to(ROOT), 'DNS_TOKEN_FILE')
    ports = [values[key] for key in FIELDS if key.endswith('_PORT')]
    require(all(re.fullmatch(r'[0-9]{4,5}', port) and 1024 <= int(port) <= 65535 for port in ports)
        and len(set(ports)) == 4, 'environment ports')
    result = dict(values)
    result.update(REPOSITORY=f'{values["GH_ORG"]}/{slug}', COMPOSE_PROJECT_NAME=slug + '-local',
        DATABASE_NAME=slug.replace('-', '_'), RELEASE_BRANCH='release/initial-' + slug, RELEASE_SOURCE=f'/root/release-source-{slug}')
    return result


def env_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _write_json(path, value):
    path = require_private_location(path)
    # Never replace a symlink or an existing file with unexpected ownership/mode.
    if path.exists() or path.is_symlink():
        private_file(path)
    fd, temporary = tempfile.mkstemp(prefix='.' + path.name + '.', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            json.dump(value, stream, sort_keys=True, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def _read_json(path):
    try:
        result = json.loads(private_file(path).read_text())
    except (ValueError, OSError):
        raise InitError('Invalid protected initialization state; reconcile it before continuing.') from None
    if not isinstance(result, dict):
        raise InitError('Initialization state must be an object.')
    return result


def verifier_hash():
    directory = Path(__file__).resolve().parent
    digest = hashlib.sha256()
    for name in ('_shared.py', '2_4_verify_values.py'):
        digest.update(name.encode())
        digest.update((directory / name).read_bytes())
    return digest.hexdigest()


def load_context(args, require_verified=True, operator=False):
    path = private_file(require_private_inputs(args.env))
    values = validate_values(read_values(path))
    ctx = SimpleNamespace(root=ROOT, env_path=path, values=values, scope=None, mode=None)
    if operator and os.geteuid() != 0:
        raise InitError('Operator-host steps must run as the authorized root operator.')
    if require_verified:
        receipt = _read_json(path.parent / 'verification.json')
        if (receipt.get('schema') != 1 or receipt.get('env_sha256') != env_hash(path)
                or receipt.get('verifier_sha256') != verifier_hash()
                or receipt.get('repository') != values['REPOSITORY']
                or receipt.get('scope') not in {'local', 'full'}
                or receipt.get('mode') not in {'new', 'resume'}
                or not isinstance(receipt.get('verified_at'), (int, float))
                or not 0 <= time.time() - receipt['verified_at'] <= 86400):
            raise InitError('Values verification is absent, stale or changed; rerun 2_4_verify_values.py.')
        ctx.scope, ctx.mode = receipt['scope'], receipt['mode']
    return ctx


def read_state(ctx):
    path = ctx.env_path.parent / 'progress.json'
    if not path.exists() and not path.is_symlink():
        return {}
    result = _read_json(path)
    if result.get('repository') != ctx.values['REPOSITORY']:
        raise InitError('Progress belongs to another repository; do not reuse or overwrite it.')
    if result.get('env_sha256') != env_hash(ctx.env_path):
        raise InitError('Progress belongs to different input bytes; reconcile prior observations before changing values.')
    return result


def update_state(ctx, **values):
    result = read_state(ctx)
    if 'repository' in values and values['repository'] != ctx.values['REPOSITORY']:
        raise InitError('Cannot change recorded repository identity.')
    if 'env_sha256' in values and values['env_sha256'] != env_hash(ctx.env_path):
        raise InitError('Cannot attach progress to different input bytes.')
    if 'repository_id' in values:
        identity = values['repository_id']
        if type(identity) is not int or identity <= 0:
            raise InitError('Repository ID must be the observed positive numeric identity.')
        if 'repository_id' in result and (type(result['repository_id']) is not int
                or result['repository_id'] != identity):
            raise InitError('Cannot replace the verified repository ID; preserve progress and reconcile identity.')
    result.update(values, repository=ctx.values['REPOSITORY'], env_sha256=env_hash(ctx.env_path))
    _write_json(ctx.env_path.parent / 'progress.json', result)
    return result


def require_consumer(ctx):
    output = run(['git', 'remote', 'get-url', 'origin'], cwd=ctx.root, capture=True).stdout.strip()
    match = re.fullmatch(r'(?:git@github\.com:|https://github\.com/)([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+?)(?:\.git)?', output)
    if not match or match[1].lower() != ctx.values['REPOSITORY'].lower() or match[1].lower() == TEMPLATE:
        raise InitError('Git origin is not this exact private consumer. Canonical template initialization is forbidden.')


def github_api(endpoint, include=False):
    argv = ['gh', 'api', '--hostname', 'github.com', '-H', 'Accept: application/vnd.github+json',
        '-H', 'X-GitHub-Api-Version: 2022-11-28']
    if include:
        argv.append('--include')
    result = run([*argv, endpoint], capture=True)
    if include:
        return result.stdout
    try:
        return json.loads(result.stdout)
    except ValueError:
        raise InitError('GitHub returned invalid JSON; repository access is unverified.') from None


def verify_github(ctx, mode):
    """Verify the existing consumer; never create, clone or adopt a different ID."""
    values = ctx.values
    require_consumer(ctx)
    state = read_state(ctx)
    if mode == 'resume' and 'repository_id' not in state:
        raise InitError('Resume requires the exact recorded repository ID in protected progress.json.')
    # Retain the shared infrastructure's existing account/organization policy.
    response = github_api('user', include=True)
    header, separator, body = response.replace('\r\n', '\n').partition('\n\n')
    if not separator:
        raise InitError('GitHub authentication response has no authenticated scope evidence.')
    scopes_match = re.search(r'^x-oauth-scopes:\s*(.*)$', header, re.I | re.M)
    scopes = set(x.strip() for x in scopes_match[1].split(',')) if scopes_match else set()
    if 'repo' not in scopes or not scopes.intersection({'read:org', 'admin:org', 'write:org'}):
        raise InitError('GitHub access requires gh OAuth repo and read:org scopes.')
    try:
        user = json.loads(body)
    except ValueError:
        raise InitError('Invalid GitHub account response.') from None
    if (not isinstance(user, dict) or not isinstance(user.get('login'), str)
            or user['login'].lower() != values['MAINTAINER_LOGIN'].lower()):
        raise InitError('Authenticated GitHub account differs from MAINTAINER_LOGIN.')
    membership = github_api(f'user/memberships/orgs/{values["GH_ORG"]}')
    if (not isinstance(membership, dict) or membership.get('state') != 'active'
            or membership.get('role') != 'admin'):
        raise InitError('Shared infrastructure setup requires an authenticated organization owner.')
    repo = github_api(f'repos/{values["REPOSITORY"]}')
    if (not isinstance(repo, dict) or type(repo.get('id')) is not int or repo['id'] <= 0
            or not isinstance(repo.get('full_name'), str)
            or repo['full_name'].lower() != values['REPOSITORY'].lower()
            or repo.get('private') is not True or repo.get('archived') or repo.get('disabled')
            or repo.get('default_branch') != 'main' or not isinstance(repo.get('permissions'), dict)
            or repo['permissions'].get('admin') is not True):
        raise InitError('Initialization requires the exact existing private active consumer, main branch and admin access.')
    if 'repository_id' in state and (type(state['repository_id']) is not int
            or state['repository_id'] <= 0 or state['repository_id'] != repo['id']):
        raise InitError('Recorded repository ID differs; preserve progress and reconcile the consumer identity.')
    return {'account': user['login'], 'repository_id': repo['id']}


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise InitError('Provider redirect rejected; credentials were not forwarded.')


def dns_api(ctx, path):
    if not re.fullmatch(r'/zones/[0-9]+(?:/rrsets)?(?:\?per_page=100&page=[0-9]+)?', path):
        raise InitError('Unexpected DNS API path.')
    token = read_values(Path(ctx.values['DNS_TOKEN_FILE']).expanduser(), fields=frozenset({'HCLOUD_TOKEN'}))['HCLOUD_TOKEN']
    request = urllib.request.Request('https://api.hetzner.cloud/v1' + path,
        headers={'Authorization': 'Bearer ' + token, 'User-Agent':'template-initialization-read-only/1'})
    try:
        with urllib.request.build_opener(_NoRedirect()).open(request, timeout=20) as response:
            data = response.read(4 * 1024 * 1024 + 1)
            if len(data) > 4 * 1024 * 1024:
                raise InitError('DNS API response exceeded its bounded size.')
            result = json.loads(data)
    except (urllib.error.URLError, OSError, ValueError):
        raise InitError('DNS API access failed; zone/hostname availability is unverified.') from None
    if not isinstance(result, dict):
        raise InitError('DNS API returned an unexpected response.')
    return result


def dns_query(name, kind, server=None, *, authoritative=True):
    argv = ['dig', '+time=3', '+tries=1', '+noall', '+comments', '+answer', '+authority', '+norecurse' if server and authoritative else '+recurse']
    if server:
        argv.append('@' + server)
    output = run([*argv, name, kind], capture=True, timeout=15).stdout
    status = re.search(r'status:\s*([A-Z]+)', output)
    if not status or status[1] not in {'NOERROR', 'NXDOMAIN'}:
        raise InitError('DNS lookup failed or was inconclusive; no availability evidence recorded.')
    flags = re.search(r'flags:\s*([^;]*);', output)
    if server and authoritative and (not flags or 'aa' not in flags[1].split()):
        raise InitError('DNS server response is not authoritative for the requested name.')
    records = []
    for line in output.splitlines():
        if line and not line.startswith(';'):
            parts = line.split()
            if len(parts) >= 5 and parts[2] == 'IN':
                records.append((parts[0].rstrip('.').lower(), parts[3], ' '.join(parts[4:])))
    return records


def _rr_records(rr):
    records = rr.get('records')
    if not isinstance(records, list) or any(not isinstance(x, dict) or not isinstance(x.get('value'), str) for x in records):
        raise InitError('Malformed provider record set; hostname availability unverified.')
    return [x['value'].rstrip('.') for x in records]


def verify_dns(ctx, mode):
    values = ctx.values
    zone_id, zone_name = values['DNS_ZONE_ID'], values['DNS_ZONE']
    zone = dns_api(ctx, '/zones/' + zone_id).get('zone', {})
    if str(zone.get('id')) != zone_id or zone.get('name') != zone_name or zone.get('mode') != 'primary':
        raise InitError('DNS token does not access the exact configured primary zone.')
    # Hetzner Cloud tokens are project-scoped; the protected file is the DNS-project
    # credential. The API exposes zone identity, not its numeric Console project ID.
    assigned = zone.get('authoritative_nameservers', {}).get('assigned', [])
    if not isinstance(assigned, list) or not assigned or any(not isinstance(x, str) for x in assigned):
        raise InitError('Provider did not return authoritative nameserver evidence.')
    assigned = {name.rstrip('.').lower() for name in assigned}
    recursive = {value.rstrip('.').lower() for owner, kind, value in dns_query(zone_name, 'NS')
        if owner == zone_name and kind == 'NS'}
    if recursive != assigned:
        raise InitError('Public zone delegation differs from the exact provider zone.')
    rrsets = []
    for page in range(1, 1001):
        result = dns_api(ctx, f'/zones/{zone_id}/rrsets?per_page=100&page={page}')
        chunk = result.get('rrsets')
        if not isinstance(chunk, list) or any(not isinstance(rr, dict)
                or not isinstance(rr.get('name'), str) or not isinstance(rr.get('type'), str) for rr in chunk):
            raise InitError('Malformed provider record inventory.')
        rrsets.extend(chunk)
        pagination = result.get('meta', {}).get('pagination', {})
        next_page = pagination.get('next_page')
        if next_page is None:
            if len(chunk) == 100 and 'next_page' not in pagination:
                raise InitError('DNS inventory has no complete pagination evidence.')
            break
        if next_page != page + 1:
            raise InitError('DNS pagination is incomplete.')
    else:
        raise InitError('DNS inventory pagination did not terminate.')
    state = read_state(ctx)
    for hostname_key in ('STAGING_HOSTNAME', 'PRODUCTION_HOSTNAME'):
        hostname = values[hostname_key]
        relative = hostname[:-(len(zone_name) + 1)]
        ancestors = ['.'.join(relative.split('.')[index:]) for index in range(len(relative.split('.')))]
        wildcards = {'*' + ('.' + suffix if suffix else '') for suffix in
            ['.'.join(relative.split('.')[index:]) for index in range(1, len(relative.split('.')))] + ['']}
        matches = []
        for rr in rrsets:
            name, kind = rr['name'], rr['type']
            if (name in wildcards or name in ancestors[1:] and kind in {'NS', 'CNAME', 'DNAME'}):
                raise InitError('Wildcard, ancestor alias or delegated subzone conflicts with an environment hostname.')
            if name == relative:
                matches.append(rr)
        if matches:
            if mode != 'resume' or state.get('dns_hostnames') != [values['STAGING_HOSTNAME'], values['PRODUCTION_HOSTNAME']]:
                raise InitError('Environment hostname already has provider records; choose an unused name or reconcile recorded ownership.')
            if any(rr['type'] != 'A' or _rr_records(rr) != [values['OPERATOR_IPV4']] for rr in matches):
                raise InitError('Existing hostname records do not exactly match this recorded project.')
        for server in sorted(assigned):
            soa = dns_query(zone_name, 'SOA', server)
            if not any(owner == zone_name and kind == 'SOA' for owner, kind, _ in soa):
                raise InitError('Authoritative zone SOA verification failed.')
            for kind in ('A', 'AAAA', 'CNAME', 'NS'):
                answer = [(owner, rtype, data) for owner, rtype, data in dns_query(hostname, kind, server)
                    if owner == hostname and rtype in {'A', 'AAAA', 'CNAME', 'NS'}]
                if answer and (mode != 'resume' or kind != 'A' or not matches
                        or answer != [(hostname, 'A', values['OPERATOR_IPV4'])]):
                    raise InitError('Authoritative hostname answer conflicts with project ownership or requested address.')
    return {'zone_id': zone_id, 'zone': zone_name, 'nameservers': sorted(assigned)}


def verify_ssh(ctx):
    # Fixed read-only program; validated project data travels as JSON on stdin,
    # never as executable shell text. Existing SSH known_hosts must attest identity.
    probe = r'''import json, os, pathlib, shutil, subprocess, sys
v = json.load(sys.stdin)
if os.geteuid() != 0:
    raise SystemExit('operator-root-required')
if not all(shutil.which(tool) for tool in ('python3', 'docker', 'systemctl', 'caddy', 'openssl', 'ss', 'git')):
    raise SystemExit('operator-toolchain-incomplete')
if not pathlib.Path('/root/web-app-starter/.git').is_dir():
    raise SystemExit('canonical-ci-source-missing')
origin = subprocess.run(['git','-C','/root/web-app-starter','remote','get-url','origin'], capture_output=True,text=True,check=True).stdout.strip()
if origin not in ('git@github.com:vireocodedev/web-app-starter.git','https://github.com/vireocodedev/web-app-starter.git','https://github.com/vireocodedev/web-app-starter'):
    raise SystemExit('canonical-ci-origin-mismatch')
if not any(line.strip() == 'import /etc/caddy/sites/*.caddy' for line in pathlib.Path('/etc/caddy/Caddyfile').read_text().splitlines()):
    raise SystemExit('caddy-import-missing')
listeners = subprocess.run(['ss','-H','-ltn'],capture_output=True,text=True,check=True).stdout
ports = sorted({int(line.split()[3].rsplit(':',1)[1]) for line in listeners.splitlines()})
configs = [json.loads(path.read_text()) for path in pathlib.Path('/etc/web-app-deploy').glob('*/runtime.json')]
slug = v['PROJECT_SLUG']
paths = ['/etc/web-app-deploy/'+slug, '/var/lib/web-app-deploy/'+slug, '/usr/local/lib/web-app-deploy/'+slug, v['RELEASE_SOURCE']]
print(json.dumps({'root':os.geteuid() == 0,'ports':ports,'configs':configs,'namespace_exists':any(pathlib.Path(path).exists() for path in paths)}))
'''
    command = 'python3 -I -c ' + shlex.quote(probe)
    output = run(['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
        '-o', 'ConnectTimeout=10', '-o', 'ConnectionAttempts=1', '-o', 'ServerAliveInterval=5',
        '-o', 'ServerAliveCountMax=2', ctx.values['OPERATOR_SSH'], command],
        input=json.dumps(ctx.values), capture=True, timeout=30).stdout
    try:
        evidence = json.loads(output)
        if evidence.get('root') is not True or not isinstance(evidence['ports'], list) or not isinstance(evidence['configs'], list):
            raise ValueError()
        desired = {int(value) for key, value in ctx.values.items() if key.endswith('_PORT')}
        own = None
        reserved = set(evidence['ports'])
        for config in evidence['configs']:
            if config['slug'] == ctx.values['PROJECT_SLUG']:
                if config['repository'] != ctx.values['REPOSITORY']:
                    raise InitError('Deployment namespace belongs to another repository.')
                own = config
            for settings in config['environments'].values():
                reserved.update([settings['frontend_port'], settings['backend_port']])
        if ctx.mode == 'resume' and own:
            for environment, prefix in [('staging','STAGING'),('production','PRODUCTION')]:
                expected = {'hostname':ctx.values[prefix + '_HOSTNAME'],
                    'frontend_port':int(ctx.values[prefix + '_FRONTEND_PORT']),
                    'backend_port':int(ctx.values[prefix + '_BACKEND_PORT'])}
                if own['environments'][environment] != expected:
                    raise InitError('Existing deployment settings differ from recorded initialization inputs.')
            # Config ownership proves these ports; other runtime configs must not overlap.
            for config in evidence['configs']:
                if config is not own and any(settings[key] in desired for settings in config['environments'].values()
                        for key in ('frontend_port','backend_port')):
                    raise InitError('Another project reserves a requested deployment port.')
        elif desired & reserved or ctx.mode == 'new' and evidence['namespace_exists']:
            raise InitError('Deployment ports or project namespace are already reserved on the operator host.')
    except (AttributeError, KeyError, TypeError, ValueError):
        raise InitError('SSH operator probe returned incomplete deployment evidence.') from None
    return {'operator':ctx.values['OPERATOR_SSH'], 'verified':True, 'ports_checked':sorted(desired)}


def verify_tools():
    for tool in ('git', 'bash', 'python3', 'rg', 'gh', 'java', 'node', 'npm', 'docker', 'dig', 'ssh'):
        if shutil.which(tool) is None:
            raise InitError(f'Missing workstation tool: {tool}.')
    checks = [(['git', '--version'], None), (['bash', '--version'], None),
        (['python3', '--version'], r'Python 3\.(?:1[1-9]|[2-9][0-9])\.'),
        (['gh', '--version'], None), (['java', '-version'], r'(?:version|openjdk) "?21[.\s"]'),
        (['node', '--version'], r'^v24\.'), (['npm', '--version'], r'^12\.'),
        (['docker', 'version'], None),
        (['docker', 'compose', 'version'], r'^Docker Compose version v?5\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\s*$')]
    for command, pattern in checks:
        result = run(command, capture=True, timeout=30)
        if pattern and not re.search(pattern, result.stdout + result.stderr):
            if command[:2] == ['docker', 'compose']:
                raise InitError('Unsupported Docker Compose version; require Docker Compose 5.x.')
            raise InitError(f'Unsupported {command[0]} version; review the guide pins.')
    return {'tools': 'matching workstation versions and Docker access'}


def verify_environment(ctx, scope, mode):
    # Invalidate old evidence first: a failed refresh must never leave a passing receipt.
    receipt_path = ctx.env_path.parent / 'verification.json'
    if receipt_path.exists() or receipt_path.is_symlink():
        private_file(receipt_path).unlink()
    ctx.scope, ctx.mode = scope, mode
    # Initialization begins inside the already cloned consumer in every scope/mode.
    require_consumer(ctx)
    read_state(ctx)
    verify_tools()
    evidence = {'tools': True}
    if scope == 'full':
        evidence['github'] = verify_github(ctx, mode)
        evidence['ssh'] = verify_ssh(ctx)
        evidence['dns'] = verify_dns(ctx, mode)
        # Bind first-time identity only after all probes pass; retries retain it.
        update_state(ctx, repository_id=evidence['github']['repository_id'])
    receipt = {'schema': 1, 'env_sha256': env_hash(ctx.env_path), 'repository': ctx.values['REPOSITORY'],
        'scope': scope, 'mode': mode, 'verified_at': time.time(), 'evidence': evidence,
        'verifier_sha256': verifier_hash(), 'producer': socket.gethostname()}
    _write_json(receipt_path, receipt)
    ctx.scope, ctx.mode = scope, mode
    return receipt
