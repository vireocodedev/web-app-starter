"""Private step 11.4 orchestration; retain fixed diagnostics and exact retry intent."""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import stat
import time
import uuid

from _shared import InitError, _write_json, private_file, read_state, run, update_state

BASE = Path('/var/lib/web-app-ci')
ROOT_UID = 0
ROOT_STAGES = frozenset(('initial-cleanup', 'baseline-privileges', 'first-job-prepare',
    'first-job-parent-limits', 'first-job-devices', 'first-job-notification',
    'host-gateway-positive', 'first-job-user-probes', 'first-job-container-cgroups',
    'first-job-namespace-checks', 'first-job-cleanup', 'second-job-prepare',
    'second-job-parent-limits', 'second-job-fresh-filesystem', 'second-job-docker',
    'second-job-cleanup'))
USER_STAGES = frozenset(('initialization', 'filesystem', 'toolchain', 'devices',
    'mapper-authorization', 'docker-info', 'public-egress', 'network-denials',
    'privileged-container', 'ryuk', 'testcontainers', 'bus-compatibility',
    'api-witnesses', 'abandoned-children', 'complete'))
LAST_CHECKS = frozenset(('bus-adapter-is-docker-scoped', 'rootless-child-pid-file-protected',
    'rootless-child-pid-valid', 'rootless-child-process-owned',
    'rootless-child-private-docker-cgroup', 'genuine-private-user-bus-positive',
    'mapped-private-bus-owner-positive', 'bus-adapter-genuine-passthrough',
    'bus-adapter-conflicting-environment-rejected', 'bus-adapter-outer-identity-rejected'))
DOCKER_RESULTS = frozenset(('success', 'exit-code', 'signal', 'core-dump', 'timeout',
    'resources', 'start-limit-hit', 'oom-kill', 'protocol'))


def sync_directory(path):
    descriptor = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def resume_command(ctx, expected=None):
    script = Path(ctx.values['CI_SOURCE']) / 'docs/template-initialization/scripts/11_4_register_and_validate_ci.py'
    arguments = ['python3', '-B', str(script), '--env', str(ctx.env_path)]
    if type(expected) is str and re.fullmatch('[0-9a-f]{64}', expected):
        arguments.extend(['--expected-config-sha256', expected])
    return shlex.join(arguments)


def failure_receipt(slot):
    path = (BASE if slot == 0 else BASE / 'slots' / str(slot)) / 'validation-failure.json'
    try:
        if not controlled_parents(path):
            return None
        descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(descriptor, 'rb') as stream:
            info = os.fstat(stream.fileno())
            if (not stat.S_ISREG(info.st_mode) or info.st_uid != ROOT_UID
                    or stat.S_IMODE(info.st_mode) != 0o600 or info.st_nlink != 1
                    or info.st_size > 65536):
                return None
            content = stream.read(65537)
        if len(content) > 65536:
            return None
        value = json.loads(content)
        if (type(value) is not dict or value.get('passed') is not False
                or type(value.get('recorded_at_epoch')) is not int):
            return None
        return value, (info.st_dev, info.st_ino, info.st_mtime_ns,
                       hashlib.sha256(content).hexdigest())
    except (OSError, ValueError, TypeError):
        return None


def controlled_parents(path):
    for parent in path.parents:
        info = parent.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != ROOT_UID or info.st_mode & 0o022:
            return False
    return True


def failure_summary(slot, value):
    result = {'worker_slot': slot}
    for key, allowed in (('stage', ROOT_STAGES), ('user_stage', USER_STAGES),
                         ('last_completed_check', LAST_CHECKS), ('docker_result', DOCKER_RESULTS),
                         ('error_kind', frozenset(('boundary', 'local')))):
        item = value.get(key)
        if type(item) is str and item in allowed:
            result[key] = item
    for key, maximum in (('user_check_count', 512), ('docker_exit_status', 255)):
        item = value.get(key)
        if type(item) is int and 0 <= item <= maximum:
            result[key] = item
    return result


def command(ctx, arguments, operation, *, timeout, attempt, configuration=None):
    """Never expose captured output; retain only a declared diagnostic schema."""
    before = {slot: failure_receipt(slot) for slot in range(8)} if operation == 'validation' else {}
    started = int(time.time())
    status = None
    kind = 'nonzero-exit'
    try:
        result = run(arguments, capture=True, check=False, timeout=timeout)
        status = result.returncode
        if status == 0:
            return result.stdout
    except InitError:
        kind = 'could-not-complete'
    except KeyboardInterrupt:
        kind = 'interrupted'
    summaries = []
    for slot in before:
        observed = failure_receipt(slot)
        if (observed is None or (before[slot] is not None and observed[1] == before[slot][1])
                or not started <= observed[0]['recorded_at_epoch'] <= int(time.time()) + 1):
            continue
        summaries.append(failure_summary(slot, observed[0]))
    report = {'schema_version': 1, 'operation': operation, 'outcome': kind,
              'exit_status': status, 'attempt': attempt, 'configuration_sha256': configuration,
              'started_at_epoch': started, 'observed_at_epoch': int(time.time()),
              'worker_failures': summaries}
    path = ctx.env_path.parent / ('ci-registration-failure-' + uuid.uuid4().hex + '.json')
    location = ''
    try:
        _write_json(path, report)
        sync_directory(path.parent)
        location = ' Fixed-code diagnostic report: ' + str(path) + '.'
    except (InitError, OSError):
        location = ' Could not retain the private diagnostic report; preserve the operator context.'
    detail = ''.join(' Worker ' + str(item['worker_slot'] + 1) + ': '
                     + item.get('stage', 'unknown-root-stage') + '/'
                     + item.get('user_stage', 'unknown-user-stage')
                     + ('; last completed check ' + item['last_completed_check']
                        if 'last_completed_check' in item else '') + '.' for item in summaries)
    raise InitError('CI ' + operation + ' failed (' + (str(status) if status is not None else kind)
                    + ').' + detail + location + ' Controller activation was not requested. '
                    'Preserve the registration journal and any proof-recovery ledger. Resume with: '
                    + resume_command(ctx, attempt.get('predecessor_sha256'))) from None


