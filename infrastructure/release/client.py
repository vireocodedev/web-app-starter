"""Workflow-only publication, encrypted request handoff and result waiting."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import time

# Workflows use -I -S; load only this reviewed sibling, never a checkout search path.
_spec = importlib.util.spec_from_file_location('protocol', Path(__file__).with_name('protocol.py'))
_protocol = importlib.util.module_from_spec(_spec)
sys.modules['protocol'] = _protocol
_spec.loader.exec_module(_protocol)
from protocol import GitHub, ReleaseError, bearer, command, decode, pair, positive, private_packages, repository


def context():
    return (repository(os.environ['GITHUB_REPOSITORY'].lower()), os.environ['GITHUB_SHA'],
            positive(int(os.environ['GITHUB_RUN_ID'])), positive(int(os.environ['GITHUB_RUN_ATTEMPT'])))


def publish():
    repo, sha, run_id, attempt = context()
    token = bearer(os.environ['GH_TOKEN'])
    value = {'repository': repo, 'source_sha': sha}
    with tempfile.TemporaryDirectory(prefix='vireo-registry-') as temporary:
        environment = dict(os.environ, DOCKER_CONFIG=temporary)
        command('docker', 'login', 'ghcr.io', '--username', os.environ['GITHUB_ACTOR'],
                '--password-stdin', input_bytes=token.encode(), env=environment)
        for component in ('frontend', 'backend'):
            tagged = f'ghcr.io/{repo}-{component}:run-{run_id}-{attempt}'
            command('docker', 'tag', 'vireo-' + component + ':verified', tagged)
            command('docker', 'push', tagged, env=environment, timeout=600)
            digests = decode(command('docker', 'image', 'inspect', '--format', '{{json .RepoDigests}}', tagged))
            matches = [digest for digest in digests if digest.startswith(f'ghcr.io/{repo}-{component}@')]
            if len(matches) != 1:
                raise ReleaseError('pushed-digest-ambiguous')
            value[component] = matches[0]
    pair(value, repo, sha)
    private_packages(GitHub(token), repo)
    Path('release-pair.json').write_text(json.dumps(value, sort_keys=True) + '\n')
    print('Published private immutable image pair for ' + sha)


def promote(staging_run):
    repo, sha, _, _ = context()
    api = GitHub(os.environ['GH_TOKEN'])
    run = api.request('/repos/' + repo + f'/actions/runs/{positive(staging_run)}')
    if (run.get('event') != 'workflow_dispatch' or run.get('conclusion') != 'success'
            or run.get('path') != '.github/workflows/deploy-staging.yaml' or run.get('head_sha') != sha):
        raise ReleaseError('staging-run-not-successful-selected-source')
    raw = api.artifact(repo, staging_run, 'release-pair-' + str(positive(run['run_attempt'])), 'release-pair.json')
    pair(decode(raw), repo, sha)
    Path('release-pair.json').write_bytes(raw)
    print('Selected the exact verified staging image pair; no rebuild.')


def request(environment, staging_run):
    repo, sha, run_id, attempt = context()
    api = GitHub(os.environ['GH_TOKEN'])
    release = pair(decode(Path('release-pair.json').read_bytes()), repo, sha)
    private_packages(api, repo)
    payload = {'run_id': run_id, 'run_attempt': attempt, 'pair': release,
               'staging_run_id': staging_run}
    deployment = api.request('/repos/' + repo + '/deployments', 'POST',
                             {'ref': sha, 'environment': environment, 'auto_merge': False,
                              'required_contexts': [], 'description': 'Paired manual deployment',
                              'production_environment': environment == 'production', 'payload': payload})
    ticket = dict(payload, environment=environment, deployment_id=positive(deployment['id']),
                  token=bearer(os.environ['GH_TOKEN']))
    with tempfile.TemporaryDirectory(prefix='vireo-request-') as temporary:
        certificate = Path(temporary) / 'controller.pem'
        certificate.write_text(os.environ['DEPLOY_CONTROLLER_CERT'])
        encrypted = command('openssl', 'cms', '-encrypt', '-binary', '-aes-256-gcm', '-outform', 'DER',
                            '-recip', str(certificate), '-keyopt', 'rsa_padding_mode:oaep',
                            '-keyopt', 'rsa_oaep_md:sha256', input_bytes=json.dumps(ticket).encode())
    Path('request.cms').write_bytes(encrypted)
    Path('deployment-id').write_text(str(deployment['id']))
    print('Created encrypted short-lived deployment request ' + str(deployment['id']))


def wait():
    repo, _, _, _ = context()
    deployment_id = positive(int(Path('deployment-id').read_text()))
    api = GitHub(os.environ['GH_TOKEN'])
    deadline = time.monotonic() + 1200
    while time.monotonic() < deadline:
        statuses = api.request('/repos/' + repo + f'/deployments/{deployment_id}/statuses?per_page=10')
        if statuses:
            state = statuses[0]['state']
            if state == 'success':
                print('Host verified the deployed image pair and public routes.')
                return
            if state in ('failure', 'error', 'inactive'):
                raise ReleaseError('host-deployment-' + state)
        time.sleep(15)
    raise ReleaseError('host-deployment-result-timeout-inspect-server-journal')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=('publish', 'promote', 'request', 'wait'))
    parser.add_argument('--environment', choices=('staging', 'production'))
    parser.add_argument('--staging-run', type=int)
    arguments = parser.parse_args()
    try:
        if arguments.operation == 'publish':
            publish()
        elif arguments.operation == 'promote':
            promote(arguments.staging_run)
        elif arguments.operation == 'request':
            if not arguments.environment or (arguments.environment == 'production' and not arguments.staging_run):
                raise ReleaseError('missing-environment-or-staging-run')
            request(arguments.environment, arguments.staging_run)
        else:
            wait()
    except ReleaseError as error:
        print('Release failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
