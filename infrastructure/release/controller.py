#!/usr/bin/env python3
"""Host-only polling controller. No workflow command or source is executed here."""
import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import sys
import tempfile
import time

from protocol import GitHub, ReleaseError, command, decode, pair, positive, repository, status

TRUSTED = (
    '.github/workflows/deploy-staging.yaml',
    '.github/workflows/deploy-production.yaml',
    'infrastructure/release/client.py',
    'infrastructure/release/protocol.py',
    'infrastructure/release/smoke_images.py',
    'infrastructure/ci/ci-runner/github_app.py',
)


def protected(path, directory=False):
    path = Path(path)
    if not path.is_absolute() or '..' in path.parts:
        raise ReleaseError('protected-path-invalid')
    for ancestor in reversed(path.parents):
        info = ancestor.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ReleaseError('protected-ancestor-unsafe')
    info = path.lstat()
    if (info.st_uid != 0 or info.st_mode & 0o077
            or not (stat.S_ISDIR if directory else stat.S_ISREG)(info.st_mode)):
        raise ReleaseError('protected-file-unsafe')
    return path


def write_json(path, value):
    path = Path(path)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.pending-', delete=False) as stream:
        temporary = Path(stream.name)
        try:
            stream.write((json.dumps(value, sort_keys=True) + '\n').encode())
            stream.flush()
            os.fsync(stream.fileno())
            os.replace(temporary, path)
            descriptor = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(descriptor)
            finally:
                os.close(descriptor)
        finally:
            temporary.unlink(missing_ok=True)


def configuration(path):
    value = decode(protected(path).read_bytes())
    required = {'repository', 'repository_id', 'actors', 'workflow_ids', 'trusted_sha256', 'state',
                'cms_key', 'app_settings', 'app_key', 'runtime_config'}
    if type(value) is not dict or set(value) != required:
        raise ReleaseError('invalid-controller-config-fields')
    repository(value['repository'])
    positive(value['repository_id'])
    if (not isinstance(value['actors'], list) or not value['actors']
            or any(not isinstance(actor, str) or not re.fullmatch('[a-zA-Z0-9-]+', actor)
                   for actor in value['actors'])):
        raise ReleaseError('invalid-authorized-actors')
    if set(value['workflow_ids']) != {'staging', 'production'}:
        raise ReleaseError('invalid-workflow-map')
    for identifier in value['workflow_ids'].values():
        positive(identifier)
    if set(value['trusted_sha256']) != set(TRUSTED) or any(
            not isinstance(digest, str) or not re.fullmatch('[0-9a-f]{64}', digest)
            for digest in value['trusted_sha256'].values()):
        raise ReleaseError('invalid-trusted-source-pins')
    protected(value['state'], directory=True)
    for key in ('cms_key', 'app_settings', 'app_key', 'runtime_config'):
        protected(value[key])
    return value


class Reader:
    """Reuse the reviewed signer, minting only repository-scoped Actions read."""
    def __init__(self, config):
        self.config = config
        sibling = Path(__file__).with_name('github_app.py')
        source = sibling if sibling.exists() else Path(__file__).parents[1] / 'ci/ci-runner/github_app.py'
        spec = importlib.util.spec_from_file_location('deploy_app_signer', source)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        settings = decode(protected(config['app_settings']).read_bytes())
        if config['repository'].split('/')[0] != settings.get('owner', '').lower():
            raise ReleaseError('reader-app-repository-owner-mismatch')
        self.credentials = module.GitHubAppCredentials(settings, config['app_key'], protected,
                                                       repository, ReleaseError)
        self.cached = None

    def api(self):
        if self.cached and time.time() < self.cached[1] - 60:
            return GitHub(self.cached[0])
        jwt = self.credentials.jwt()
        installation = self.credentials.request(jwt, '')
        settings = self.credentials.settings
        if (installation.get('id') != settings['installation_id']
                or installation.get('app_id') != settings['app_id']
                or installation.get('account', {}).get('login', '').lower() != settings['owner'].lower()
                or installation.get('account', {}).get('type') != 'Organization'
                or installation.get('repository_selection') != 'selected'
                or installation.get('suspended_at') is not None
                or installation.get('permissions') != {
                    'actions': 'read', 'administration': 'write', 'metadata': 'read'}):
            raise ReleaseError('reader-app-installation-policy')
        result = self.credentials.request(jwt, '/access_tokens', 'POST',
                                          {'repositories': [self.config['repository'].split('/')[1]],
                                           'permissions': {'actions': 'read'}})
        try:
            expires = datetime.fromisoformat(result['expires_at'].replace('Z', '+00:00')).timestamp()
        except (KeyError, ValueError, TypeError, AttributeError):
            raise ReleaseError('reader-app-expiry-invalid') from None
        if expires < time.time() + 120:
            raise ReleaseError('reader-app-expiry-too-soon')
        self.cached = (result['token'], expires)
        return GitHub(result['token'])


