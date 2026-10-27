"""Shared implementations for explicit, numbered initialization operator steps.

Importing this module performs no provider, host or repository operation.
"""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import socket
import stat
import subprocess
import sys

from _shared import InitError, load_context, parser, read_state, require_consumer, run, update_state


def execute(arguments, *, cwd=None, input=None, timeout=120, display=False):
    """Capture subprocess diagnostics so credentials/data never leak on failure."""
    result = run(arguments, cwd=cwd, capture=True, check=False, timeout=timeout, input=input)
    if result.returncode:
        raise InitError('Command failed; inspect its private outcome before retrying: ' + Path(arguments[0]).name)
    if display:
        print(result.stdout, end='')
    return result.stdout.strip()


def context(args, *, operator=False, consumer=False):
    ctx = load_context(args, operator=operator)
    if ctx.scope != 'full':
        raise InitError('This step requires verified full initialization scope.')
    if consumer:
        require_consumer(ctx)
    return ctx


def observed_sha(value):
    if not isinstance(value, str) or not re.fullmatch('[0-9a-f]{40}', value):
        raise InitError('Require the exact observed 40-character source SHA.')
    return value


def positive(value, field='ID'):
    if type(value) is not int or value <= 0:
        raise InitError('Require the actual observed positive numeric ' + field + '.')
    return value


def gh_json(ctx, suffix):
    return json.loads(execute(['gh', 'api', 'repos/' + ctx.values['REPOSITORY'] + suffix]))


def protected_source(path):
    path = Path(path)
    for ancestor in (path, *path.parents):
        info = ancestor.lstat()
        if ancestor.is_symlink() or info.st_uid != 0 or info.st_mode & 0o022:
            raise InitError('Require root-controlled source and ancestors.')
    if execute(['git', '-C', str(path), 'status', '--porcelain']):
        raise InitError('Require a clean reviewed source checkout.')
    return path


def ci_source(ctx):
    source = protected_source(ctx.values['CI_SOURCE'])
    origin = execute(['git', '-C', str(source), 'remote', 'get-url', 'origin'])
    if origin not in ('git@github.com:vireocodedev/web-app-starter.git',
                       'https://github.com/vireocodedev/web-app-starter.git',
                       'https://github.com/vireocodedev/web-app-starter'):
        raise InitError('CI registration must use the canonical reviewed CI source.')
    return source


def registration_path(ctx):
    return Path('/root/project-registration-' + ctx.values['PROJECT_SLUG'] + '.json')


def prepare_registration(args):
    ctx = context(args, operator=True)
    ci_source(ctx)
    path = registration_path(ctx)
    os.umask(0o077)
    with path.open('x') as stream:
        json.dump({'slug': ctx.values['PROJECT_SLUG'], 'repository': ctx.values['REPOSITORY']}, stream)
        stream.write('\n')
    print('Created protected registration file: ' + str(path))


def stop_and_inspect_ci(args):
    ctx = context(args, operator=True)
    source = ci_source(ctx)
    execute(['systemctl', 'disable', '--now', 'web-app-ci-controller.service'], display=True)
    execute(['python3', '-B', str(source / 'infrastructure/ci/manage.py'), 'inspect'], display=True)
    print('Inspect all service/worker/job/recovery state; retain the observed configuration_sha256.')


def register_and_validate_ci(args):
    ctx = context(args, operator=True)
    source = ci_source(ctx)
    if not re.fullmatch('[0-9a-f]{64}', args.expected_config_sha256):
        raise InitError('Require the current observed configuration SHA-256 from step 11.2.')
    path = registration_path(ctx)
    info = path.lstat()
    if path.is_symlink() or info.st_uid != 0 or stat.S_IMODE(info.st_mode) & 0o077:
        raise InitError('Registration file must remain protected and root-owned.')
    if json.loads(path.read_text()) != {'slug': ctx.values['PROJECT_SLUG'], 'repository': ctx.values['REPOSITORY']}:
        raise InitError('Registration identity differs from verified project values.')
    execute(['python3', '-B', str(source / 'infrastructure/ci/manage.py'), 'register', '--project', str(path),
             '--expected-config-sha256', args.expected_config_sha256], timeout=900, display=True)
    execute(['python3', '-B', '/usr/local/lib/web-app-ci/controller.py', 'validate'], timeout=3600, display=True)
    update_state(ctx, ci_registered=True, ci_registration_predecessor_sha256=args.expected_config_sha256)


