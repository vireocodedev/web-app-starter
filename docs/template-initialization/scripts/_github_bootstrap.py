"""Consumer-scoped GitHub setup using the authenticated maintainer's authority."""
import json
import re

from _shared import InitError, run, update_state, verify_github


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
        raise InitError('GitHub API ' + method + ' ' + path.split('?')[0]
                        + ' failed (HTTP ' + str(status or 'unknown')
                        + '). Check the intended gh user, repository admin access and organization policy; '
                        'no organization settings or authentication were changed. Read back before retrying.')
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
