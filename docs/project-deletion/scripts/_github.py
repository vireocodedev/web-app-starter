"""Exact consumer GitHub resources; inventory rather than interpreting 404 as absence."""
import json
import os
import re
import subprocess
import time
from urllib.parse import quote
from _state import Error, operation


def api(path, method='GET'):
    environment = dict(os.environ, GH_HOST='github.com')
    environment.pop('GH_REPO', None)
    try:
        response = subprocess.run(['gh', 'api', '--hostname', 'github.com', '--include', '--method', method,
            '-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28', path],
            capture_output=True, text=True, timeout=120, env=environment)
    except (OSError, subprocess.TimeoutExpired):
        raise Error('GitHub request outcome uncertain; rerun this journaled step to reconcile.') from None
    header, separator, raw = response.stdout.replace('\r\n', '\n').partition('\n\n')
    match = re.match(r'HTTP/\S+\s+(\d+)\b', header)
    status = int(match[1]) if match else 0
    if not separator or status not in {200, 201, 202, 204, 404}:
        raise Error('GitHub access/request failed (HTTP ' + str(status) + '); absence remains unverified.')
    if status == 404:
        return 404, None, header
    if response.returncode:
        raise Error('GitHub command failed; reconcile actual resource before retry.')
    try:
        return status, json.loads(raw) if raw.strip() else None, header
    except ValueError:
        raise Error('GitHub returned invalid JSON.') from None


def get(path):
    status, value, _ = api(path)
    if status != 200:
        raise Error('Required accessible GitHub inventory is unavailable; 404 is not absence.')
    return value


def pages(path, key=None):
    result = []
    for page in range(1, 1001):
        value = get(path + ('&' if '?' in path else '?') + 'per_page=100&page=' + str(page))
        batch = value.get(key) if key else value
        if not isinstance(batch, list):
            raise Error('GitHub inventory response differs.')
        result.extend(batch)
        if len(batch) < 100:
            return result
    raise Error('GitHub inventory exceeds the reviewed bound.')


def authority(identity, *, destructive=False):
    _, user, header = api('user')
    if not isinstance(user, dict) or str(user.get('login', '')).lower() != identity['maintainer'].lower():
        raise Error('GitHub account differs from the historical maintainer.')
    scope = re.search(r'^x-oauth-scopes:\s*(.*)$', header, re.I | re.M)
    scopes = set(x.strip() for x in scope[1].split(',')) if scope else set()
    required = {'repo', 'read:packages'} | ({'delete_repo', 'delete:packages'} if destructive else set())
    if not required <= scopes:
        raise Error('GitHub OAuth scopes missing: ' + ', '.join(sorted(required - scopes)) + '. Refresh the intended account explicitly.')
    membership = get('user/memberships/orgs/' + identity['org'])
    if membership.get('state') != 'active' or membership.get('role') != 'admin':
        raise Error('Require the intended active organization owner.')


def repositories(identity):
    entries = pages('orgs/' + identity['org'] + '/repos?type=all')
    if any(type(item.get('id')) is not int or not isinstance(item.get('full_name'), str) for item in entries):
        raise Error('Invalid organization repository inventory.')
    return entries


def repository(identity, *, allow_absent=False):
    matches = [entry for entry in repositories(identity) if entry['id'] == identity['repository_id'] or entry['full_name'].lower() == identity['repository'].lower()]
    if not matches and allow_absent:
        return None
    if len(matches) != 1 or matches[0]['id'] != identity['repository_id'] or matches[0]['full_name'].lower() != identity['repository'].lower():
        raise Error('Repository renamed, replaced, inaccessible or absent; exact identity required.')
    result = get('repos/' + identity['repository'])
    if (result.get('id') != identity['repository_id']
            or str(result.get('full_name', '')).lower() != identity['repository'].lower()
            or result.get('private') is not True or result.get('permissions', {}).get('admin') is not True):
        raise Error('Exact private repository administrator identity required.')
    return result


def packages(identity):
    return pages('orgs/' + identity['org'] + '/packages?package_type=container')


