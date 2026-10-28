#!/usr/bin/env python3
"""Reviewed canonical operator code. JSON stdin is data, never executable source."""
from contextlib import ExitStack
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import socket
import stat
import subprocess
import sys
from _ci_drain import drain_and_stop
from _state import Error, ROOT, digest, encode, identity, locked, make_directory, operation, read, sync_dir, unique, write


MAX_INPUT = 4 * 1024 * 1024
LABEL = 'hr.vireocode.deployment'
MOUNTINFO = Path('/proc/self/mountinfo')


def command(*arguments, timeout=120, input=None, check=True):
    try:
        result = subprocess.run([str(item) for item in arguments], capture_output=True, text=True,
                                timeout=timeout, input=input)
    except (OSError, subprocess.TimeoutExpired):
        raise Error('Operator command outcome uncertain; reconcile the protected journal.') from None
    if check and result.returncode:
        raise Error('Operator command failed: ' + Path(str(arguments[0])).name + '; private diagnostics were suppressed.')
    return result.stdout.strip()


def canonical():
    if os.geteuid() != 0:
        raise Error('Operator deletion actions require root.')
    for path in (ROOT, *ROOT.parents):
        info = path.lstat()
        if path.is_symlink() or info.st_uid != 0 or info.st_mode & 0o022:
            raise Error('Canonical code and ancestors must remain root-controlled.')
    origin = command('git', '-C', ROOT, 'remote', 'get-url', 'origin')
    if origin not in {'https://github.com/vireocodedev/web-app-starter.git', 'https://github.com/vireocodedev/web-app-starter', 'git@github.com:vireocodedev/web-app-starter.git'} or command('git', '-C', ROOT, 'status', '--porcelain'):
        raise Error('Use a clean reviewed canonical web-app-starter checkout.')
    return {'source_sha': command('git', '-C', ROOT, 'rev-parse', 'HEAD'), 'implementation_sha256': implementation_hash()}


def implementation_hash():
    return digest({path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(Path(__file__).parent.glob('*.py'))})


def file_digest(path):
    digest_value = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest_value.update(chunk)
    return digest_value.hexdigest()


def mount_path(raw):
    # proc mountinfo escapes spaces, tabs, newlines and literal backslashes.
    if re.search(r'\\(?!040|011|012|134)', raw):
        raise Error('Malformed operator mount inventory.')
    decoded = re.sub(r'\\(040|011|012|134)', lambda match: chr(int(match[1], 8)), raw)
    path = Path(decoded)
    if (not path.is_absolute() or decoded.startswith('//') or '..' in path.parts
            or str(path) != decoded or '\0' in decoded):
        raise Error('Malformed operator mount inventory.')
    return path


def require_unmounted_tree(path):
    """Reject selected roots and nested mounts, including same-device binds.

    Ancestor filesystems are legitimate. Device comparisons and ismount do not
    identify every bind mount, so inspect the current namespace's kernel table
    before looking through a selected tree or asking Docker to remove its data.
    """
    target = Path(path)
    if not target.is_absolute() or '..' in target.parts:
        raise Error('Mount boundary requires an absolute selected resource.')
    try:
        lines = MOUNTINFO.read_text().splitlines()
        if not lines:
            raise ValueError()
        mounts = []
        identifiers = set()
        for line in lines:
            fields = line.split()
            if fields.count('-') != 1:
                raise ValueError()
            separator = fields.index('-')
            if (separator < 6 or len(fields) != separator + 4
                    or not fields[0].isdigit() or int(fields[0]) <= 0
                    or fields[0] in identifiers or not fields[1].isdigit()
                    or not re.fullmatch(r'[0-9]+:[0-9]+', fields[2])):
                raise ValueError()
            identifiers.add(fields[0])
            # nsfs bind mounts expose namespace-name:[inode] through ns_dname
            # instead of a filesystem pathname. Only the fsroot has this form;
            # the mount target remains an absolute, escaped kernel pathname.
            # Linux fs/nsfs.c (ns_dname) and fs/proc_namespace.c (show_mountinfo).
            namespace_root = (fields[separator + 1] == 'nsfs'
                              and re.fullmatch(r'(?:mnt|net|uts|ipc|pid|user|cgroup|time):\[[1-9][0-9]*\]', fields[3]))
            if not namespace_root:
                mount_path(fields[3])
            mounts.append(mount_path(fields[4]))
    except (OSError, UnicodeError, ValueError):
        raise Error('Operator mount inventory is unavailable or malformed; preserve resources.') from None
    if any(mount == target or mount.is_relative_to(target) for mount in mounts):
        raise Error('Selected resource is a mount or contains a nested mount; preserve it.')