def response(text, ctx, expected, *, operation, journal):
    try:
        value = json.loads(text)
        if (type(value) is not dict or value.get('operation') != operation
                or value.get('registered') != ctx.values['PROJECT_SLUG']
                or value.get('repository') != ctx.values['REPOSITORY']
                or value.get('predecessor_sha256') != expected
                or value.get('controller_enabled') is not False
                or type(value.get('configuration_sha256')) is not str
                or not re.fullmatch('[0-9a-f]{64}', value['configuration_sha256'])):
            raise ValueError()
        if operation == 'register' and (value.get('journal') != str(journal)
                or value.get('full_validation_required') is not True
                or type(value.get('resumed')) is not bool):
            raise ValueError()
        if operation == 'verify-registration' and value.get('validation_verified') is not True:
            raise ValueError()
        return value
    except (ValueError, TypeError):
        raise InitError('CI operation returned an unverified outcome; preserve private evidence. Resume with: '
                        + resume_command(ctx, expected)) from None


def register_and_validate(ctx, source, expected, project, observe_identity):
    journal = ctx.env_path.parent / 'ci-registration.json'
    state = read_state(ctx)
    attempt = {'schema_version': 1, 'identity': observe_identity(ctx, source),
               'predecessor_sha256': expected, 'journal': str(journal),
               'configuration_observation': state.get('ci_configuration_observation')}
    retained = state.get('ci_registration_attempt')
    if retained is None:
        if journal.exists() or journal.is_symlink() or state.get('ci_registered') is True:
            raise InitError('An existing registration has no matching initialization attempt. '
                            'Preserve it and use reviewed operator recovery; do not adopt it automatically.')
        update_state(ctx, ci_registration_attempt=attempt, ci_registered=False)
        sync_directory(ctx.env_path.parent)
    elif retained != attempt:
        raise InitError('CI registration attempt identity changed. Preserve its original source, boot, '
                        'configuration observation and journal; reconcile before retrying.')
    if journal.exists() or journal.is_symlink():
        private_file(journal)
    manage = ['python3', '-B', str(source / 'infrastructure/ci/manage.py')]
    flags = ['--project', str(project), '--expected-config-sha256', expected, '--journal', str(journal)]
    registered = response(command(ctx, manage + ['register', *flags], 'registration',
        timeout=900, attempt=attempt), ctx, expected, operation='register', journal=journal)
    if read_state(ctx).get('ci_registered') is not False:
        update_state(ctx, ci_registered=False)
        sync_directory(ctx.env_path.parent)
    print(('Resuming' if registered['resumed'] else 'Completed')
          + ' exact consumer registration; controller remains disabled.', flush=True)
    print('Running full installed CI validation; every configured worker and the pool must pass. '
          'Six-worker validation recently took about 15–20 minutes. Keep this terminal open.', flush=True)
    command(ctx, ['python3', '-B', '/usr/local/lib/web-app-ci/controller.py', 'validate'],
            'validation', timeout=3600, attempt=attempt,
            configuration=registered['configuration_sha256'])
    verified = response(command(ctx, manage + ['verify-registration', *flags], 'receipt-verification',
        timeout=120, attempt=attempt, configuration=registered['configuration_sha256']),
        ctx, expected, operation='verify-registration', journal=journal)
    if (verified['configuration_sha256'] != registered['configuration_sha256']
            or verified.get('boot_id') != attempt['identity']['boot_id']
            or verified.get('installed_controller_sha256') != attempt['identity']['installed_controller_sha256']
            or observe_identity(ctx, source) != attempt['identity']
            or read_state(ctx).get('ci_registration_attempt') != attempt
            or read_state(ctx).get('ci_configuration_observation') != attempt['configuration_observation']):
        raise InitError('CI source, configuration, boot or initialization observations changed; '
                        'completion was not recorded. Preserve evidence and reconcile before retrying.')
    update_state(ctx, ci_registered=True, ci_registration_predecessor_sha256=expected,
                 ci_registration_configuration_sha256=verified['configuration_sha256'])
    sync_directory(ctx.env_path.parent)
    print('Full installed CI validation and exact registration receipts verified. '
          'Step 11.4 is complete; review the evidence before step 11.5.', flush=True)