def validate_run(config, run, environment):
    if (run.get('event') != 'workflow_dispatch' or run.get('status') != 'in_progress'
            or run.get('workflow_id') != config['workflow_ids'][environment]
            or run.get('path') != f'.github/workflows/deploy-{environment}.yaml'
            or run.get('repository', {}).get('id') != config['repository_id']
            or run.get('head_repository', {}).get('id') != config['repository_id']
            or run.get('actor', {}).get('login') not in config['actors']
            or run.get('triggering_actor', {}).get('login') not in config['actors']):
        raise ReleaseError('manual-run-identity-rejected')
    positive(run.get('id'))
    positive(run.get('run_attempt'))
    if not re.fullmatch('[0-9a-f]{40}', run.get('head_sha', '')):
        raise ReleaseError('manual-run-source-rejected')
    created = datetime.fromisoformat(run['run_started_at'].replace('Z', '+00:00'))
    if created.tzinfo is None or not 0 <= time.time() - created.timestamp() <= 3600:
        raise ReleaseError('manual-run-stale')


def validate_ticket(config, run, environment, ticket, api):
    fields = {'run_id', 'run_attempt', 'pair', 'staging_run_id', 'environment', 'deployment_id', 'token'}
    if (type(ticket) is not dict or set(ticket) != fields
            or ticket['run_id'] != run['id'] or ticket['run_attempt'] != run['run_attempt']
            or ticket['environment'] != environment):
        raise ReleaseError('request-run-identity-mismatch')
    pair(ticket['pair'], config['repository'], run['head_sha'])
    positive(ticket['run_id'])
    positive(ticket['run_attempt'])
    positive(ticket['deployment_id'])
    if environment == 'staging' and ticket['staging_run_id'] is not None:
        raise ReleaseError('staging-request-promotion-invalid')
    root = '/repos/' + config['repository']
    info = api.request(root)
    if info.get('id') != config['repository_id'] or info.get('private') is not True:
        raise ReleaseError('request-token-repository-mismatch')
    deployment = api.request(root + '/deployments/' + str(ticket['deployment_id']))
    expected_payload = {key: ticket[key] for key in ('run_id', 'run_attempt', 'pair', 'staging_run_id')}
    if (deployment.get('environment') != environment or deployment.get('sha') != run['head_sha']
            or deployment.get('payload') != expected_payload
            or deployment.get('creator', {}).get('login') != 'github-actions[bot]'):
        raise ReleaseError('request-deployment-identity-mismatch')


def validate_source(config, run, environment, ticket, api):
    root = '/repos/' + config['repository']
    for path, expected in config['trusted_sha256'].items():
        if hashlib.sha256(api.file(config['repository'], run['head_sha'], path)).hexdigest() != expected:
            raise ReleaseError('unreviewed-workflow-source')
    jobs = api.request(root + f"/actions/runs/{run['id']}/attempts/{run['run_attempt']}/jobs?per_page=100")
    if jobs.get('total_count', 101) > 100 or len([job for job in jobs['jobs'] if
            job.get('name') == f'Request {environment} deployment' and job.get('status') == 'in_progress']) != 1:
        raise ReleaseError('actual-request-job-not-running')
    if environment == 'production':
        origin = positive(ticket['staging_run_id'])
        staging = api.request(root + f'/actions/runs/{origin}')
        if (staging.get('workflow_id') != config['workflow_ids']['staging']
                or staging.get('path') != '.github/workflows/deploy-staging.yaml'
                or staging.get('event') != 'workflow_dispatch' or staging.get('conclusion') != 'success'
                or staging.get('head_sha') != run['head_sha']):
            raise ReleaseError('promotion-source-not-successful-staging')
        origin_attempt = positive(staging.get('run_attempt'))
        receipt_path = Path(config['state']) / 'receipts' / f'{origin}-{origin_attempt}.json'
        receipt = decode(protected(receipt_path).read_bytes())
        if receipt.get('pair') != ticket['pair'] or receipt.get('state') != 'success':
            raise ReleaseError('promotion-pair-not-host-verified')