def metadata(path, *, owner=0, recursive=True):
    """Only identity, hashes and modes leave the host; never credential bytes."""
    path = Path(path)
    require_unmounted_tree(path)
    if not path.exists() and not path.is_symlink():
        return {'path': str(path), 'absent': True}
    ancestors = list(path.parents)
    for parent in ancestors:
        info = parent.lstat()
        if parent.is_symlink() or info.st_uid not in {0, owner} or info.st_mode & 0o022:
            raise Error('Unsafe resource ancestor: ' + str(parent))
    files = [path]
    if path.is_dir() and not path.is_symlink() and recursive:
        files += sorted(path.rglob('*'))
    entries = []
    for item in files:
        info = item.lstat()
        if (item.is_symlink() or info.st_uid != owner or info.st_mode & 0o022
                or not (stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode))):
            raise Error('Unsafe owner, symlink, mount or writable resource: ' + str(item))
        record = {'path': str(item.relative_to(path)) if item != path else '.',
                  'uid': info.st_uid, 'gid': info.st_gid, 'mode': stat.S_IMODE(info.st_mode),
                  'kind': 'directory' if item.is_dir() else 'file', 'device': info.st_dev, 'inode': info.st_ino}
        if item.is_file():
            record.update(size=info.st_size, sha256=file_digest(item))
        entries.append(record)
    return {'path': str(path), 'owner': owner, 'entries': entries, 'sha256': digest(entries)}


def fixed_paths(value):
    slug = value['slug']
    return [('/etc/web-app-deploy/' + slug, 0), ('/usr/local/lib/web-app-deploy/' + slug, 0),
            ('/var/lib/web-app-deploy/' + slug, 0), ('/etc/caddy/sites/' + slug + '.caddy', 0),
            ('/root/release-source-' + slug, 0), ('/root/' + slug + '-initialization', 0),
            ('/root/recovery-' + slug + '-initial', 0), ('/root/project-registration-' + slug + '.json', 0),
            *[('/etc/systemd/system/' + name, 0) for name in units(value)]]


def units(value):
    slug = value['slug']
    return ['web-app-deploy-' + slug + '.service', 'web-app-backup-' + slug + '.service', 'web-app-backup-' + slug + '.timer']


def extra_paths(value, extras):
    if not isinstance(extras, list):
        raise Error('Extra resource manifest must be a list.')
    result = []
    known = {path for path, _ in fixed_paths(value)}
    for extra in extras:
        if not isinstance(extra, dict) or set(extra) != {'path', 'kind', 'evidence_sha256', 'fingerprint'}:
            raise Error('Extra manifest fields: path, kind, evidence_sha256, fingerprint.')
        path, kind = extra['path'], extra['kind']
        if (not isinstance(path, str) or path in known or not re.fullmatch('[0-9a-f]{64}', extra['evidence_sha256'])
                or '..' in Path(path).parts or str(Path(path)) != path):
            raise Error('Extra resource identity or reviewed evidence invalid.')
        if kind == 'task-artifact':
            if not re.fullmatch('/root/' + re.escape(value['slug']) + r'-[A-Za-z0-9_-]+', path):
                raise Error('Task artifact must be an explicitly reviewed project-scoped direct root child.')
            owner = 0
        elif kind == 'orphan-ssh-key':
            if path not in {'/root/.ssh/' + value['slug'] + '-readonly', '/root/.ssh/' + value['slug'] + '-readonly.pub'}:
                raise Error('Only explicitly reviewed project orphan keys supported.')
            if not re.fullmatch(r'SHA256:[A-Za-z0-9+/]{43}', extra['fingerprint'] or ''):
                raise Error('Require the recorded public-key fingerprint.')
            key = Path('/root/.ssh/' + value['slug'] + '-readonly.pub')
            if key.exists():
                observed = command('ssh-keygen', '-lf', key).split()
                if len(observed) < 2 or observed[1] != extra['fingerprint']:
                    raise Error('SSH key fingerprint differs; preserve it.')
            for directory in (Path('/root/.ssh'), Path('/etc/ssh')):
                for file in directory.glob('*config*'):
                    if file.is_file() and (path in file.read_text(errors='replace') or Path(path).name in file.read_text(errors='replace')):
                        raise Error('SSH configuration references the key; preserve it.')
            owner = 0
        elif kind == 'dedicated-tls':
            base = '/var/lib/caddy/.local/share/caddy/certificates/'
            if not path.startswith(base) or Path(path).name not in value['hostnames'].values() or len(Path(path).relative_to(base).parts) != 2:
                raise Error('TLS asset must be the exact dedicated hostname directory.')
            directory = Path(path)
            owner = directory.lstat().st_uid if directory.exists() else 999
            if owner == 0:
                raise Error('Expected the dedicated Caddy storage owner.')
            cert = directory / (directory.name + '.crt')
            if cert.exists():
                names = command('openssl', 'x509', '-noout', '-ext', 'subjectAltName', '-in', cert)
                hosts = re.findall(r'DNS:([^,\s]+)', names)
                if hosts != [directory.name]:
                    raise Error('Shared/wildcard TLS certificate must be preserved.')
            if extra['fingerprint'] is not None:
                raise Error('TLS manifest fingerprint field must be null.')
        else:
            raise Error('Unsupported extra resource kind.')
        known.add(path)
        result.append((path, owner))
    if any(Path(a).is_relative_to(Path(b)) or Path(b).is_relative_to(Path(a)) for i, (a, _) in enumerate(result) for b, _ in result[i + 1:]):
        raise Error('Overlapping extra resource paths.')
    return result