def activate_ci(args):
    ctx = context(args, operator=True)
    if not args.reviewed or not read_state(ctx).get('ci_registered'):
        raise InitError('First complete current CI validation and review its actual evidence.')
    execute(['systemctl', 'enable', '--now', 'web-app-ci-controller.service'], display=True)


def open_initialization_pr(args):
    ctx = context(args, consumer=True)
    repo = ctx.values['REPOSITORY']
    execute(['gh', 'pr', 'create', '--repo', repo, '--base', 'main', '--head', 'initialization/setup',
             '--title', 'Initialize project', '--body', 'Personalize the consumer and verify local setup.'],
            cwd=ctx.root, display=True)
    execute(['gh', 'pr', 'checks', 'initialization/setup', '--repo', repo, '--watch'],
            cwd=ctx.root, timeout=3600, display=True)


def prepare_release_branch(args):
    ctx = context(args, consumer=True)
    execute(['git', 'switch', 'main'], cwd=ctx.root, display=True)
    execute(['git', 'pull', '--ff-only'], cwd=ctx.root, display=True)
    if execute(['git', 'status', '--porcelain'], cwd=ctx.root):
        raise InitError('Preserve and reconcile uncommitted changes before selecting release source.')
    sha = observed_sha(execute(['git', 'rev-parse', 'HEAD'], cwd=ctx.root))
    branch = ctx.values['RELEASE_BRANCH']
    execute(['git', 'switch', '-c', branch, sha], cwd=ctx.root, display=True)
    execute(['git', 'push', '-u', 'origin', branch], cwd=ctx.root, display=True)
    update_state(ctx, source_sha=sha, release_branch=branch)
    print('Selected exact source SHA: ' + sha)


def inspect_dns(args):
    ctx = context(args)
    execute(['dig', '+short', 'NS', ctx.values['DNS_ZONE']], display=True)
    for key in ('STAGING_HOSTNAME', 'PRODUCTION_HOSTNAME'):
        print(key + ': ' + ctx.values[key])
        for kind in ('A', 'AAAA', 'CNAME'):
            print(kind + ': ' + execute(['dig', '+short', ctx.values[key], kind]))


def verify_dns(args):
    from _shared import dns_query
    ctx = context(args)
    servers = {value.rstrip('.').lower() for owner, kind, value in dns_query(ctx.values['DNS_ZONE'], 'NS')
               if owner == ctx.values['DNS_ZONE'] and kind == 'NS'}
    if not servers:
        raise InitError('No authoritative nameservers were observed.')
    expected = {ctx.values['OPERATOR_IPV4']}
    for key in ('STAGING_HOSTNAME', 'PRODUCTION_HOSTNAME'):
        hostname = ctx.values[key]
        for server in [*sorted(servers), '1.1.1.1', '8.8.8.8']:
            authoritative = server in servers
            answers = dns_query(hostname, 'A', server=server, authoritative=authoritative)
            if {data for owner, kind, data in answers if owner == hostname and kind == 'A'} != expected:
                raise InitError('Hostname A answer is absent/conflicting at an authoritative or recursive server: ' + hostname)
            for query in ('AAAA', 'CNAME'):
                if any(owner == hostname and kind in ('AAAA', 'CNAME') for owner, kind, _ in
                       dns_query(hostname, query, server=server, authoritative=authoritative)):
                    raise InitError('Reconcile conflicting AAAA/CNAME records: ' + hostname)
    update_state(ctx, dns_verified=True,
                 dns_hostnames=[ctx.values['STAGING_HOSTNAME'], ctx.values['PRODUCTION_HOSTNAME']])
    print('Both hostnames resolve to the verified operator IPv4 on every authoritative server and public resolvers.')


