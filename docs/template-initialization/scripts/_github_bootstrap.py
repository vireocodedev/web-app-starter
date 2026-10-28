"""Consumer-scoped GitHub setup using the authenticated maintainer's authority."""
import json
import re

from _shared import InitError, read_state, run, update_state, verify_github


API_VERSION = '2026-03-10'


def api(path, *, method='GET', body=None):
    """Global GitHub endpoint adapter; authenticated response bodies stay private."""
    argv = ['gh', 'api', path, '--include', '--method', method,
            '-H', 'Accept: application/vnd.github+json',
            '-H', 'X-GitHub-Api-Version: ' + API_VERSION]
    if body is not None:
        argv += ['--input', '-']
    result = run(argv, capture=True, check=False, timeout=120,
                 input=json.dumps(body) if body is not None else None)
    header, separator, raw = result.stdout.replace('\r\n', '\n').partition('\n\n')
    match = re.match(r'HTTP/\S+\s+(\d{3})\b', header)
    status = int(match[1]) if match else None
    if result.returncode or not separator or status is None or not 200 <= status < 300:
        access = ''
        if path.startswith('user/installations/'):
            if method == 'GET':
                access = (' App repository inventory needs the intended gh user with read:user scope; '
                          'run gh auth refresh -h github.com -s read:user, complete authentication and retry. '
                          'If access is still denied, verify that this user token supports installation inventory.')
            else:
                access = (' Adding App repository access also requires a supported user token with repo '
                          'authority and administrator access to the exact consumer and installation. '
                          'The read:user inventory scope alone does not authorize this write; '
                          'resolve organization restrictions or token compatibility before retrying.')
            access += ' Never use or transfer the App private key.'
        raise InitError('GitHub API ' + method + ' ' + path.split('?')[0]
                        + ' failed (HTTP ' + str(status or 'unknown')
                        + '). Check the intended gh user, repository admin access and organization policy; '
                        'no organization settings or authentication were changed. Read back before retrying.' + access)
    if status == 204:
        return None
    try:
        return json.loads(raw)
    except ValueError:
        raise InitError('GitHub returned invalid JSON for ' + path.split('?')[0] + '.') from None


def required_actions(ctx):
    """Read full Action commit pins from the checked-in workflow inventory."""
    paths = run(['git', 'ls-files', '--', '.github/workflows'], cwd=ctx.root,
                capture=True).stdout.splitlines()
    actions = set()
    for name in paths:
        path = ctx.root / name
        if path.suffix not in {'.yml', '.yaml'}:
            continue
        if path.is_symlink() or not path.is_file() or path.parent != ctx.root / '.github/workflows':
            raise InitError('Workflow inventory contains an unsupported file: ' + name)
        for line in path.read_text(encoding='utf-8').splitlines():
            match = re.match(r'^\s*(?:-\s*)?uses:\s*(.*?)\s*(?:#.*)?$', line)
            if not match:
                continue
            action = match[1].strip().strip('"\'')
            if action.startswith('./'):
                continue
            if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]+@[0-9a-fA-F]{40}', action):
                raise InitError('Workflow Actions must use reviewed full commit SHAs before setup: ' + name)
            actions.add(action)
    if not actions:
        raise InitError('No pinned Actions were found in the checked-in workflows.')
    return sorted(actions)


def action_policy(value):
    if (not isinstance(value, dict) or type(value.get('enabled')) is not bool
            or value.get('allowed_actions') not in {'all', 'local_only', 'selected'}
            or 'sha_pinning_required' in value and type(value['sha_pinning_required']) is not bool):
        raise InitError('GitHub returned unsupported repository Actions permissions.')
    return {key: value[key] for key in ('enabled', 'allowed_actions', 'sha_pinning_required') if key in value}


def selected_policy(value):
    if (not isinstance(value, dict)
            or type(value.get('github_owned_allowed')) is not bool
            or type(value.get('verified_allowed')) is not bool
            or not isinstance(value.get('patterns_allowed'), list)
            or any(not isinstance(item, str) or not item for item in value['patterns_allowed'])):
        raise InitError('GitHub returned an incomplete selected Actions inventory.')
    supported = {'github_owned_allowed', 'verified_allowed', 'patterns_allowed'}
    if set(value) - supported:
        raise InitError('GitHub selected Actions policy has unknown fields; preserve it for review.')
    return {key: value[key] for key in supported}