def unknown_paths(value, extras):
    allowed = {Path(path) for path, _ in fixed_paths(value) + extra_paths(value, extras)}
    allowed.add(Path('/root/' + value['slug'] + '-deletion'))
    candidates = set(Path('/root').glob(value['slug'] + '-*'))
    candidates.update(Path('/root').glob('release-source-' + value['slug'] + '*'))
    candidates.update(Path('/root').glob('recovery-' + value['slug'] + '*'))
    candidates.update(Path('/root/.ssh').glob(value['slug'] + '*'))
    storage = Path('/var/lib/caddy/.local/share/caddy/certificates')
    if storage.exists():
        for host in value['hostnames'].values():
            candidates.update(storage.glob('*/' + host))
    for path in candidates:
        if not any(path == approved or path.is_relative_to(approved) for approved in allowed):
            raise Error('Unmanifested possible project asset; inspect exact provenance before planning: ' + str(path))


def json_command(*arguments):
    try:
        return json.loads(command(*arguments), object_pairs_hook=unique)
    except ValueError:
        raise Error('Operator inventory response invalid.') from None


def docker(value):
    slug = value['slug']
    projects = {slug + '-' + env + '-' + kind for env in ('staging', 'production') for kind in ('app', 'db')}
    raw = command('docker', 'ps', '--all', '--no-trunc', '--format', '{{.ID}}')
    containers, all_containers = [], []
    for identifier in raw.splitlines():
        item = json_command('docker', 'inspect', '--format', '{"id":{{json .Id}},"name":{{json .Name}},"image":{{json .Image}},"labels":{{json .Config.Labels}},"mounts":{{json .Mounts}},"networks":{{json .NetworkSettings.Networks}}}', identifier)
        labels = item['labels'] or {}
        record = {'id': item['id'], 'name': item['name'].removeprefix('/'), 'image': item['image'],
                  'project': labels.get('com.docker.compose.project'), 'service': labels.get('com.docker.compose.service'),
                  'mounts': [{key: mount.get(key) for key in ('Type', 'Name', 'Source', 'Destination')} for mount in item['mounts']],
                  'networks': sorted(item['networks'])}
        all_containers.append(record)
        if record['project'] in projects:
            env = next(env for env in ('staging', 'production') if record['project'].startswith(slug + '-' + env + '-'))
            if record['service'] not in ({'postgres'} if record['project'].endswith('-db') else {'frontend', 'backend'}):
                raise Error('Unexpected service under project Compose ownership.')
            for mount in record['mounts']:
                if (mount['Type'] != 'volume' or mount['Name'] != slug + '-' + env + '-postgres'
                        or mount['Destination'] != '/var/lib/postgresql' or record['service'] != 'postgres'):
                    raise Error('Unexpected bind/foreign mount on project container.')
            if record['service'] == 'postgres':
                sys.path.insert(0, str(ROOT / 'infrastructure/release'))
                from runtime import POSTGRES
                expected_image = json_command('docker', 'image', 'inspect', '--format', '{{json .Id}}', POSTGRES)
                if record['image'] != expected_image:
                    raise Error('Database image differs from the pinned shared PostgreSQL image.')
            else:
                provenance = json_command('docker', 'image', 'inspect', '--format', '{{json .Config.Labels}}', record['image'])
                if not provenance or provenance.get('org.opencontainers.image.source') != 'https://github.com/' + value['repository']:
                    raise Error('Application image provenance differs.')
            containers.append(record)
        elif record['name'].startswith(slug + '-'):
            raise Error('Unowned similarly named container blocks deletion; explicit reconciliation required.')
    selected_ids = {item['id'] for item in containers}
    networks, volumes = [], []
    expected_networks = {slug + '-' + env + suffix for env in ('staging', 'production') for suffix in ('-db', '-app_default')}
    expected_volumes = {slug + '-' + env + '-postgres' for env in ('staging', 'production')}
    for resource, expected in (('network', expected_networks), ('volume', expected_volumes)):
        names = command('docker', resource, 'ls', '--format', '{{.Name}}').splitlines()
        for name in names:
            if name.startswith(slug + '-') and name not in expected:
                raise Error('Unmanifested possible project Docker resource: ' + name)
        for env in ('staging', 'production'):
            owned = command('docker', resource, 'ls', '--filter', 'label=' + LABEL + '=' + slug + '-' + env, '--format', '{{.Name}}').splitlines()
            if not set(owned) <= expected:
                raise Error('Unexpected labeled project Docker resource; inspect exact ownership.')
    for env in ('staging', 'production'):
        for name in (slug + '-' + env + '-db', slug + '-' + env + '-app_default'):
            listed = command('docker', 'network', 'ls', '--format', '{{.Name}}').splitlines()
            if name not in listed:
                continue
            item = json_command('docker', 'network', 'inspect', '--format', '{"id":{{json .Id}},"name":{{json .Name}},"labels":{{json .Labels}},"containers":{{json .Containers}}}', name)
            labels = item['labels'] or {}
            if (name.endswith('-db') and labels.get(LABEL) != slug + '-' + env
                    or name.endswith('_default') and labels.get('com.docker.compose.project') != slug + '-' + env + '-app'
                    or not set(item['containers']) <= selected_ids):
                raise Error('Foreign network ownership/attachments; preserve it.')
            networks.append({'id': item['id'], 'name': name, 'label': labels.get(LABEL), 'project': labels.get('com.docker.compose.project')})
        name = slug + '-' + env + '-postgres'
        if name in command('docker', 'volume', 'ls', '--format', '{{.Name}}').splitlines():
            item = json_command('docker', 'volume', 'inspect', '--format', '{"name":{{json .Name}},"driver":{{json .Driver}},"labels":{{json .Labels}},"options":{{json .Options}},"mountpoint":{{json .Mountpoint}},"created_at":{{json .CreatedAt}}}', name)
            mountpoint = Path('/var/lib/docker/volumes/' + name + '/_data')
            if ((item['labels'] or {}).get(LABEL) != slug + '-' + env or item['driver'] != 'local' or item['options'] not in (None, {})
                    or item['mountpoint'] != str(mountpoint) or mountpoint.is_symlink()
                    or any(parent.is_symlink() for parent in mountpoint.parents)
                    or any(c['id'] not in selected_ids and any(m.get('Name') == name for m in c['mounts']) for c in all_containers)):
                raise Error('Foreign volume ownership, mountpoint or consumer; preserve it.')
            require_unmounted_tree(mountpoint)
            volumes.append({'name': name, 'label': slug + '-' + env, 'mountpoint': str(mountpoint), 'created_at': item['created_at']})
    # Only exact target GHCR references are candidates; unrelated/shared image IDs are never pruned.
    images = []
    rows = command('docker', 'image', 'ls', '--digests', '--no-trunc', '--format', '{{.Repository}} {{.Tag}} {{.Digest}}').splitlines()
    references = []
    for row in rows:
        repository, tag, image_digest = row.split()
        if tag != '<none>':
            references.append(repository + ':' + tag)
        if image_digest != '<none>':
            references.append(repository + '@' + image_digest)
    for ref in sorted(set(references)):
        if not any(re.fullmatch(re.escape('ghcr.io/' + value['repository'].lower() + '-' + component) + r'(?:@sha256:[0-9a-f]{64}|:[A-Za-z0-9_.-]+)', ref) for component in ('frontend', 'backend')):
            continue
        item = json_command('docker', 'image', 'inspect', '--format', '{"id":{{json .Id}},"labels":{{json .Config.Labels}}}', ref)
        if (item['labels'] or {}).get('org.opencontainers.image.source') != 'https://github.com/' + value['repository']:
            raise Error('Target package image has foreign OCI provenance.')
        if any(c['image'] == item['id'] and c['id'] not in selected_ids for c in all_containers):
            raise Error('Target image is used by another project; resolve ownership before deletion.')
        images.append({'reference': ref, 'id': item['id']})
    return {'containers': containers, 'networks': networks, 'volumes': volumes, 'images': images,
            'preserved_containers': sorted(c['id'] for c in all_containers if c['id'] not in selected_ids)}