def observe_repository_ids(args):
    ctx = context(args, consumer=True)
    pinned = positive(read_state(ctx).get('repository_id'), 'verified repository ID from step 2.4')
    repo = gh_json(ctx, '')
    if repo.get('full_name', '').lower() != ctx.values['REPOSITORY'].lower() or repo.get('private') is not True:
        raise InitError('Expected the exact private consumer repository.')
    values = {'repository_id': positive(repo.get('id'), 'repository ID')}
    if values['repository_id'] != pinned:
        raise InitError('Repository ID differs from step 2.4; preserve progress and reconcile identity.')
    for environment in ('staging', 'production'):
        path = '.github/workflows/deploy-' + environment + '.yaml'
        workflow = gh_json(ctx, '/actions/workflows/deploy-' + environment + '.yaml')
        if workflow.get('path') != path:
            raise InitError('Deployment workflow path mismatch.')
        values[environment + '_workflow_id'] = positive(workflow.get('id'), 'workflow ID')
    update_state(ctx, **values)
    print(json.dumps(values, indent=2))


def prepare_release_source(args):
    ctx = context(args, operator=True)
    sha = observed_sha(args.source_sha)
    if read_state(ctx).get('source_sha') != sha:
        raise InitError('Source must match the exact release commit observed on the workstation.')
    destination = Path(ctx.values['RELEASE_SOURCE'])
    if destination.exists() or destination.is_symlink():
        raise InitError('Inspect the existing checkout before any reuse; this step requires a new destination.')
    # Validate ancestors before clone; never chown an unrelated directory tree.
    for path in (destination.parent, *destination.parent.parents):
        info = path.lstat()
        if path.is_symlink() or info.st_uid != 0 or info.st_mode & 0o022:
            raise InitError('Release source ancestors must be root-controlled.')
    os.umask(0o077)
    execute(['git', 'clone', 'git@github.com:' + ctx.values['REPOSITORY'] + '.git', str(destination)], timeout=300)
    execute(['git', '-C', str(destination), 'checkout', '--detach', sha])
    protected_source(destination)
    if execute(['git', '-C', str(destination), 'rev-parse', 'HEAD']) != sha:
        raise InitError('Release checkout differs from selected source.')
    update_state(ctx, release_source_sha=sha)
    print('Prepared root-controlled exact source checkout: ' + str(destination))


def project_collisions(ctx):
    """Inspect stopped containers and loaded/on-disk units before any install."""
    slug = ctx.values['PROJECT_SLUG']
    collisions = []
    for prefix in ('/etc/web-app-deploy', '/usr/local/lib/web-app-deploy', '/var/lib/web-app-deploy'):
        path = Path(prefix) / slug
        if path.exists() or path.is_symlink():
            collisions.append(str(path))
    site = Path('/etc/caddy/sites') / (slug + '.caddy')
    if site.exists() or site.is_symlink():
        collisions.append(str(site))
    units = {'web-app-deploy-' + slug + '.service', 'web-app-backup-' + slug + '.service',
             'web-app-backup-' + slug + '.timer'}
    for action in ('list-unit-files', 'list-units'):
        observed = execute(['systemctl', action, '--all', '--no-legend', '--no-pager', 'web-app-*'])
        for line in observed.splitlines():
            if any(unit in line.split() for unit in units):
                collisions.append(line.strip())
    for directory in ('/etc/systemd/system', '/run/systemd/system', '/usr/local/lib/systemd/system', '/usr/lib/systemd/system'):
        for unit in units:
            path = Path(directory) / unit
            if path.exists() or path.is_symlink():
                collisions.append(str(path))
    containers = execute(['docker', 'ps', '-a', '--format', '{{.Names}}']).splitlines()
    networks = execute(['docker', 'network', 'ls', '--format', '{{.Name}}']).splitlines()
    volumes = execute(['docker', 'volume', 'ls', '--format', '{{.Name}}']).splitlines()
    desired_ports = {int(ctx.values[key]) for key in
                     ('STAGING_FRONTEND_PORT', 'STAGING_BACKEND_PORT', 'PRODUCTION_FRONTEND_PORT', 'PRODUCTION_BACKEND_PORT')}
    for runtime in Path('/etc/web-app-deploy').glob('*/runtime.json'):
        config = json.loads(runtime.read_text())
        if any(settings[key] in desired_ports for settings in config['environments'].values()
               for key in ('frontend_port', 'backend_port')):
            collisions.append('configured-port-reservation:' + str(runtime))
    for environment in ('staging', 'production'):
        prefix = slug + '-' + environment
        for name in containers:
            if name == prefix + '-postgres' or name == prefix + '-app' or name.startswith(prefix + '-app-'):
                collisions.append('container:' + name)
        if prefix + '-db' in networks:
            collisions.append('network:' + prefix + '-db')
        if prefix + '-postgres' in volumes:
            collisions.append('volume:' + prefix + '-postgres')
    for key in ('STAGING_FRONTEND_PORT', 'STAGING_BACKEND_PORT', 'PRODUCTION_FRONTEND_PORT', 'PRODUCTION_BACKEND_PORT'):
        with socket.socket() as probe:
            try:
                probe.bind(('127.0.0.1', int(ctx.values[key])))
            except OSError:
                collisions.append('port:' + ctx.values[key])
    return collisions