def package(identity, name, *, expected=None):
    matches = [entry for entry in packages(identity) if entry.get('name') == name]
    if not matches:
        return None
    if len(matches) != 1:
        raise Error('Ambiguous package inventory.')
    item = get('orgs/' + identity['org'] + '/packages/container/' + quote(name, safe=''))
    if (item.get('visibility') != 'private' or item.get('repository', {}).get('id') != identity['repository_id']
            or item.get('package_type') != 'container' or item.get('name') != name
            or type(item.get('id')) is not int or expected is not None and item['id'] != expected):
        raise Error('Package identity/ownership differs; preserve it.')
    return {'name': name, 'id': item['id']}


def selections(identity, read_app):
    result = read_app(identity)
    fields = {'schema_version', 'app_id', 'installation_id', 'owner', 'repository_selection', 'repository_ids'}
    if (not isinstance(result, dict) or set(result) != fields or type(result['schema_version']) is not int
            or result['schema_version'] != 1 or type(result['app_id']) is not int
            or result['app_id'] != identity['app_id'] or type(result['installation_id']) is not int
            or result['installation_id'] != identity['app_installation_id']
            or not isinstance(result['owner'], str) or result['owner'].lower() != identity['org'].lower()
            or result['repository_selection'] != 'selected' or not isinstance(result['repository_ids'], list)
            or any(type(item) is not int or item <= 0 for item in result['repository_ids'])
            or result['repository_ids'] != sorted(set(result['repository_ids']))):
        raise Error('Protected App inventory identity differs; absence remains unverified.')
    return result['repository_ids']


def inspect(identity, read_app):
    authority(identity)
    current = repository(identity)
    selected = selections(identity, read_app)
    if not set(selected) - {identity['repository_id']}:
        raise Error('Removing the final shared App selection requires a separate policy; planning stopped before teardown.')
    return {'repository_id': current['id'], 'actions': get('repos/' + identity['repository'] + '/actions/permissions'),
            'packages': [item for name in (identity['slug'] + '-frontend', identity['slug'] + '-backend')
                         if (item := package(identity, name)) is not None], 'app_repositories': selected,
            'preserved_repositories': sorted(entry['id'] for entry in repositories(identity) if entry['id'] != identity['repository_id'])}


def inactive(identity):
    repository(identity)
    runs = pages('repos/' + identity['repository'] + '/actions/runs', 'workflow_runs')
    return [item for item in runs if item.get('status') != 'completed']


def quiesce(directory, selected):
    identity = selected['identity']
    authority(identity, destructive=True)
    repository(identity)
    # gh supplies JSON input through stdin, never shell interpolation.
    def disable():
        response = subprocess.run(['gh', 'api', '--hostname', 'github.com', '--method', 'PUT',
            'repos/' + identity['repository'] + '/actions/permissions', '--input', '-'],
            input=json.dumps(dict(selected['github']['actions'], enabled=False)), capture_output=True, text=True, timeout=120)
        if response.returncode:
            raise Error('Actions disable outcome uncertain; reconcile before retry.')
    operation(directory, selected, 'github-actions-disabled', identity['repository_id'], disable,
              lambda: get('repos/' + identity['repository'] + '/actions/permissions').get('enabled') is False)
    for run in inactive(identity):
        if run.get('repository', {}).get('id') != identity['repository_id'] or type(run.get('id')) is not int:
            raise Error('Foreign/ambiguous workflow run in consumer inventory.')
        def stopped(run_id=run['id']):
            return get('repos/' + identity['repository'] + '/actions/runs/' + str(run_id)).get('status') == 'completed'
        def cancel(run_id=run['id']):
            api('repos/' + identity['repository'] + '/actions/runs/' + str(run_id) + '/cancel', 'POST')
            import time
            for _ in range(60):
                if stopped(run_id):
                    return
                time.sleep(2)
            raise Error('Workflow cancellation still pending; rerun after idle.')
        if run.get('path') in {'.github/workflows/deploy-staging.yaml', '.github/workflows/deploy-production.yaml'}:
            # An active request may already own a database mutation. Wait; never cancel it blindly.
            import time
            for _ in range(60):
                if stopped():
                    break
                time.sleep(2)
            else:
                raise Error('Deployment run still active; leave its controller running and retry when settled.')
        elif run.get('path') == '.github/workflows/ci.yml':
            operation(directory, selected, 'cancel-run-' + str(run['id']), run['id'], cancel, stopped)
        else:
            raise Error('Unknown active workflow requires ownership review; it was not cancelled.')
    if inactive(identity):
        raise Error('Repository still has active workflow runs.')