def configuration(value):
    root = Path('/etc/web-app-deploy') / value['slug']
    if not root.exists():
        return
    metadata(root)
    controller = json.loads((root / 'controller.json').read_text(), object_pairs_hook=unique)
    runtime = json.loads((root / 'runtime.json').read_text(), object_pairs_hook=unique)
    if (controller.get('repository_id') != value['repository_id'] or controller.get('repository') != value['repository']
            or runtime.get('slug') != value['slug'] or runtime.get('repository') != value['repository']
            or runtime.get('settings') != str(root) or runtime.get('state') != '/var/lib/web-app-deploy/' + value['slug']):
        raise Error('Installed deployment numeric/path identity differs.')
    for env in ('staging', 'production'):
        if runtime.get('environments', {}).get(env) != {'hostname': value['hostnames'][env], 'frontend_port': value['ports'][env]['frontend'], 'backend_port': value['ports'][env]['backend']}:
            raise Error('Installed hostname/port identity differs.')
    preparation = Path(runtime['state']) / 'preparation.json'
    if preparation.exists():
        item = json.loads(preparation.read_text(), object_pairs_hook=unique)
        expected = {env: {'network': value['slug'] + '-' + env + '-db', 'volume': value['slug'] + '-' + env + '-postgres'} for env in ('staging', 'production')}
        if item.get('state') != 'prepared' or item.get('resources') != expected:
            raise Error('Preparation is incomplete or database ownership receipt differs.')