def check_release_collisions(args):
    ctx = context(args, operator=True)
    collisions = project_collisions(ctx)
    if collisions:
        print('\n'.join(collisions))
        raise InitError('Existing/partial resources require explicit reconciliation; nothing was removed.')
    print('Project paths, loaded/on-disk units, stopped/running containers, networks, volumes and all four ports are clear.')


def ssh_arguments(ctx, arguments):
    """Quote each remote argument; never interpolate an unchecked remote shell path."""
    command = list(arguments)
    if not ctx.values['OPERATOR_SSH'].startswith('root@'):
        command = ['sudo', '-n', *command]
    return ['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
            ctx.values['OPERATOR_SSH'], shlex.join(command)]


def publish_certificate(args):
    ctx = context(args, consumer=True)
    path = '/etc/web-app-deploy/' + ctx.values['PROJECT_SLUG'] + '/controller.crt'
    certificate = execute(ssh_arguments(ctx, ['cat', path]))
    if not certificate.startswith('-----BEGIN CERTIFICATE-----') or not certificate.endswith('-----END CERTIFICATE-----'):
        raise InitError('The requested public certificate is invalid.')
    execute(['gh', 'variable', 'set', 'DEPLOY_CONTROLLER_CERT', '--repo', ctx.values['REPOSITORY']],
            input=certificate + '\n')
    print('Published only the public controller certificate to the consumer repository variable.')


def activate_controller(args):
    ctx = context(args, operator=True)
    if not args.reviewed:
        raise InitError('Review installed source/configuration/protected modes/units/DB/proxy before explicit activation.')
    execute(['systemctl', 'enable', '--now', 'web-app-deploy-' + ctx.values['PROJECT_SLUG'] + '.service'], display=True)


def inspect_packages(args):
    ctx = context(args, consumer=True)
    repository = ctx.values['REPOSITORY'].lower()
    owner, prefix = repository.split('/')
    unresolved = []
    for component in ('frontend', 'backend'):
        name = prefix + '-' + component
        result = run(['gh', 'api', 'orgs/' + owner + '/packages/container/' + name],
                     capture=True, check=False, timeout=120)
        if result.returncode:
            unresolved.append(name)
            continue
        package = json.loads(result.stdout)
        if (package.get('name') != name or package.get('visibility') != 'private'
                or package.get('package_type') != 'container'
                or package.get('repository', {}).get('full_name', '').lower() != repository):
            raise InitError('Preserve/reconcile conflicting or nonprivate package: ' + name)
        print('Existing private package belongs to this exact consumer: ' + name)
    if unresolved and not args.absence_confirmed:
        print('Unresolved package names: ' + ', '.join(unresolved))
        raise InitError('A forbidden/404 response is not absence. Confirm each name in organization inventory with sufficient access, then rerun with --absence-confirmed.')
    if unresolved:
        print('Operator explicitly confirmed absence and permission to create: ' + ', '.join(unresolved))
    update_state(ctx, package_preflight_at=datetime.now(timezone.utc).isoformat(),
                 package_absence_confirmed=bool(unresolved), package_preflight_repository=repository)


def require_packages(ctx):
    state = read_state(ctx)
    try:
        when = datetime.fromisoformat(state['package_preflight_at'])
    except (KeyError, ValueError, TypeError):
        raise InitError('Inspect both derived package names immediately before first publication.') from None
    if (state.get('package_preflight_repository') != ctx.values['REPOSITORY'].lower()
            or not 0 <= (datetime.now(timezone.utc) - when).total_seconds() <= 300):
        raise InitError('Repeat package inspection immediately before dispatch (within five minutes).')