def ensure_actions(ctx):
    """Permit existing workflow pins, preserve selections and verify read-only defaults."""
    identity = verify_github(ctx, 'resume')
    required = required_actions(ctx)
    base = 'repos/' + ctx.values['REPOSITORY'] + '/actions/permissions'
    before = action_policy(api(base))
    desired = dict(before, enabled=True)
    if before['allowed_actions'] == 'local_only':
        desired['allowed_actions'] = 'selected'
    selected = None
    if before['allowed_actions'] == 'selected':
        selected = selected_policy(api(base + '/selected-actions'))
    workflow = api(base + '/workflow')
    if (not isinstance(workflow, dict) or workflow.get('default_workflow_permissions') not in {'read', 'write'}
            or type(workflow.get('can_approve_pull_request_reviews')) is not bool):
        raise InitError('GitHub returned incomplete default workflow permissions.')
    safe_tokens = {'default_workflow_permissions': 'read', 'can_approve_pull_request_reviews': False}
    # Remove write-by-default/approval authority before enabling new workflow execution.
    if any(workflow[key] != value for key, value in safe_tokens.items()):
        api(base + '/workflow', method='PUT', body=safe_tokens)
    if desired != before:
        api(base, method='PUT', body=desired)
    if desired['allowed_actions'] == 'selected':
        if selected is None:
            selected = selected_policy(api(base + '/selected-actions'))
        target = dict(selected, patterns_allowed=sorted(set(selected['patterns_allowed']) | set(required)))
        if target != selected:
            api(base + '/selected-actions', method='PUT', body=target)
        observed_selected = selected_policy(api(base + '/selected-actions'))
        if (not set(target['patterns_allowed']).issubset(observed_selected['patterns_allowed'])
                or any(observed_selected[key] != target[key] for key in ('github_owned_allowed', 'verified_allowed'))):
            raise InitError('Selected Actions read-back differs; preserve settings and reconcile organization policy before retrying.')
    observed = action_policy(api(base))
    token_result = api(base + '/workflow')
    if (observed != desired or not isinstance(token_result, dict)
            or any(token_result.get(key) != value for key, value in safe_tokens.items())):
        raise InitError('Actions settings read-back differs; reconcile administrator or organization policy before continuing.')
    update_state(ctx, github_actions_verified={'repository_id': identity['repository_id'],
                 'required_actions': required, 'allowed_actions': observed['allowed_actions'],
                 **safe_tokens})
    print('GitHub Actions permissions verified: workflow pins allowed; default token read-only; PR approvals disabled.')


CI_APP_ID = 5319558
CI_INSTALLATION_ID = 171464279
CI_PERMISSIONS = {'actions': 'read', 'administration': 'write', 'metadata': 'read'}


def pages(path, key):
    """Require a complete stable inventory, including exact-multiple final pages."""
    result = []
    expected = None
    for page in range(1, 101):
        chunk = api(path + ('&' if '?' in path else '?') + 'per_page=100&page=' + str(page))
        if (not isinstance(chunk, dict) or type(chunk.get('total_count')) is not int
                or chunk['total_count'] < 0 or not isinstance(chunk.get(key), list)
                or len(chunk[key]) > 100):
            raise InitError('GitHub App inventory is incomplete: ' + path)
        if expected is None:
            expected = chunk['total_count']
        if expected != chunk['total_count']:
            raise InitError('GitHub App inventory changed during pagination; retry without changing selections.')
        result.extend(chunk[key])
        if len(chunk[key]) < 100:
            if len(result) != expected:
                raise InitError('GitHub App inventory count differs; preserve selections and retry.')
            return result
    raise InitError('GitHub App inventory exceeded bounded pagination; preserve existing selections.')