def ci_configuration():
    path = Path('/etc/web-app-ci/config.json')
    metadata(path)
    value = json.loads(path.read_text(), object_pairs_hook=unique)
    if not isinstance(value.get('projects'), dict):
        raise Error('Invalid shared CI project mapping.')
    return {'configuration_sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'projects': value['projects'],
            'preserved_settings_sha256': digest({key: item for key, item in value.items() if key != 'projects'})}


def host_identity():
    fingerprint = command('ssh-keygen', '-lf', '/etc/ssh/ssh_host_ed25519_key.pub').split()[1]
    return {'machine_id_sha256': hashlib.sha256(Path('/etc/machine-id').read_bytes()).hexdigest(), 'ssh_fingerprint': fingerprint}


def inspect(value, extras):
    configuration(value)
    unknown_paths(value, extras)
    resource_paths = fixed_paths(value) + extra_paths(value, extras)
    resources = [metadata(path, owner=owner, recursive=not path.startswith('/var/lib/web-app-deploy/')) for path, owner in resource_paths]
    states = {}
    for name in units(value) + ['web-app-ci-controller.service']:
        state = command('systemctl', 'show', name, '--property=ActiveState,UnitFileState,FragmentPath,DropInPaths,LoadState')
        states[name] = dict(line.split('=', 1) for line in state.splitlines() if '=' in line)
        if name in units(value) and states[name].get('DropInPaths'):
            raise Error('Project unit has unreviewed drop-ins.')
    return {'identity': host_identity(), 'tool': canonical(), 'files': resources, 'docker': docker(value), 'units': states, 'ci': ci_configuration()}


def context(value):
    return make_directory('/root/' + value['slug'] + '-deletion')


def check_plan(selected):
    identity(selected['identity'])
    if selected['host']['identity'] != host_identity() or selected['host']['tool'] != canonical():
        raise Error('Operator host identity or reviewed canonical deletion source changed.')
    if selected['identity']['ci_source'] != str(ROOT):
        raise Error('Canonical checkout path differs from the historical CI_SOURCE.')


def unit_inactive(name):
    properties = command('systemctl', 'show', name, '--property=ActiveState,UnitFileState')
    fields = dict(line.split('=', 1) for line in properties.splitlines() if '=' in line)
    return fields.get('ActiveState') in {'inactive', 'failed'} and fields.get('UnitFileState') not in {'enabled', 'enabled-runtime'}


def take_lock(path, stack):
    if not path.parent.exists():
        return
    if path.is_symlink():
        raise Error('Unsafe environment/controller lock.')
    if path.exists():
        metadata(path)
    stream = stack.enter_context(path.open('a'))
    try:
        fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise Error('A deployment, provision, backup or controller still owns its lock.') from None


def environment_locks(value, stack):
    root = Path('/var/lib/web-app-deploy') / value['slug']
    for env in ('staging', 'production'):
        take_lock(root / env / 'environment.lock', stack)


def settled(value):
    state = Path('/var/lib/web-app-deploy') / value['slug']
    for env in ('staging', 'production'):
        transaction = state / env / 'transaction.json'
        if transaction.exists():
            record = json.loads(transaction.read_text(), object_pairs_hook=unique)
            if record.get('state') not in {'success', 'backup-failed'}:
                raise Error('Unresolved release transaction blocks destructive cleanup.')
        for intent in (state / env).glob('provision-*.json'):
            if json.loads(intent.read_text(), object_pairs_hook=unique).get('state') != 'success':
                raise Error('Unresolved account provisioning intent blocks cleanup.')
    recovery = Path('/root/recovery-' + value['slug'] + '-initial')
    for intent in recovery.glob('restore-*.json'):
        if json.loads(intent.read_text(), object_pairs_hook=unique).get('state') != 'success':
            raise Error('Unresolved isolated restore intent blocks cleanup.')
    for request in (state / 'requests').glob('*.json'):
        record = json.loads(request.read_text(), object_pairs_hook=unique)
        if record.get('state') in {'started', 'validating'}:
            raise Error('Unresolved deployment request blocks cleanup.')