def remove_resources(directory, selected, read_app):
    identity = selected['identity']
    authority(identity, destructive=True)
    repository(identity)
    for item in selected['github']['packages']:
        def absent(item=item):
            return package(identity, item['name'], expected=item['id']) is None
        def remove(item=item):
            repository(identity)
            package(identity, item['name'], expected=item['id'])
            api('orgs/' + identity['org'] + '/packages/container/' + quote(item['name'], safe=''), 'DELETE')
        operation(directory, selected, 'package-' + str(item['id']), item, remove, absent)
    verify_resources_absent(selected, read_app, allow_target=True)



def verify_resources_absent(selected, read_app, *, allow_target=False):
    """Read provider state without depending on a surviving consumer repository.

    Check both derived names even when the plan found no package. A new package
    is a blocker rather than a resource this stage may adopt or delete. Exact
    shared App selection readback is independent of the deleted repo endpoint.
    """
    identity = selected['identity']
    authority(identity, destructive=True)
    inventory = packages(identity)
    if any(not isinstance(item, dict) or not isinstance(item.get('name'), str) for item in inventory):
        raise Error('Organization package inventory is invalid; absence remains unverified.')
    names = {identity['slug'] + '-frontend', identity['slug'] + '-backend'}
    if any(item['name'] in names for item in inventory):
        raise Error('Consumer package name exists or reappeared; preserve it and reconcile before deleting the repository.')
    expected = set(selected['github']['app_repositories']) - {identity['repository_id']}
    now = set(selections(identity, read_app))
    permitted = (expected, expected | {identity['repository_id']}) if allow_target else (expected,)
    if now not in permitted:
        raise Error('Shared App selections differ from the exact preserved manifest.')
    if not set(selected['github']['preserved_repositories']) <= {item['id'] for item in repositories(identity)}:
        raise Error('A preserved organization repository disappeared.')
    return identity['repository_id'] not in now


APP_READBACK_ATTEMPTS = 6
APP_READBACK_DELAY = 2


def remove_repository(directory, selected, read_app):
    identity = selected['identity']
    authority(identity, destructive=True)
    def absent():
        if repository(identity, allow_absent=True) is not None:
            verify_resources_absent(selected, read_app, allow_target=True)
            return False
        # Repository deletion removes it from the selected installation. Poll
        # only readbacks; never reissue DELETE to make App inventory converge.
        for attempt in range(APP_READBACK_ATTEMPTS):
            if verify_resources_absent(selected, read_app, allow_target=True):
                return True
            if attempt + 1 < APP_READBACK_ATTEMPTS:
                time.sleep(APP_READBACK_DELAY)
                if repository(identity, allow_absent=True) is not None:
                    raise Error('A deleted repository reappeared; preserve it and reconcile.')
        raise Error('Repository is absent but App selection readback is pending; rerun the same journaled step.')
    def remove():
        repository(identity)
        verify_resources_absent(selected, read_app, allow_target=True)
        api('repos/' + identity['repository'], 'DELETE')
    operation(directory, selected, 'repository', identity['repository_id'], remove, absent)


def verify(selected, read_app):
    identity = selected['identity']
    authority(identity, destructive=True)
    if repository(identity, allow_absent=True) is not None:
        raise Error('Consumer repository still exists.')
    verify_resources_absent(selected, read_app)
    if not set(selected['github']['preserved_repositories']) <= {item['id'] for item in repositories(identity)}:
        raise Error('A preserved organization repository disappeared.')