def selected_source(ctx):
    state = read_state(ctx)
    sha = observed_sha(state.get('source_sha'))
    branch = ctx.values['RELEASE_BRANCH']
    execute(['git', 'fetch', 'origin', branch], cwd=ctx.root)
    if execute(['git', 'rev-parse', 'FETCH_HEAD'], cwd=ctx.root) != sha:
        raise InitError('Selected release branch moved; preserve the accepted exact source SHA.')
    return sha


def dispatch_identity(ctx, environment, state):
    identity = {'repository': ctx.values['REPOSITORY'].lower(),
                'source_sha': observed_sha(state.get('source_sha')),
                'branch': ctx.values['RELEASE_BRANCH'],
                'actor': ctx.values['MAINTAINER_LOGIN'].lower(),
                'workflow_id': positive(state.get(environment + '_workflow_id'), 'observed workflow ID')}
    if environment == 'production':
        identity.update(staging_run_id=positive(state.get('staging_run_id'), 'accepted staging run ID'),
                        staging_run_attempt=positive(state.get('staging_run_attempt'), 'accepted staging attempt'))
    return identity


def require_dispatch_resolved(ctx, environment):
    """An uncertain request is never a reason to dispatch it a second time."""
    state = read_state(ctx)
    previous = state.get(environment + '_dispatch_intent')
    if previous is None:
        return
    if not isinstance(previous, dict) or previous.get('repository') != ctx.values['REPOSITORY'].lower():
        raise InitError('Dispatch intent identity changed; preserve its original source/repository and reconcile the actual run.')
    if (previous.get('state') == 'completed'
            and previous.get('conclusion') in {'failure', 'cancelled', 'timed_out', 'action_required',
                                                'startup_failure', 'stale', 'neutral', 'skipped'}
            and previous.get('reconciled') is True):
        return
    expected = dispatch_identity(ctx, environment, state)
    if any(previous.get(key) != value for key, value in expected.items()):
        raise InitError('Dispatch intent identity changed; preserve its original source/repository and reconcile the actual run.')
    raise InitError('A dispatch already exists. Reconcile its actual matching run with --reconcile-only --run-id before any new dispatch; do not repeat an uncertain request.')


def begin_dispatch(ctx, environment):
    require_dispatch_resolved(ctx, environment)
    state = read_state(ctx)
    previous = state.get(environment + '_dispatch_intent')
    history = state.get(environment + '_dispatch_history', [])
    if not isinstance(history, list):
        raise InitError('Inspect the invalid dispatch history before continuing.')
    if previous:
        history = [*history, previous]
    intent = dict(dispatch_identity(ctx, environment, state), state='unresolved',
                  created_after=datetime.now(timezone.utc).replace(microsecond=0).isoformat())
    update_state(ctx, **{environment + '_dispatch_intent': intent,
                         environment + '_dispatch_history': history,
                         environment + '_dispatch_after': intent['created_after'],
                         environment + '_dispatch_sha': intent['source_sha']})


def recorded_dispatch(ctx, environment, state):
    intent = state.get(environment + '_dispatch_intent')
    identity = dispatch_identity(ctx, environment, state)
    if (not isinstance(intent, dict) or any(intent.get(key) != value for key, value in identity.items())
            or state.get(environment + '_dispatch_after') != intent.get('created_after')):
        raise InitError('Dispatch intent identity changed or is absent; preserve and reconcile its exact original request.')
    return intent


def record_dispatch_observation(ctx, environment, observed, *, reconciled=False):
    state = read_state(ctx)
    previous = recorded_dispatch(ctx, environment, state)
    if previous.get('run_id') not in (None, observed['id']):
        raise InitError('The recorded dispatch already belongs to another run; reconcile its exact recorded ID.')
    intent = dict(previous, state='completed' if observed.get('status') == 'completed' else 'observed',
                  run_id=observed['id'], run_attempt=observed['run_attempt'],
                  conclusion=observed.get('conclusion'), reconciled=reconciled)
    update_state(ctx, **{environment + '_dispatch_intent': intent})


def reconcile_dispatch(ctx, environment, run_id):
    observed = observe_run(ctx, environment, run_id)
    record_dispatch_observation(ctx, environment, observed, reconciled=True)
    print('Reconciled exact dispatch run/attempt without dispatching: ' + str(run_id) + '/' + str(observed['run_attempt']))
    if observed.get('status') != 'completed':
        print('The actual run is still active; redispatch remains blocked.')
    elif observed.get('conclusion') == 'success':
        print('The run succeeded; continue normal source/pair acceptance with this same run ID.')