def quiesce(directory, selected):
    value = selected['identity']
    configuration(value)
    current = inspect(value, selected['extras'])
    if current['files'] != selected['host']['files'] or current['docker'] != selected['host']['docker'] or current['ci'] != selected['host']['ci']:
        raise Error('Host plan predecessor changed before quiescence; inspect a new protected plan without resetting this journal.')
    # Disable future scheduled admission without interrupting an active backup.
    timer = units(value)[2]
    operation(directory, selected, 'stop-' + timer, timer,
              lambda: command('systemctl', 'disable', '--now', timer), lambda: unit_inactive(timer))
    with ExitStack() as stack:
        # Prove both environments idle BEFORE stopping any process that can mutate them.
        environment_locks(value, stack)
        settled(value)
        for name in units(value)[:2]:
            operation(directory, selected, 'stop-' + name, name,
                      lambda name=name: command('systemctl', 'disable', '--now', name), lambda name=name: unit_inactive(name))
        take_lock(Path('/var/lib/web-app-deploy') / value['slug'] / 'controller.lock', stack)
        settled(value)
        sealed = inspect(value, selected['extras'])
        # Runtime records change while active; seal only after admission shutdown and held idle locks.
        sealed['files'] = [metadata(item['path'], owner=item.get('owner', 0)) for item in sealed['files']]
        write(directory / 'quiesced.json', {'plan_sha256': digest(selected), 'host': sealed})


def removed(path):
    path = Path(path)
    if any(parent.is_symlink() for parent in path.parents):
        raise Error('Resource ancestor became a symlink; absence is unverified.')
    return not path.exists() and not path.is_symlink()


def remove_path(directory, selected, target):
    path = Path(target['path'])
    def execute():
        current = metadata(path, owner=target.get('owner', 0))
        if current != target:
            # A crash during recursive deletion can leave only a strict subset of the original inodes.
            expected = {entry['path']: entry for entry in target.get('entries', [])}
            if not current.get('entries') or any(expected.get(entry['path']) != entry for entry in current['entries']):
                raise Error('Filesystem predecessor changed; preserve the replacement.')
        require_unmounted_tree(path)
        if path.is_dir():
            if not shutil.rmtree.avoids_symlink_attacks:
                raise Error('This platform lacks symlink-safe recursive removal.')
            shutil.rmtree(path)
        else:
            path.unlink()
        sync_dir(path.parent)
    operation(directory, selected, 'path-' + digest(str(path)), target, execute, lambda: removed(path))



def remove_docker_resource(kind, item):
    if kind == 'volume':
        require_unmounted_tree(item['mountpoint'])
    command('docker', kind, 'rm', item.get('id', item['name']))


