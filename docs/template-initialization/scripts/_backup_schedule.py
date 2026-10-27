"""Read-only checks of the installed production timer and reviewed backup source."""
import ast
import hashlib
import json
from pathlib import Path
import re
import shlex
import stat

from _shared import InitError

SETTINGS = Path('/etc/web-app-deploy')
CODE = Path('/usr/local/lib/web-app-deploy')
STATE = Path('/var/lib/web-app-deploy')
SYSTEMD = Path('/etc/systemd/system')


def private_json(path, digest):
    digest(path)  # Checks root ownership, regular-file type and protected ancestors.
    if stat.S_IMODE(path.lstat().st_mode) & 0o077:
        raise InitError('Backup installation metadata and configuration must remain root-only.')
    value = json.loads(path.read_text())
    if not isinstance(value, dict):
        raise InitError('Invalid protected backup installation metadata.')
    return value


def reviewed_pins(source):
    tree = ast.parse((source / 'infrastructure/release/controller.py').read_text())
    assignments = [node for node in tree.body if isinstance(node, ast.Assign)
                   and any(isinstance(target, ast.Name) and target.id == 'TRUSTED' for target in node.targets)]
    if len(assignments) != 1:
        raise InitError('Cannot establish the reviewed controller source-pin contract.')
    names = ast.literal_eval(assignments[0].value)
    if (not isinstance(names, tuple) or not names or len(names) != len(set(names))
            or any(not isinstance(name, str) or Path(name).is_absolute() or '..' in Path(name).parts for name in names)):
        raise InitError('Invalid reviewed controller source-pin contract.')
    return {name: hashlib.sha256((source / name).read_bytes()).hexdigest() for name in names}


def installed_policy(ctx, source, state, execute, digest):
    slug, repository = ctx.values['PROJECT_SLUG'], ctx.values['REPOSITORY']
    settings, code = SETTINGS / slug, CODE / slug
    source_sha = execute(['git', '-C', str(source), 'rev-parse', 'HEAD'])
    if (not re.fullmatch('[0-9a-f]{40}', source_sha) or state.get('release_source_sha') != source_sha
            or state.get('source_sha') != source_sha):
        raise InitError('Require the exact reviewed release source recorded by initialization.')
    origin = execute(['git', '-C', str(source), 'remote', 'get-url', 'origin'])
    if origin not in ('https://github.com/' + repository, 'https://github.com/' + repository + '.git',
                      'git@github.com:' + repository + '.git'):
        raise InitError('Reviewed release source belongs to another repository.')
    installation = private_json(settings / 'installation.json', digest)
    installed = {'controller.py': 'infrastructure/release/controller.py',
                 'runtime.py': 'infrastructure/release/runtime.py',
                 'protocol.py': 'infrastructure/release/protocol.py',
                 'github_app.py': 'infrastructure/ci/ci-runner/github_app.py'}
    if installation.get('source_sha') != source_sha or set(installation.get('files', {})) != set(installed):
        raise InitError('Backup installation receipt differs from reviewed source identity.')
    for name, relative in installed.items():
        expected = digest(source / relative)
        if installation['files'][name] != expected or digest(code / name) != expected:
            raise InitError('Installed backup source differs from its protected receipt or reviewed source.')
    controller = private_json(settings / 'controller.json', digest)
    if (any(type(state.get(environment + '_workflow_id')) is not int or state[environment + '_workflow_id'] <= 0
            for environment in ('staging', 'production')) or controller.get('repository') != repository or controller.get('repository_id') != state.get('repository_id')
            or type(controller.get('repository_id')) is not int or controller['repository_id'] <= 0
            or controller.get('workflow_ids') != {'staging': state.get('staging_workflow_id'),
                                                  'production': state.get('production_workflow_id')}
            or controller.get('trusted_sha256') != reviewed_pins(source)
            or controller.get('runtime_config') != str(settings / 'runtime.json')
            or controller.get('state') != str(STATE / slug)):
        raise InitError('Installed backup controller identity, paths or reviewed source pins differ.')
    runtime_path = settings / 'runtime.json'
    runtime = private_json(runtime_path, digest)
    expected = {'slug': slug, 'repository': repository, 'state': str(STATE / slug), 'settings': str(settings),
                'environments': {}}
    for environment in ('staging', 'production'):
        prefix = environment.upper()
        expected['environments'][environment] = {
            'hostname': ctx.values[prefix + '_HOSTNAME'],
            'frontend_port': int(ctx.values[prefix + '_FRONTEND_PORT']),
            'backend_port': int(ctx.values[prefix + '_BACKEND_PORT'])}
    if runtime != expected:
        raise InitError('Installed backup runtime differs from this project and its verified environment settings.')
    # Recognize the reviewed runtime's two 30-day pruning thresholds rather
    # than inventing a retention field in runtime.json or executing backup code.
    tree = ast.parse((source / 'infrastructure/release/runtime.py').read_text())
    functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'prune_backups']
    thresholds = [node for function in functions for node in ast.walk(function)
                  if isinstance(node, ast.Compare) and len(node.ops) == 1 and isinstance(node.ops[0], ast.LtE)]
    expected_threshold = ast.dump(ast.parse('30 * 86400', mode='eval').body)
    if len(functions) != 1 or len(thresholds) != 2 or any(
            ast.dump(node.comparators[0]) != expected_threshold for node in thresholds):
        raise InitError('Reviewed runtime retention policy changed; explicitly review the backup schedule contract.')
    return {'source_sha': source_sha, 'runtime_sha256': installation['files']['runtime.py'],
            'installation_sha256': digest(settings / 'installation.json'),
            'runtime_config_sha256': digest(runtime_path), 'retention_days': 30}


