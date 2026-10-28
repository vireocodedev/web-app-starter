"""Strict, offline initialization completion evidence shared with project deletion."""
from copy import deepcopy
from datetime import datetime
import json
from pathlib import Path
import re

from _shared import InitError, private_file

CHECKS = frozenset(('login', 'session_persistence', 'logout', 'secure_cookie',
                    'http_only_cookie', 'fresh_csrf'))
COMPLETION_KEYS = frozenset(('schema_version', 'state', 'source_sha', 'progress_sha256', 'acceptance'))
SCHEDULE_KEYS = frozenset(('source_sha', 'runtime_sha256', 'installation_sha256',
    'runtime_config_sha256', 'retention_days', 'timer', 'schedule', 'persistent',
    'service', 'staging_scheduled', 'next_fire', 'scheduled_execution_observed', 'checked_at'))


def require(condition, category):
    if not condition:
        raise InitError('Initialization completion evidence is invalid: ' + category + '.')


def fields(value, keys, category):
    require(isinstance(value, dict) and set(value) == set(keys), category)


def digest(value, length=64):
    return isinstance(value, str) and re.fullmatch('[0-9a-f]{' + str(length) + '}', value) is not None


def positive(value):
    return type(value) is int and value > 0


def bounded(value, limit=800):
    return (isinstance(value, str) and 1 <= len(value.strip()) <= limit
            and all(ord(character) >= 32 and ord(character) != 127 for character in value))


def timestamp(value):
    require(bounded(value, 80), 'observation timestamp')
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        raise InitError('Initialization completion evidence is invalid: observation timestamp.') from None
    require(parsed.tzinfo is not None and parsed.utcoffset() is not None, 'observation timezone')