def ci_installation(ctx):
    # /user/installations requires a GitHub App user token; ordinary gh owner OAuth
    # can inspect organization installations without reading the host's private key.
    inventory = pages('orgs/' + ctx.values['GH_ORG'] + '/installations', 'installations')
    identifiers = [item.get('id') for item in inventory if isinstance(item, dict)]
    if (len(identifiers) != len(inventory) or any(type(item) is not int or item <= 0 for item in identifiers)
            or len(set(identifiers)) != len(identifiers)):
        raise InitError('GitHub returned duplicate or invalid App installation identities.')
    matches = [item for item in inventory if item['id'] == CI_INSTALLATION_ID]
    if len(matches) != 1:
        raise InitError('The existing shared CI App installation is unavailable to this organization owner.')
    installation = matches[0]
    account = installation.get('account')
    if (installation.get('app_id') != CI_APP_ID or not isinstance(account, dict)
            or str(account.get('login', '')).lower() != ctx.values['GH_ORG'].lower()
            or account.get('type') != 'Organization' or installation.get('target_type') != 'Organization'
            or installation.get('repository_selection') != 'selected'
            or 'suspended_at' not in installation or installation['suspended_at'] is not None
            or installation.get('permissions') != CI_PERMISSIONS):
        raise InitError('Shared CI App identity, selected-repository access, suspension or permissions differ; '
                        'preserve the installation and reconcile with its operator.')
    return installation


def installation_repositories(ctx):
    inventory = pages('user/installations/' + str(CI_INSTALLATION_ID) + '/repositories', 'repositories')
    result = {}
    for repository in inventory:
        if not isinstance(repository, dict):
            raise InitError('GitHub App repository inventory has invalid entries.')
        identifier, name = repository.get('id'), repository.get('full_name')
        if (type(identifier) is not int or identifier <= 0 or identifier in result
                or not isinstance(name, str) or len(name.split('/')) != 2
                or name.split('/')[0].lower() != ctx.values['GH_ORG'].lower()):
            raise InitError('GitHub App repository inventory has duplicate or foreign identities.')
        result[identifier] = name.lower()
    return result


def ensure_ci_app_access(ctx):
    """Add only the recorded consumer; retain and read back every prior selection."""
    identity = verify_github(ctx, 'resume')
    repository_id = identity['repository_id']
    ci_installation(ctx)
    before = installation_repositories(ctx)
    expected_name = ctx.values['REPOSITORY'].lower()
    if repository_id in before and before[repository_id] != expected_name:
        raise InitError('Shared CI App repository ID does not match the verified consumer name.')
    state = read_state(ctx)
    pending = state.get('ci_app_access_pending')
    verified = state.get('ci_app_access_verified')
    if verified is not None:
        if (not isinstance(verified, dict) or verified.get('installation_id') != CI_INSTALLATION_ID
                or verified.get('app_id') != CI_APP_ID or verified.get('repository_id') != repository_id
                or not isinstance(verified.get('preserved_repository_ids'), list)
                or any(type(item) is not int or item <= 0 for item in verified['preserved_repository_ids'])
                or not set(verified['preserved_repository_ids']).issubset(before)):
            raise InitError('Recorded App access evidence differs or its preserved selections disappeared; '
                            'reconcile the existing installation and progress.')
    if pending is not None:
        if (not isinstance(pending, dict) or pending.get('installation_id') != CI_INSTALLATION_ID
                or pending.get('repository_id') != repository_id
                or not isinstance(pending.get('previous_repository_ids'), list)
                or any(type(item) is not int or item <= 0 for item in pending['previous_repository_ids'])
                or not set(pending['previous_repository_ids']).issubset(before)):
            raise InitError('A prior App access change needs reconciliation; preserve its selections and progress.')
    if repository_id not in before:
        if pending is None:
            pending = {'installation_id': CI_INSTALLATION_ID, 'repository_id': repository_id,
                       'previous_repository_ids': sorted(before)}
            update_state(ctx, ci_app_access_pending=pending)
        # This endpoint adds one ID; it cannot replace or remove any selection.
        api('user/installations/' + str(CI_INSTALLATION_ID) + '/repositories/' + str(repository_id), method='PUT')
    ci_installation(ctx)
    after = installation_repositories(ctx)
    if (after.get(repository_id) != expected_name
            or any(after.get(identifier) != name for identifier, name in before.items())):
        raise InitError('App repository access read-back differs or an existing selection disappeared; '
                        'preserve progress and reconcile before registration.')
    if verified is None or pending is not None:
        # Keep the original baseline stable across successful retries and an
        # interrupted additive write, so a repeated state handoff is identical.
        baseline = pending['previous_repository_ids'] if pending is not None else sorted(before)
        record = verified or {'installation_id': CI_INSTALLATION_ID, 'app_id': CI_APP_ID,
                              'repository_id': repository_id, 'preserved_repository_ids': baseline}
        update_state(ctx, ci_app_access_pending=None, ci_app_access_verified=record)
    print('Shared CI App access verified for ' + ctx.values['REPOSITORY'] + '; existing repository selections preserved.')