def purge(directory, selected):
    quiesced = read(directory / 'quiesced.json')
    if quiesced.get('plan_sha256') != digest(selected):
        raise Error('Require the exact quiesced host receipt.')
    value, sealed = selected['identity'], quiesced['host']
    if any(not unit_inactive(name) for name in units(value)):
        raise Error('Project units must remain stopped and disabled.')
    with ExitStack() as stack:
        environment_locks(value, stack)
        take_lock(Path('/var/lib/web-app-deploy') / value['slug'] / 'controller.lock', stack)
        settled(value)
        current = docker(value)
        for item in sealed['docker']['containers']:
            def absent(item=item):
                now = docker(value)['containers']
                same = [entry for entry in now if entry['name'] == item['name'] or entry['id'] == item['id']]
                if same and same != [item]:
                    raise Error('Container name/ID predecessor changed.')
                return not same
            operation(directory, selected, 'container-' + item['id'], item,
                      lambda item=item: command('docker', 'rm', '--force', item['id']), absent)
        for kind, cli in (('networks', 'network'), ('volumes', 'volume')):
            for item in sealed['docker'][kind]:
                def absent(item=item, kind=kind):
                    same = [entry for entry in docker(value)[kind] if entry['name'] == item['name']]
                    if same and same != [item]:
                        raise Error('Docker resource predecessor changed.')
                    return not same
                operation(directory, selected, cli + '-' + item['name'], item,
                          lambda item=item, cli=cli: remove_docker_resource(cli, item), absent)
        for item in sealed['docker']['images']:
            def absent(item=item):
                matches = [entry for entry in docker(value)['images'] if entry['reference'] == item['reference']]
                if matches and matches != [item]:
                    raise Error('Image reference predecessor changed.')
                return not matches
            operation(directory, selected, 'image-' + digest(item['reference']), item,
                      lambda item=item: command('docker', 'image', 'rm', item['reference']), absent)
        site = '/etc/caddy/sites/' + value['slug'] + '.caddy'
        target = next(item for item in sealed['files'] if item['path'] == site)
        remove_path(directory, selected, target)
        # Even a resumed removal revalidates and reloads before deleting any key/database settings.
        command('caddy', 'validate', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile')
        command('systemctl', 'reload', 'caddy')
        for name in units(value):
            for directory_path in (Path('/etc/systemd/system/multi-user.target.wants'), Path('/etc/systemd/system/timers.target.wants')):
                link = directory_path / name
                if link.is_symlink():
                    if link.resolve() != Path('/etc/systemd/system') / name:
                        raise Error('Unexpected unit enablement symlink target.')
                    link.unlink()
        # Remove mutable state last among files; journal lives outside this project tree.
        for item in sorted(sealed['files'], key=lambda item: item['path'].startswith('/var/lib/web-app-deploy/')):
            if item['path'] != site:
                remove_path(directory, selected, item)
        command('systemctl', 'daemon-reload')
        command('systemctl', 'reset-failed', *units(value), check=False)
    verify_host(selected, include_ci=False)
    write(directory / 'host-purged.json', {'plan_sha256': digest(selected), 'verified': True})


def ci_manage():
    # canonical() has already checked the clean root-controlled source checkout;
    # the drain helper also checks the installed/controller/unit byte identity.
    path = ROOT / 'infrastructure/ci/manage.py'
    spec = importlib.util.spec_from_file_location('project_deletion_ci_manage', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def unregister(directory, selected):
    if read(directory / 'host-purged.json') != {'plan_sha256': digest(selected), 'verified': True}:
        raise Error('Host purge receipt required before CI deregistration.')
    value = selected['identity']
    receipt_path = directory / 'ci-removed.json'
    if receipt_path.exists():
        receipt = read(receipt_path)
        if receipt.get('plan_sha256') != digest(selected):
            raise Error('CI receipt identity differs.')
        return receipt
    predecessor_path = directory / 'ci-predecessor.json'
    manage = ROOT / 'infrastructure/ci/manage.py'
    if predecessor_path.exists():
        predecessor = read(predecessor_path)
    else:
        observation = json_command('python3', '-B', manage, 'inspect')
        digest_before = observation.get('configuration_sha256')
        if not isinstance(digest_before, str) or not re.fullmatch('[0-9a-f]{64}', digest_before):
            raise Error('Shared CI configuration cannot be observed.')
        predecessor = {'configuration_sha256': digest_before,
                       'was_enabled': selected['host']['units']['web-app-ci-controller.service'].get('UnitFileState') in {'enabled', 'enabled-runtime'}}
        write(predecessor_path, predecessor)
    if (set(predecessor) != {'configuration_sha256', 'was_enabled'}
            or type(predecessor['was_enabled']) is not bool
            or not isinstance(predecessor['configuration_sha256'], str)
            or not re.fullmatch('[0-9a-f]{64}', predecessor['configuration_sha256'])):
        raise Error('Protected CI predecessor identity is invalid.')
    # Preserve activation intent from before the first attempt, never from an
    # already-disabled retry. The barrier blocks admission before config writes;
    # an uncertain frozen recovery record fails here before unregister can run.
    lifecycle = ci_manage()
    barrier = drain_and_stop(lifecycle, lifecycle.ctl.load_config(),
                             recovery_path=directory / 'ci-drain-recovery.json')
    if not isinstance(barrier, dict) or barrier.get('stopped') is not True:
        raise Error('Shared CI admission barrier did not establish a stopped dispatcher.')
    project = directory / 'ci-project.json'
    if not project.exists():
        write(project, {'slug': value['slug'], 'repository': value['repository']})
    result = json_command('python3', '-B', manage, 'unregister', '--project', project,
                          '--expected-config-sha256', predecessor['configuration_sha256'], '--journal', directory / 'ci-unregister.json')
    if result.get('repository') != value['repository'] or result.get('removed') != value['slug']:
        raise Error('CI unregister result identity differs.')
    if result.get('full_validation_required'):
        command('python3', '-B', '/usr/local/lib/web-app-ci/controller.py', 'validate', timeout=3600)
        if predecessor['was_enabled']:
            command('systemctl', 'enable', '--now', 'web-app-ci-controller.service')
    elif result.get('empty_pool') is not True:
        raise Error('Unrecognized CI validation requirement.')
    receipt = {'plan_sha256': digest(selected), 'configuration_sha256': result['configuration_sha256'],
               'verified': True, 'empty_pool': result['empty_pool'], 'reactivated': bool(predecessor['was_enabled'] and not result['empty_pool'])}
    write(receipt_path, receipt)
    return receipt


def verify_host(selected, *, include_ci=True):
    value = selected['identity']
    unknown_paths(value, selected['extras'])
    for path, _ in fixed_paths(value) + extra_paths(value, selected['extras']):
        if not removed(path):
            raise Error('Project host path remains: ' + path)
    remaining = docker(value)
    if any(remaining[key] for key in ('containers', 'networks', 'volumes', 'images')):
        raise Error('Project Docker resources remain.')
    if not set(selected['host']['docker']['preserved_containers']) <= set(remaining['preserved_containers']):
        raise Error('A preserved neighboring container disappeared.')
    for ports in value['ports'].values():
        for port in ports.values():
            with socket.socket() as probe:
                try:
                    probe.bind(('127.0.0.1', port))
                except OSError:
                    raise Error('Project loopback port remains occupied.') from None
    command('caddy', 'validate', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile')
    if include_ci:
        current_ci = ci_configuration()
        expected = {key: item for key, item in selected['host']['ci']['projects'].items() if key != value['slug']}
        if current_ci['projects'] != expected or current_ci['preserved_settings_sha256'] != selected['host']['ci']['preserved_settings_sha256']:
            raise Error('CI registration or preserved shared settings differ.')
        receipt_path = Path('/root/' + value['slug'] + '-deletion/ci-removed.json')
        if receipt_path.exists():
            receipt = read(receipt_path)
            if receipt.get('plan_sha256') != digest(selected) or receipt.get('verified') is not True or receipt.get('configuration_sha256') != current_ci['configuration_sha256']:
                raise Error('Current CI removal/validation receipt differs.')
        reactivated = bool(expected) and selected['host']['units']['web-app-ci-controller.service'].get('UnitFileState') in {'enabled', 'enabled-runtime'}
        if reactivated and command('systemctl', 'is-active', 'web-app-ci-controller.service') != 'active':
            raise Error('Previously enabled shared CI has not reactivated.')


def dispatch(request):
    if set(request) != {'schema_version', 'action', 'identity', 'extras', 'plan'} or request['schema_version'] != 1:
        raise Error('Unsupported operator deletion request.')
    value = identity(request['identity'])
    canonical()
    if value['ci_source'] != str(ROOT):
        raise Error('Require the historical canonical source path.')
    if request['action'] == 'inspect':
        return inspect(value, request['extras'])
    selected = request['plan']
    if selected['identity'] != value or selected['extras'] != request['extras']:
        raise Error('Operator request identity differs from the sealed plan.')
    check_plan(selected)
    existing = Path('/root/' + value['slug'] + '-deletion')
    if request['action'] == 'cleanup-context' and not existing.exists() and not existing.is_symlink():
        verify_host(selected)
        return {'plan_sha256': digest(selected), 'context_absent': True}
    directory = context(value)
    with locked(directory):
        plan_path = directory / 'plan.json'
        if plan_path.exists() and read(plan_path) != selected:
            raise Error('Existing operator deletion plan differs; never overwrite it.')
        if not plan_path.exists():
            write(plan_path, selected)
        action = request['action']
        if action == 'quiesce':
            if not (directory / 'quiesced.json').exists():
                quiesce(directory, selected)
        elif action == 'purge':
            purge(directory, selected)
        elif action == 'unregister':
            return unregister(directory, selected)
        elif action == 'verify':
            verify_host(selected)
            return {'plan_sha256': digest(selected), 'verified': True, 'host_identity': host_identity()}
        elif action == 'cleanup-context':
            verify_host(selected)
            # Final receipt is already local; remove only this exact root-owned context.
            target = metadata(directory)
            require_unmounted_tree(directory)
            shutil.rmtree(directory)
            sync_dir(directory.parent)
            return {'plan_sha256': digest(selected), 'context_absent': removed(directory)}
        else:
            raise Error('Unknown operator deletion action.')
    return {'plan_sha256': digest(selected), 'verified': True, 'action': request['action']}


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receive', action='store_true', help='Read one bounded private data-only request from stdin.')
    args = parser.parse_args()
    try:
        if not args.receive:
            raise Error('Use the numbered deletion guide, not direct host invocation.')
        raw = sys.stdin.read(MAX_INPUT + 1)
        if len(raw) > MAX_INPUT:
            raise Error('Operator request exceeds its bound.')
        result = dispatch(json.loads(raw, object_pairs_hook=unique))
        print(json.dumps(result, sort_keys=True))
    except (Error, OSError, ValueError, KeyError, TypeError) as error:
        message = str(error) if isinstance(error, Error) else 'Private state or resource response invalid; reconcile protected journal.'
        print('Operator deletion stopped: ' + message, file=sys.stderr)
        sys.exit(1)