def dispatch_staging(args):
    ctx = context(args, consumer=True)
    require_dispatch_resolved(ctx, 'staging')
    require_packages(ctx)
    selected_source(ctx)
    # Persist selection before an uncertain dispatch; never infer the newest run.
    begin_dispatch(ctx, 'staging')
    execute(['gh', 'workflow', 'run', 'deploy-staging.yaml', '--repo', ctx.values['REPOSITORY'],
             '--ref', ctx.values['RELEASE_BRANCH']], display=True)
    execute(['gh', 'run', 'list', '--repo', ctx.values['REPOSITORY'], '--workflow', 'deploy-staging.yaml', '--limit', '10'], display=True)
    print('Select the actual matching dispatch run ID for step 15.3; newest is not necessarily yours.')


def observe_run(ctx, environment, run_id, *, completed=False):
    run_id = positive(run_id, 'workflow run ID')
    observed = gh_json(ctx, '/actions/runs/' + str(run_id))
    state = read_state(ctx)
    intent = recorded_dispatch(ctx, environment, state)
    expected_workflow = state.get(environment + '_workflow_id')
    created = datetime.fromisoformat(observed.get('created_at', '').replace('Z', '+00:00'))
    try:
        dispatched = datetime.fromisoformat(intent['created_after'])
    except (KeyError, TypeError, ValueError):
        raise InitError('No source-bound dispatch intent exists; inspect the actual workflow before resuming.') from None
    if (observed.get('id') != run_id or observed.get('repository', {}).get('full_name', '').lower() != ctx.values['REPOSITORY'].lower()
            or observed.get('head_sha') != state.get('source_sha')
            or observed.get('head_branch') != ctx.values['RELEASE_BRANCH']
            or observed.get('event') != 'workflow_dispatch'
            or observed.get('path') != '.github/workflows/deploy-' + environment + '.yaml'
            or observed.get('workflow_id') != positive(expected_workflow, 'observed workflow ID')
            or observed.get('actor', {}).get('login', '').lower() != ctx.values['MAINTAINER_LOGIN'].lower()
            or intent.get('run_id') not in (None, run_id)
            or created < dispatched):
        raise InitError('Run repository/source/branch/actor/workflow/dispatch identity mismatch.')
    if completed and (observed.get('status') != 'completed' or observed.get('conclusion') != 'success'):
        raise InitError('The complete exact workflow run has not succeeded.')
    positive(observed.get('run_attempt'), 'workflow attempt')
    return observed


def watch_release(ctx, environment, run_id):
    before = observe_run(ctx, environment, run_id)
    print('Watching exact run/attempt: ' + str(run_id) + '/' + str(before['run_attempt']))
    execute(['gh', 'run', 'watch', str(run_id), '--repo', ctx.values['REPOSITORY'], '--exit-status'],
            timeout=7200, display=True)
    observed = observe_run(ctx, environment, run_id, completed=True)
    if observed['run_attempt'] != before['run_attempt']:
        raise InitError('Workflow attempt changed during observation; inspect and explicitly select it again.')
    record_dispatch_observation(ctx, environment, observed)
    update_state(ctx, **{environment + '_run_id': run_id, environment + '_run_attempt': observed['run_attempt'],
                         environment + '_source_sha': observed['head_sha'], environment + '_run_url': observed['html_url']})
    return observed


def watch_staging(args):
    ctx = context(args, consumer=True)
    if args.reconcile_only:
        reconcile_dispatch(ctx, 'staging', args.run_id)
        return
    observed = watch_release(ctx, 'staging', args.run_id)
    # Use the canonical bounded artifact verifier; never trust arbitrary zip members.
    sys.path.insert(0, str(ctx.root / 'infrastructure/release'))
    from protocol import GitHub, decode, pair
    token = execute(['gh', 'auth', 'token'])
    raw = GitHub(token).artifact(ctx.values['REPOSITORY'], args.run_id,
                                'release-pair-' + str(observed['run_attempt']), 'release-pair.json')
    accepted = pair(decode(raw), ctx.values['REPOSITORY'], observed['head_sha'])
    update_state(ctx, staging_pair=accepted)
    print('Recorded both immutable digests for the exact staging source and workflow attempt.')