def unique(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate JSON field')
        result[key] = value
    return result


def read_acceptance(path):
    path = Path(path)
    require(path.is_absolute(), 'absolute protected acceptance path')
    try:
        raw = private_file(path).read_bytes()
        require(len(raw) <= 65536, 'acceptance size')
        value = json.loads(raw, object_pairs_hook=unique)
    except (OSError, ValueError, UnicodeError):
        raise InitError('Could not read protected initialization acceptance JSON.') from None
    require(isinstance(value, dict), 'acceptance object')
    return value


def image_pair(value, repository, source):
    fields(value, ('source_sha', 'repository', 'frontend', 'backend'), 'immutable pair fields')
    require(value['source_sha'] == source and value['repository'] == repository, 'immutable pair identity')
    for component in ('frontend', 'backend'):
        prefix = 'ghcr.io/' + repository + '-' + component + '@sha256:'
        image = value[component]
        require(isinstance(image, str) and image.startswith(prefix) and digest(image[len(prefix):]),
                'immutable component digest')


def validate_completion(result, values, progress, progress_sha256):
    """Validate archived inputs without network, credentials or mutable host state.

    The caller hashes the exact protected progress bytes, rather than serialized JSON.
    Completion is an operator evidence assertion, not a cryptographic attestation.
    """
    require(isinstance(result, dict) and isinstance(progress, dict) and isinstance(values, dict), 'input objects')
    repository = values.get('REPOSITORY')
    require(isinstance(repository, str) and re.fullmatch(r'[a-z0-9][a-z0-9-]*/[a-z0-9][a-z0-9_.-]*', repository),
            'repository')
    require(result.get('scope') == 'full' and result.get('repository') == repository
            and progress.get('repository') == repository, 'full consumer scope')
    require(digest(progress.get('env_sha256')) and result.get('env_sha256') == progress['env_sha256'], 'input hash')
    completion = result.get('completion')
    fields(completion, COMPLETION_KEYS, 'explicit completion marker')
    require(type(completion['schema_version']) is int and completion['schema_version'] == 1
            and completion['state'] == 'complete', 'completion version/state')
    require(digest(progress_sha256) and completion['progress_sha256'] == progress_sha256, 'archived progress hash')
    source = completion['source_sha']
    require(digest(source, 40) and all(progress.get(key) == source for key in
        ('source_sha', 'release_source_sha', 'staging_source_sha', 'production_source_sha')), 'exact deployed source')
    for key in ('repository_id', 'staging_workflow_id', 'production_workflow_id',
                'staging_run_id', 'staging_run_attempt', 'production_run_id', 'production_run_attempt'):
        require(positive(progress.get(key)), 'positive observed IDs')
    require(progress['staging_workflow_id'] != progress['production_workflow_id']
            and progress['staging_run_id'] != progress['production_run_id'], 'distinct release workflows/runs')
    pair = progress.get('staging_pair')
    image_pair(pair, repository, source)
    require(digest(progress.get('retrieved_backup_sha256'))
            and progress.get('restored_backup_sha256') == progress['retrieved_backup_sha256']
            and progress.get('retrieved_copy_restored') is True, 'retrieved-copy restore')
    schedule = progress.get('backup_schedule')
    fields(schedule, SCHEDULE_KEYS, 'observed backup schedule fields')
    slug = values.get('PROJECT_SLUG')
    require(isinstance(slug, str) and re.fullmatch(r'[a-z][a-z0-9-]{2,39}', slug), 'project slug')
    require(schedule['source_sha'] == source and schedule['schedule'] == '*-*-* 03:00:00 Europe/Zagreb'
            and schedule['persistent'] is True and schedule['staging_scheduled'] is False
            and type(schedule['retention_days']) is int and schedule['retention_days'] == 30
            and schedule['timer'] == 'web-app-backup-' + slug + '.timer'
            and schedule['service'] == 'web-app-backup-' + slug + '.service'
            and type(schedule['scheduled_execution_observed']) is bool
            and bounded(schedule['next_fire'], 160) and schedule['next_fire'] not in ('0', 'n/a'), 'backup schedule policy')
    for key in ('runtime_sha256', 'installation_sha256', 'runtime_config_sha256'):
        require(digest(schedule[key]), 'backup source/config hash')
    timestamp(schedule['checked_at'])
    acceptance = completion['acceptance']
    fields(acceptance, ('schema_version', 'source_sha', 'environments', 'manual'), 'acceptance fields')
    require(type(acceptance['schema_version']) is int and acceptance['schema_version'] == 1
            and acceptance['source_sha'] == source, 'acceptance version/source')
    fields(acceptance['environments'], ('staging', 'production'), 'accepted environments')
    for environment in ('staging', 'production'):
        accepted = acceptance['environments'][environment]
        fields(accepted, ('deployment_receipt', 'provisioning_receipt', 'https'), 'environment evidence fields')
        receipt = accepted['deployment_receipt']
        fields(receipt, ('state', 'environment', 'run_id', 'run_attempt', 'pair'), 'deployment receipt projection')
        require(receipt['state'] == 'success' and receipt['environment'] == environment
                and positive(receipt['run_id']) and positive(receipt['run_attempt'])
                and receipt['run_id'] == progress[environment + '_run_id']
                and receipt['run_attempt'] == progress[environment + '_run_attempt']
                and receipt['pair'] == pair, 'successful exact-pair deployment receipt')
        image_pair(receipt['pair'], repository, source)
        provisioning = accepted['provisioning_receipt']
        fields(provisioning, ('state', 'backend'), 'provisioning receipt projection')
        require(provisioning['state'] == 'success' and provisioning['backend'] == pair['backend'], 'provisioned backend')
        https = accepted['https']
        fields(https, ('origin', 'run_id', 'run_attempt', 'observed_at', 'checks'), 'HTTPS evidence fields')
        hostname = values.get(environment.upper() + '_HOSTNAME')
        require(isinstance(hostname, str) and https['origin'] == 'https://' + hostname
                and positive(https['run_id']) and positive(https['run_attempt'])
                and https['run_id'] == receipt['run_id'] and https['run_attempt'] == receipt['run_attempt'],
                'HTTPS environment/run binding')
        timestamp(https['observed_at'])
        fields(https['checks'], CHECKS, 'HTTPS acceptance checks')
        require(all(value is True for value in https['checks'].values()), 'observed HTTPS acceptance')
    manual = acceptance['manual']
    fields(manual, ('local_application', 'ide', 'artwork'), 'manual acceptance fields')
    for key, statuses in (('local_application', ('passed',)), ('ide', ('passed', 'not-applicable', 'waived')),
                          ('artwork', ('accepted', 'deferred'))):
        item = manual[key]
        waived = key == 'ide' and isinstance(item, dict) and item.get('status') == 'waived'
        keys = ('status', 'evidence', 'user_authorized') if waived else ('status', 'evidence')
        fields(item, keys, 'manual evidence fields')
        require(item['status'] in statuses and bounded(item['evidence']), 'manual acceptance status/evidence')
        if waived:
            require(item['user_authorized'] is True, 'explicit user authorization for IDE waiver')
    observations = result.get('observations')
    require(isinstance(observations, dict) and all(observations.get(key) == progress.get(key)
        for key in ('source_sha', 'release_source_sha', 'staging_source_sha', 'production_source_sha',
                    'staging_pair', 'repository_id', 'staging_workflow_id', 'production_workflow_id',
                    'staging_run_id', 'staging_run_attempt', 'production_run_id', 'production_run_attempt',
                    'retrieved_backup_sha256', 'restored_backup_sha256', 'retrieved_copy_restored', 'backup_schedule')),
            'report observations')
    return deepcopy(completion)


def build_completion(acceptance, values, progress, progress_sha256):
    """Construct a candidate; the caller validates it with its complete report."""
    return {'schema_version': 1, 'state': 'complete', 'source_sha': progress.get('source_sha'),
            'progress_sha256': progress_sha256, 'acceptance': deepcopy(acceptance)}