def process(config, api, run, environment):
    validate_run(config, run, environment)
    state = Path(config['state'])
    journal = state / 'requests' / f"{run['id']}-{run['run_attempt']}.json"
    if journal.exists():
        return
    # Absence while the request job is preparing is normal, not an ignored error.
    inventory = api.request('/repos/' + config['repository'] + f"/actions/runs/{run['id']}/artifacts?per_page=100")
    name = 'deploy-request-' + str(run['run_attempt'])
    if not any(item['name'] == name for item in inventory['artifacts']):
        return
    encrypted = api.artifact(config['repository'], run['id'], name, 'request.cms')
    raw = command('openssl', 'cms', '-decrypt', '-binary', '-inform', 'DER',
                  '-inkey', config['cms_key'], input_bytes=encrypted)
    ticket = decode(raw)
    deploy_api = GitHub(ticket.get('token') if isinstance(ticket, dict) else None)
    validate_ticket(config, run, environment, ticket, deploy_api)
    record = {key: ticket[key] for key in ('run_id', 'run_attempt', 'environment', 'deployment_id', 'pair')}
    record['state'] = 'validating'
    write_json(journal, record)
    try:
        validate_source(config, run, environment, ticket, deploy_api)
        record['state'] = 'started'
        write_json(journal, record)
        status(deploy_api, config['repository'], ticket['deployment_id'], 'in_progress', 'Host validated manual run')
        # Only this installed, independently reviewed executor controls Docker.
        from runtime import deploy
        deploy(decode(protected(config['runtime_config']).read_bytes()), ticket, deploy_api,
               registry_user=run['actor']['login'])
        record['state'] = 'success'
        if environment == 'staging':
            write_json(state / 'receipts' / f"{run['id']}-{run['run_attempt']}.json", record)
        write_json(journal, record)
        status(deploy_api, config['repository'], ticket['deployment_id'], 'success', 'Exact pair and public routes verified')
    except ReleaseError as error:
        record['state'] = 'failure'
        record['error'] = str(error)
        write_json(journal, record)
        status(deploy_api, config['repository'], ticket['deployment_id'], 'failure', str(error)[:140])
        raise


def poll(config, api):
    for environment in ('staging', 'production'):
        try:
            workflow = config['workflow_ids'][environment]
            runs = api.request('/repos/' + config['repository']
                               + f'/actions/workflows/{workflow}/runs?event=workflow_dispatch'
                               '&status=in_progress&per_page=100')
            if runs.get('total_count', 101) > 100:
                raise ReleaseError('run-inventory-too-large')
        except ReleaseError as error:
            print('Controller inventory failed: ' + environment + ': ' + str(error), flush=True)
            continue
        for run in reversed(runs['workflow_runs']):
            try:
                process(config, api, run, environment)
            except ReleaseError as error:
                print('Controller request rejected: ' + environment + ': ' + str(error), flush=True)


def serve(config):
    reader = Reader(config)
    with (Path(config['state']) / 'controller.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise ReleaseError('controller-already-running') from None
        while True:
            try:
                poll(config, reader.api())
            except ReleaseError as error:
                print('Controller reader failed: ' + str(error), flush=True)
            time.sleep(15)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    args = parser.parse_args()
    try:
        if os.geteuid() != 0:
            raise ReleaseError('root-required')
        os.umask(0o077)
        serve(configuration(args.config))
    except ReleaseError as error:
        print('Controller stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