def public_health(ctx, environment):
    hostname = ctx.values['STAGING_HOSTNAME' if environment == 'staging' else 'PRODUCTION_HOSTNAME']
    origin = 'https://' + hostname
    headers = execute(['curl', '--fail', '--silent', '--show-error', '--max-time', '30', '--head', origin + '/'])
    if not any(line.lower().strip() == 'x-vireo-environment: ' + environment for line in headers.splitlines()):
        raise InitError('Public response environment marker mismatch.')
    health = json.loads(execute(['curl', '--fail', '--silent', '--show-error', '--max-time', '30', origin + '/api/actuator/health']))
    if health.get('status') != 'UP':
        raise InitError('Public backend health is not UP.')
    execute(['curl', '--fail', '--silent', '--show-error', '--max-time', '30', '--output', '/dev/null', origin + '/login'])
    print('Verified public TLS, environment marker, /login and backend health: ' + environment)


def verify_staging(args):
    ctx = context(args)
    public_health(ctx, 'staging')


def promote_production(args):
    ctx = context(args, consumer=True)
    require_dispatch_resolved(ctx, 'production')
    state = read_state(ctx)
    run_id = positive(state.get('staging_run_id'), 'accepted staging run ID')
    observed = observe_run(ctx, 'staging', run_id, completed=True)
    if observed['run_attempt'] != state.get('staging_run_attempt') or state.get('staging_pair', {}).get('source_sha') != selected_source(ctx):
        raise InitError('Reconcile staging attempt/pair/source before promotion.')
    begin_dispatch(ctx, 'production')
    execute(['gh', 'workflow', 'run', 'deploy-production.yaml', '--repo', ctx.values['REPOSITORY'],
             '--ref', ctx.values['RELEASE_BRANCH'], '-f', 'staging_run_id=' + str(run_id)], display=True)
    execute(['gh', 'run', 'list', '--repo', ctx.values['REPOSITORY'], '--workflow', 'deploy-production.yaml', '--limit', '10'], display=True)


def watch_production(args):
    ctx = context(args, consumer=True)
    if args.reconcile_only:
        reconcile_dispatch(ctx, 'production', args.run_id)
        return
    watch_release(ctx, 'production', args.run_id)
    public_health(ctx, 'production')


def create_initialized_backup(args):
    ctx = context(args, operator=True)
    slug = ctx.values['PROJECT_SLUG']
    execute(['python3', '-B', '/usr/local/lib/web-app-deploy/' + slug + '/runtime.py', 'backup',
             '--config', '/etc/web-app-deploy/' + slug + '/runtime.json'], timeout=900, display=True)
    print('Use the exact finalized .dump path and its adjacent metadata in step 18.2; never a .partial.')


def verify_backup(directory):
    root = Path(directory)
    for path in (root, root / 'production.dump', root / 'production.dump.json'):
        info = path.lstat()
        if path.is_symlink() or info.st_uid != os.geteuid() or stat.S_IMODE(info.st_mode) & 0o077:
            raise InitError('Recovery copy must remain private and owned by the current operator.')
    archive = root / 'production.dump'
    metadata = json.loads((root / 'production.dump.json').read_text())
    with archive.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if (metadata.get('initialized') is not True or type(metadata.get('users')) is not int or metadata['users'] <= 0
            or metadata.get('bytes') != archive.stat().st_size or metadata.get('sha256') != digest):
        raise InitError('Retrieved initialized backup size/digest/user metadata mismatch.')
    return digest


def recovery_copy(ctx):
    path = Path.home() / '.local/share' / ctx.values['PROJECT_SLUG'] / 'recovery-initial'
    if path.resolve().is_relative_to(ctx.root.resolve()):
        raise InitError('Recovery storage must be outside the Git checkout.')
    return path


def retrieve_file(ctx, remote, destination):
    with destination.open('xb') as stream:
        result = subprocess.run(ssh_arguments(ctx, ['cat', str(remote)]), stdout=stream,
                                stderr=subprocess.PIPE, timeout=900)
    if result.returncode:
        raise InitError('Retrieval failed; retain the partial private copy and inspect before retrying.')