def show(execute, unit, field):
    return execute(['systemctl', 'show', unit, '--property=' + field, '--value'])


def inspect_units(ctx, execute, digest, *, active=False):
    slug = ctx.values['PROJECT_SLUG']
    timer, service = 'web-app-backup-' + slug + '.timer', 'web-app-backup-' + slug + '.service'
    for unit in (timer, service):
        fragment = SYSTEMD / unit
        digest(fragment)
        if (show(execute, unit, 'LoadState') != 'loaded' or show(execute, unit, 'FragmentPath') != str(fragment)
                or show(execute, unit, 'DropInPaths')):
            raise InitError('Backup unit source is missing, overridden or has unreviewed drop-ins.')
    calendar = show(execute, timer, 'TimersCalendar')
    if (not re.fullmatch(r'\{ OnCalendar=\*-\*-\* 03:00:00 Europe/Zagreb ; next_elapse=[^{};]+(?: ;)? \}', calendar)
            or show(execute, timer, 'TimersMonotonic') or show(execute, timer, 'Persistent') != 'yes'
            or show(execute, timer, 'Unit') != service
            or show(execute, timer, 'OnClockChange') != 'no' or show(execute, timer, 'OnTimezoneChange') != 'no'):
        raise InitError('Backup timer must schedule only daily 03:00 Europe/Zagreb with persistence and its exact production service.')
    expected = ['/usr/bin/python3', '-B', str(CODE / slug / 'runtime.py'), 'backup', '--config',
                str(SETTINGS / slug / 'runtime.json')]
    command = show(execute, service, 'ExecStart')
    match = re.fullmatch(r'\{ path=([^;{}]+) ; argv\[\]=([^;{}]+) ; ignore_errors=no ;[^{}]*\}', command)
    if (not match or match.group(1).strip() != expected[0] or shlex.split(match.group(2)) != expected
            or show(execute, service, 'User') != 'root' or show(execute, service, 'UMask') != '0077'
            or any(show(execute, service, field) for field in
                   ('ExecCondition', 'ExecStartPre', 'ExecStartPost', 'ExecStop', 'ExecStopPost', 'Environment', 'EnvironmentFiles'))):
        raise InitError('Backup service must execute only the exact installed project runtime with its protected configuration.')
    for suffix in ('-staging.timer', '.staging.timer'):
        other = 'web-app-backup-' + slug + suffix
        if show(execute, other, 'LoadState') != 'not-found':
            raise InitError('Staging must remain unscheduled; inspect the unexpected project staging backup timer.')
    result = {'timer': timer, 'schedule': '*-*-* 03:00:00 Europe/Zagreb', 'persistent': True,
              'service': service, 'staging_scheduled': False}
    if active:
        if show(execute, timer, 'ActiveState') != 'active' or show(execute, timer, 'UnitFileState') != 'enabled':
            raise InitError('Backup timer did not read back enabled and active; inspect actual state before retrying.')
        next_fire = show(execute, timer, 'NextElapseUSecRealtime')
        if not next_fire or next_fire in ('n/a', '0'):
            raise InitError('Active backup timer has no observed next firing time.')
        result.update(next_fire=next_fire, scheduled_execution_observed=False)
    return result