def retrieve_backup(args):
    ctx = context(args)
    path = Path(args.remote_dump)
    expected = Path('/var/lib/web-app-deploy') / ctx.values['PROJECT_SLUG'] / 'production/backups'
    if path.parent != expected or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*\.dump', path.name):
        raise InitError('Require the exact finalized .dump inside this project production backups directory.')
    directory = recovery_copy(ctx)
    os.umask(0o077)
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    if directory.is_symlink() or stat.S_IMODE(directory.stat().st_mode) & 0o077:
        raise InitError('Require private recovery storage; inspect an existing directory before use.')
    retrieve_file(ctx, path, directory / 'production.dump')
    retrieve_file(ctx, Path(str(path) + '.json'), directory / 'production.dump.json')
    digest = verify_backup(directory)
    update_state(ctx, backup_remote_dump=str(path), retrieved_backup_sha256=digest)
    print('Retrieved initialized backup checksum matches metadata in private storage; check expected user count privately.')


def transfer_recovery_copy(args):
    ctx = context(args)
    directory = recovery_copy(ctx)
    digest = verify_backup(directory)
    if read_state(ctx).get('retrieved_backup_sha256') != digest:
        raise InitError('Retrieve and verify this exact copy first.')
    destination = '/root/recovery-' + ctx.values['PROJECT_SLUG'] + '-initial'
    execute(ssh_arguments(ctx, ['mkdir', '-m', '700', destination]))
    for name in ('production.dump', 'production.dump.json'):
        # The remote directory was created exclusively above. Noclobber prevents
        # replacement even if a response is lost; quote the entire fixed path.
        command = 'umask 077; set -C; cat > ' + shlex.quote(destination + '/' + name)
        arguments = ssh_arguments(ctx, ['sh', '-c', command])
        with (directory / name).open('rb') as stream:
            result = subprocess.run(arguments, stdin=stream, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=900)
        if result.returncode:
            raise InitError('Transfer failed; preserve the new remote recovery directory and inspect exact files.')
    print('Transferred the checksum-verified retrieved copy to: ' + destination)


def enable_backup_schedule(args):
    ctx = context(args, operator=True)
    state = read_state(ctx)
    if (not args.reviewed or state.get('retrieved_copy_restored') is not True
            or not state.get('restored_backup_sha256')
            or state.get('restored_backup_sha256') != state.get('retrieved_backup_sha256')):
        raise InitError('Require retrieved-copy restore evidence and the deliberate same-server risk/schedule decision first.')
    unit = 'web-app-backup-' + ctx.values['PROJECT_SLUG'] + '.timer'
    execute(['systemctl', 'enable', '--now', unit], display=True)
    execute(['systemctl', 'list-timers', unit, '--no-pager'], display=True)
    print('Inspect 03:00 Europe/Zagreb, persistence and 30-day retention. A future scheduled execution is still pending.')


def cli(action):
    arguments = parser('Explicit initialization step: ' + action.replace('_', ' ') + '.')
    if action == 'register_and_validate_ci':
        arguments.add_argument('--expected-config-sha256', required=True)
    if action in ('activate_ci', 'activate_controller', 'enable_backup_schedule'):
        arguments.add_argument('--reviewed', action='store_true', help='Confirm the existing guide review/acceptance gate was completed.')
    if action == 'prepare_release_source':
        arguments.add_argument('--source-sha', required=True, help='Exact observed release commit from step 12.2.')
    if action == 'inspect_packages':
        arguments.add_argument('--absence-confirmed', action='store_true',
                               help='Operator confirmed unresolved names are absent and may be created in organization package inventory.')
    if action in ('watch_staging', 'watch_production'):
        arguments.add_argument('--run-id', type=int, required=True, help='Actual selected matching workflow run; never inferred from newest.')
        arguments.add_argument('--reconcile-only', action='store_true',
                               help='Read and record the exact matching run after an uncertain dispatch, without dispatching or waiting.')
    if action == 'retrieve_backup':
        arguments.add_argument('--remote-dump', required=True, help='Exact observed finalized project production .dump path.')
    args = arguments.parse_args()
    try:
        globals()[action](args)
    except Exception as error:
        message = str(error) if isinstance(error, InitError) else 'Private operation failed; preserve evidence and inspect before retrying.'
        print('Initialization stopped: ' + message, file=sys.stderr)
        raise SystemExit(1) from None
