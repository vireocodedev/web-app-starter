"""Consumer GitHub settings and a resumable, never-merged protection probe."""
import copy
import fcntl
import os
import stat
import hashlib
import json
import re
import shlex
import sys
import time
from urllib.parse import quote, urlsplit
import uuid

from _operations import (context, gh_json, initialization_pr_identity, observed_sha,
                         positive, watch_initialization_ci)
from _shared import InitError, parser, read_state, run, update_state, verify_github


GATE = 'CI gate'
PROBE_KEY = 'github_policy_probe'


def api(ctx, path, *, method='GET', body=None, absent=False):
    """Use JSON stdin and HTTP status, never display authenticated diagnostics."""
    endpoint = path if path == 'graphql' else 'repos/' + ctx.values['REPOSITORY'] + path
    argv = ['gh', 'api', endpoint, '--include', '--method', method,
            '-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28']
    if body is not None:
        argv += ['--input', '-']
    result = run(argv, capture=True, check=False, timeout=120,
                 input=json.dumps(body) if body is not None else None)
    header, separator, raw = result.stdout.replace('\r\n', '\n').partition('\n\n')
    status = re.match(r'HTTP/\S+\s+(\d{3})\b', header)
    code = int(status[1]) if status else None
    if absent and code == 404:
        try:
            message = json.loads(raw).get('message')
        except (ValueError, AttributeError):
            message = None
        known = {'Branch not protected'} if path == '/branches/main/protection' else {'Not Found'}
        if message in known:
            return None
    if result.returncode or not separator or code is None or not 200 <= code < 300:
        raise InitError('GitHub API ' + method + ' ' + path.split('?')[0]
                        + ' failed (HTTP ' + str(code or 'unknown')
                        + '). Resolve access, plan entitlement or policy conflicts; settings were not weakened.')
    if code == 204:
        return None
    try:
        return json.loads(raw)
    except ValueError:
        raise InitError('GitHub returned invalid JSON for ' + path.split('?')[0] + '.') from None


def pages(ctx, path, key=None):
    result = []
    for page in range(1, 101):
        chunk = api(ctx, path + ('&' if '?' in path else '?') + 'per_page=100&page=' + str(page))
        items = chunk.get(key) if key and isinstance(chunk, dict) else chunk
        if not isinstance(items, list):
            raise InitError('GitHub policy inventory is incomplete: ' + path)
        result.extend(items)
        if len(items) < 100:
            total = chunk.get('total_count') if isinstance(chunk, dict) else None
            if total is not None and total != len(result):
                raise InitError('GitHub inventory count changed during pagination: ' + path)
            return result
    raise InitError('GitHub policy inventory exceeded its bounded pagination: ' + path)


def enabled(value):
    return value.get('enabled') is True if isinstance(value, dict) else value is True


def actors(value, key):
    if not isinstance(value, dict) or not isinstance(value.get(key, []), list):
        raise InitError('Unsupported branch policy actor inventory.')
    field = {'users': 'login', 'teams': 'slug', 'apps': 'slug'}[key]
    names = [item.get(field) for item in value.get(key, [])]
    if any(not isinstance(name, str) or not name for name in names):
        raise InitError('Unsupported branch policy actor identity.')
    return sorted(names)


def protection_body(current, app_id):
    """Reconstruct supported writable fields while preserving stronger settings."""
    current = current or {}
    supported = {'url', 'required_status_checks', 'enforce_admins', 'required_pull_request_reviews',
                 'restrictions', 'required_linear_history', 'allow_force_pushes', 'allow_deletions',
                 'block_creations', 'required_conversation_resolution', 'lock_branch',
                 'allow_fork_syncing', 'required_signatures'}
    if set(current) - supported:
        raise InitError('Existing branch protection has unsupported fields; preserve it and reconcile manually.')
    if enabled(current.get('lock_branch')):
        raise InitError('Main is locked; preserve that policy and reconcile before initialization.')
    checks = current.get('required_status_checks') or {}
    entries = {}
    for check in checks.get('checks', []):
        name, source = check.get('context'), check.get('app_id')
        if not isinstance(name, str) or not name or (source is not None and (type(source) is not int or source < -1)):
            raise InitError('Unsupported required check identity.')
        if name in entries and entries[name] != source:
            raise InitError('Conflicting required check source bindings.')
        entries[name] = source
    for name in checks.get('contexts', []):
        if not isinstance(name, str) or not name:
            raise InitError('Unsupported required check context.')
        entries.setdefault(name, -1)
    if GATE in entries and entries[GATE] not in (None, -1, app_id):
        raise InitError('Existing CI gate is bound to another App; preserve it and reconcile the conflict.')
    entries[GATE] = app_id
    reviews = current.get('required_pull_request_reviews') or {}
    supported_reviews = {'url', 'dismissal_restrictions', 'dismiss_stale_reviews', 'require_code_owner_reviews',
                         'required_approving_review_count', 'require_last_push_approval',
                         'bypass_pull_request_allowances'}
    if set(reviews) - supported_reviews:
        raise InitError('Existing review policy has unsupported fields.')
    bypass = reviews.get('bypass_pull_request_allowances') or {}
    if any(actors(bypass, kind) for kind in ('users', 'teams', 'apps')):
        raise InitError('Existing PR bypass actors conflict with administrator enforcement; reconcile without routine bypass.')
    count = reviews.get('required_approving_review_count', 0)
    if type(count) is not int or not 0 <= count <= 6:
        raise InitError('Unsupported required approval count.')
    review_body = {key: reviews.get(key, False) for key in
                   ('dismiss_stale_reviews', 'require_code_owner_reviews', 'require_last_push_approval')}
    review_body['required_approving_review_count'] = count
    if reviews.get('dismissal_restrictions') is not None:
        review_body['dismissal_restrictions'] = {kind: actors(reviews['dismissal_restrictions'], kind)
                                                for kind in ('users', 'teams', 'apps')}
    restriction = current.get('restrictions')
    return {'required_status_checks': {'strict': True, 'contexts': [], 'checks': [
                {'context': name, 'app_id': source if source is not None else -1}
                for name, source in sorted(entries.items())]},
            'enforce_admins': True, 'required_pull_request_reviews': review_body,
            'restrictions': None if restriction is None else {
                kind: actors(restriction, kind) for kind in ('users', 'teams', 'apps')},
            'allow_force_pushes': False, 'allow_deletions': False,
            **{key: enabled(current.get(key)) for key in
               ('required_linear_history', 'block_creations', 'required_conversation_resolution',
                'lock_branch', 'allow_fork_syncing')}}


def check_rules(rules, app_id):
    supported = {'pull_request', 'required_status_checks', 'non_fast_forward', 'deletion',
                 'required_signatures', 'required_linear_history', 'required_deployments',
                 'update', 'creation', 'required_code_scanning'}
    for rule in rules:
        kind = rule.get('type')
        if kind not in supported:
            raise InitError('Unsupported effective main rule: ' + str(kind) + '; preserve it and reconcile before writes.')
        if kind == 'required_status_checks':
            for check in rule.get('parameters', {}).get('required_status_checks', []):
                if check.get('context') == GATE and check.get('integration_id') not in (None, app_id):
                    raise InitError('An inherited CI gate source binding conflicts with the observed GitHub Actions App.')


def environment_plan(ctx, name):
    path = '/environments/' + name
    inventory = pages(ctx, '/environments', 'environments')
    names = [item.get('name') for item in inventory]
    if any(not isinstance(item, str) for item in names) or len(set(names)) != len(names):
        raise InitError('Deployment environment inventory is invalid or ambiguous.')
    current = api(ctx, path, absent=True)
    if (current is None) != (name not in names):
        raise InitError(name + ' environment access differs from the authoritative inventory; resolve access before writes.')
    if current is None:
        return {'current': None, 'policies': [], 'body': {
            'deployment_branch_policy': {'protected_branches': False, 'custom_branch_policies': True}},
            'add_branch': True}
    for rule in current.get('protection_rules', []):
        if rule.get('type') in {'required_reviewers', 'wait_timer'}:
            raise InitError(name + ' already has reviewer/wait protection; preserve it and reconcile that policy conflict.')
        if rule.get('type') != 'branch_policy':
            raise InitError(name + ' has unsupported deployment protection; preserve it and reconcile before writes.')
    policy = current.get('deployment_branch_policy')
    if policy is None:
        return {'current': current, 'policies': [], 'body': None, 'add_branch': False}
    if policy != {'protected_branches': False, 'custom_branch_policies': True}:
        raise InitError(name + ' uses protected-branch-only or unsupported deployment policy; preserve it and reconcile.')
    policies = pages(ctx, path + '/deployment-branch-policies', 'branch_policies')
    release = ctx.values['RELEASE_BRANCH']
    present = any(item.get('name') == release and item.get('type', 'branch') == 'branch' for item in policies)
    return {'current': current, 'policies': policies, 'body': None, 'add_branch': not present}


def snapshot(ctx, app_id):
    protection = api(ctx, '/branches/main/protection', absent=True)
    rules = pages(ctx, '/rules/branches/main')
    rulesets = pages(ctx, '/rulesets?includes_parents=true')
    check_rules(rules, app_id)
    desired = protection_body(protection, app_id)
    environments = {name: environment_plan(ctx, name) for name in ('staging', 'production')}
    return {'protection': protection, 'rules': rules, 'rulesets': rulesets,
            'desired': desired, 'environments': environments}


def source_app(ctx, workflow, job, conclusion='success'):
    url = urlsplit(job.get('check_run_url', ''))
    prefix = '/repos/' + ctx.values['REPOSITORY'] + '/check-runs/'
    if url.scheme != 'https' or url.netloc != 'api.github.com' or not url.path.startswith(prefix) or url.query or url.fragment:
        raise InitError('CI gate has no matching repository check-run identity.')
    check_id = positive(int(url.path[len(prefix):]) if url.path[len(prefix):].isdigit() else None, 'check-run ID')
    check = api(ctx, '/check-runs/' + str(check_id))
    suite = positive(workflow.get('check_suite_id'), 'CI check-suite ID')
    app = check.get('app', {})
    if (check.get('id') != check_id or check.get('name') != GATE or check.get('status') != 'completed'
            or check.get('conclusion') != conclusion or check.get('check_suite', {}).get('id') != suite
            or check.get('head_sha') != workflow.get('head_sha') or app.get('slug') != 'github-actions'):
        raise InitError('CI gate does not belong to the exact workflow source, check suite and GitHub Actions App.')
    return positive(app.get('id'), 'observed GitHub Actions App ID')


def initial_gate(ctx):
    repo = ctx.values['REPOSITORY']
    pulls = gh_json(ctx, '/pulls?state=open&base=main&head=' + repo.split('/')[0] + ':initialization/setup&per_page=2')
    if len(pulls) != 1:
        raise InitError('Require one open initialization PR with genuine successful CI before configuring policy.')
    number, sha = initialization_pr_identity(ctx, pulls[0])
    workflow, job = watch_initialization_ci(ctx, number, sha)
    return {'pr_number': number, 'source_sha': sha, 'run_id': positive(workflow.get('id')),
            'run_attempt': positive(workflow.get('run_attempt')), 'app_id': source_app(ctx, workflow, job)}


def protection_verified(current, desired, app_id):
    return (current is not None and enabled(current.get('enforce_admins'))
            and current.get('required_status_checks', {}).get('strict') is True
            and not enabled(current.get('allow_force_pushes'))
            and not enabled(current.get('allow_deletions'))
            and current.get('required_pull_request_reviews') is not None
            and any(item.get('context') == GATE and item.get('app_id') == app_id
                    for item in current.get('required_status_checks', {}).get('checks', []))
            and protection_body(current, app_id) == desired)


def same_settings(left, right):
    # API response metadata can change independently; compare owned semantics.
    return (left['desired'] == right['desired'] and left['rules'] == right['rules']
            and left['rulesets'] == right['rulesets'] and left['environments'] == right['environments']
            and enabled((left['protection'] or {}).get('required_signatures'))
            == enabled((right['protection'] or {}).get('required_signatures')))


def recheck_initial_gate(ctx, gate):
    if initial_gate(ctx) != gate:
        raise InitError('Initialization PR source, CI run/attempt or GitHub Actions App changed during policy setup; no stale gate can authorize settings.')


def configure_settings(ctx, gate):
    app_id = gate['app_id']
    before = snapshot(ctx, app_id)
    if not same_settings(before, snapshot(ctx, app_id)):
        raise InitError('Policy changed during preflight; no settings were written. Reinspect and resume.')
    # Persist intent before the first remote mutation, including interruption/transport uncertainty.
    update_state(ctx, github_policy_settings={'state': 'applying', **gate})
    if not protection_verified(before['protection'], before['desired'], app_id):
        if not same_settings(before, snapshot(ctx, app_id)):
            raise InitError('Policy changed before protection update; preserve settings and resume.')
        recheck_initial_gate(ctx, gate)
        if not same_settings(before, snapshot(ctx, app_id)):
            raise InitError('Policy changed immediately before protection update; stop and inspect.')
        api(ctx, '/branches/main/protection', method='PUT', body=before['desired'])
    readback = snapshot(ctx, app_id)
    if (not protection_verified(readback['protection'], before['desired'], app_id)
            or readback['rules'] != before['rules'] or readback['rulesets'] != before['rulesets']
            or enabled(readback['protection'].get('required_signatures'))
            != enabled((before['protection'] or {}).get('required_signatures'))):
        raise InitError('Main protection read-back differs from intended preserved policy; stop and inspect.')
    for name, plan in before['environments'].items():
        if environment_plan(ctx, name) != plan:
            raise InitError(name + ' changed before its update; stop and inspect before resuming.')
        path = '/environments/' + name
        if plan['body'] is not None:
            recheck_initial_gate(ctx, gate)
            if environment_plan(ctx, name) != plan:
                raise InitError(name + ' changed during CI recheck; preserve it and inspect before resuming.')
            api(ctx, path, method='PUT', body=plan['body'])
        if plan['add_branch']:
            # An uncertain successful previous creation is detected by this exact-name reread on resume.
            current = environment_plan(ctx, name)
            if current['add_branch']:
                recheck_initial_gate(ctx, gate)
                if environment_plan(ctx, name) != current:
                    raise InitError(name + ' changed during CI recheck; preserve it and inspect before resuming.')
                api(ctx, path + '/deployment-branch-policies', method='POST',
                    body={'name': ctx.values['RELEASE_BRANCH'], 'type': 'branch'})
        final = environment_plan(ctx, name)
        if final['current'] is None or final['add_branch']:
            raise InitError(name + ' deployment policy read-back is incomplete.')
        original = {(item.get('id'), item.get('name'), item.get('type', 'branch')) for item in plan['policies']}
        observed = {(item.get('id'), item.get('name'), item.get('type', 'branch')) for item in final['policies']}
        if not original <= observed:
            raise InitError(name + ' existing deployment patterns changed during configuration.')
    final = snapshot(ctx, app_id)
    if (not protection_verified(final['protection'], before['desired'], app_id)
            or final['rules'] != before['rules'] or final['rulesets'] != before['rulesets']
            or enabled((final['protection'] or {}).get('required_signatures'))
            != enabled((before['protection'] or {}).get('required_signatures'))):
        raise InitError('Effective main policy changed during environment configuration; inspect before resuming.')
    recheck_initial_gate(ctx, gate)
    update_state(ctx, github_policy_settings={'state': 'verified', **gate,
        'protection': final['desired'], 'effective_rules': final['rules'],
        'environments': {name: {'unrestricted': plan['current'].get('deployment_branch_policy') is None,
                              'release_branch': ctx.values['RELEASE_BRANCH']}
                         for name, plan in final['environments'].items()}})
    print('Read back main protection, effective rules, staging and production deployment policies.', flush=True)
    return final


def proof_conflict(settings):
    protection = settings['protection'] or {}
    review = protection.get('required_pull_request_reviews') or {}
    if (review.get('required_approving_review_count', 0) > 0 or review.get('require_code_owner_reviews')
            or review.get('require_last_push_approval') or enabled(protection.get('required_signatures'))
            or enabled(protection.get('block_creations')) or protection.get('restrictions') is not None):
        return True
    for rule in settings['rules']:
        params = rule.get('parameters', {})
        if rule['type'] in {'required_signatures', 'required_deployments', 'required_code_scanning', 'update', 'creation'}:
            return True
        if rule['type'] == 'pull_request' and (params.get('required_approving_review_count', 0) > 0
                or params.get('require_code_owner_review') or params.get('require_last_push_approval')):
            return True
    return False


def journal(ctx, probe, **changes):
    updated = dict(probe, **changes)
    update_state(ctx, **{PROBE_KEY: updated})
    probe.clear()
    probe.update(updated)


def ref_path(probe):
    return '/git/ref/heads/' + quote(probe['branch'], safe='/')


def fixture(probe, failing):
    marker = 'docs/initialization-protection-' + probe['nonce'] + '.md'
    test = 'infrastructure/ci/tests/test_initialization_protection_' + probe['nonce'] + '.py'
    content = '# Initialization branch protection check\n\nTask-owned probe ' + probe['nonce'] + '. This branch is never merged.\n'
    failure = ('"""Temporary task-owned protection probe; never merge this branch."""\n'
               'import unittest\n\nclass InitializationProtectionProbe(unittest.TestCase):\n'
               '    def test_required_gate_blocks_failure(self):\n'
               '        self.fail("Intentional initialization protection probe: ' + probe['nonce'] + '")\n')
    return [{'path': marker, 'mode': '100644', 'type': 'blob', 'content': content},
            {'path': test, 'mode': '100644', 'type': 'blob',
             **({'content': failure} if failing else {'sha': None})}]


def owned_commit(ctx, probe, sha, *, failing):
    """Prove the exact two-file tree and parent before following a remote ref."""
    commit = api(ctx, '/git/commits/' + observed_sha(sha))
    parent = probe['base_sha'] if failing else probe['failing_sha']
    if [item.get('sha') for item in commit.get('parents', [])] != [parent]:
        raise InitError('Protection probe commit parent changed; preserve the branch and inspect ownership.')
    parent_commit = api(ctx, '/git/commits/' + parent)
    tree = api(ctx, '/git/trees/' + commit['tree']['sha'])
    # Git tree API is recursive so compare exact path/blob/mode membership, not a diff truncated at 300 files.
    base = api(ctx, '/git/trees/' + parent_commit['tree']['sha'] + '?recursive=1')
    actual = api(ctx, '/git/trees/' + tree['sha'] + '?recursive=1')
    if base.get('truncated') is not False or actual.get('truncated') is not False:
        raise InitError('Probe tree inventory is truncated; ownership cannot be established.')
    expected = {item['path']: (item['mode'], item['type'], item['sha'])
                for item in base['tree'] if item.get('type') != 'tree'}
    for item in fixture(probe, failing):
        if item.get('sha', '') is None:
            expected.pop(item['path'], None)
        else:
            data = item['content'].encode()
            digest = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
            expected[item['path']] = (item['mode'], item['type'], digest)
    observed = {item['path']: (item['mode'], item['type'], item['sha'])
                for item in actual['tree'] if item.get('type') != 'tree'}
    if observed != expected:
        raise InitError('Protection probe tree contains unowned changes; preserve it and inspect.')
    return commit


def make_commit(ctx, probe, *, failing):
    key = 'failing_sha' if failing else 'corrected_sha'
    if probe.get(key):
        owned_commit(ctx, probe, probe[key], failing=failing)
        return probe[key]
    parent = probe['base_sha'] if failing else probe['failing_sha']
    parent_commit = api(ctx, '/git/commits/' + parent)
    if failing:
        inventory = api(ctx, '/git/trees/' + parent_commit['tree']['sha'] + '?recursive=1')
        if inventory.get('truncated') is not False or any(item.get('path') in {entry['path'] for entry in fixture(probe, True)}
                                                        for item in inventory.get('tree', [])):
            raise InitError('Probe paths already exist or the base tree is incomplete; no branch was created.')
    tree = api(ctx, '/git/trees', method='POST', body={
        'base_tree': parent_commit['tree']['sha'], 'tree': fixture(probe, failing)})
    commit = api(ctx, '/git/commits', method='POST', body={
        'message': 'Test initialization protection: ' + ('failing' if failing else 'corrected') + ' ' + probe['nonce'],
        'tree': tree['sha'], 'parents': [parent]})
    sha = observed_sha(commit.get('sha'))
    journal(ctx, probe, **{key: sha})
    owned_commit(ctx, probe, sha, failing=failing)
    return sha


def probe_pull(ctx, probe, *, open_only=True):
    pull = api(ctx, '/pulls/' + str(positive(probe.get('pr_number'), 'probe PR number')))
    repo = ctx.values['REPOSITORY'].lower()
    expected = probe.get('corrected_sha') if probe.get('phase') in {'corrected', 'green', 'closing', 'complete'} else probe.get('failing_sha')
    if (pull.get('number') != probe['pr_number'] or pull.get('head', {}).get('ref') != probe['branch']
            or pull.get('head', {}).get('sha') != expected or pull.get('base', {}).get('ref') != 'main'
            or any(pull.get(side, {}).get('repo', {}).get('full_name', '').lower() != repo for side in ('head', 'base'))
            or pull.get('merged_at') is not None or pull.get('body') != probe['body']
            or (open_only and pull.get('state') != 'open')):
        raise InitError('Protection probe PR identity changed; preserve artifacts and inspect before resuming.')
    return pull


def graph_pull(ctx, number):
    owner, name = ctx.values['REPOSITORY'].split('/')
    data = api(ctx, 'graphql', method='POST', body={'query': '''query($owner:String!,$name:String!,$number:Int!) {
      repository(owner:$owner,name:$name) { pullRequest(number:$number) {
        number headRefOid baseRefOid mergeable mergeStateStatus reviewDecision
        reviews(first:100) { totalCount nodes { state } }
      } }
    }''', 'variables': {'owner': owner, 'name': name, 'number': number}})
    if data.get('errors') or not isinstance(data.get('data', {}).get('repository', {}).get('pullRequest'), dict):
        raise InitError('GitHub mergeability observation failed; no enforcement proof recorded.')
    return data['data']['repository']['pullRequest']


def probe_gate(ctx, probe, *, failing):
    sha = probe['failing_sha'] if failing else probe['corrected_sha']
    deadline = time.monotonic() + 3600
    selected = None
    while time.monotonic() < deadline:
        probe_pull(ctx, probe)
        runs = pages(ctx, '/actions/workflows/ci.yml/runs?event=pull_request&head_sha=' + sha, 'workflow_runs')
        matching = [item for item in runs if item.get('head_sha') == sha and item.get('head_branch') == probe['branch']
                    and item.get('event') == 'pull_request' and item.get('path') == '.github/workflows/ci.yml'
                    and item.get('repository', {}).get('full_name', '').lower() == ctx.values['REPOSITORY'].lower()
                    and any(pull.get('number') == probe['pr_number'] for pull in item.get('pull_requests', []))]
        if matching:
            latest = max(matching, key=lambda item: positive(item.get('id')))
            identity = (positive(latest.get('id')), positive(latest.get('run_attempt')))
            if selected is not None and identity != selected:
                raise InitError('Protection probe CI run/attempt changed while observing; inspect and resume.')
            selected = identity
            observed = api(ctx, '/actions/runs/' + str(selected[0]))
            if any(observed.get(key) != latest.get(key) for key in
                   ('id', 'run_attempt', 'head_sha', 'head_branch', 'event', 'path', 'check_suite_id')):
                raise InitError('Protection probe CI identity changed.')
            if observed.get('status') == 'completed':
                conclusion = 'failure' if failing else 'success'
                jobs = pages(ctx, '/actions/runs/' + str(selected[0]) + '/attempts/' + str(selected[1]) + '/jobs', 'jobs')
                gates = [job for job in jobs if job.get('name') == GATE]
                foundations = [job for job in jobs if job.get('name') == 'Foundation verification']
                if (observed.get('conclusion') != conclusion or len(gates) != 1
                        or gates[0].get('conclusion') != conclusion
                        or (failing and (len(foundations) != 1 or foundations[0].get('conclusion') != 'failure'))):
                    raise InitError('Protection probe did not produce the required genuine ' + conclusion + ' CI gate.')
                if source_app(ctx, observed, gates[0], conclusion) != probe['app_id']:
                    raise InitError('Protection probe gate App source changed.')
                final = api(ctx, '/actions/runs/' + str(selected[0]))
                if any(final.get(key) != observed.get(key) for key in
                       ('id', 'run_attempt', 'head_sha', 'check_suite_id', 'status', 'conclusion')):
                    raise InitError('Protection probe CI attempt changed during gate inspection.')
                probe_pull(ctx, probe)
                return {'run_id': selected[0], 'run_attempt': selected[1], 'source_sha': sha,
                        'check_suite_id': observed['check_suite_id'], 'conclusion': conclusion}
        print('Waiting for the protection probe\'s exact ' + ('failing' if failing else 'corrected')
              + ' CI gate; this can take several minutes.', flush=True)
        time.sleep(10)
    raise InitError('Protection probe CI wait exceeded one hour; artifacts are preserved for resume.')


def recheck_probe_evidence(ctx, probe, evidence, *, conclusion='success'):
    source = probe.get('corrected_sha' if conclusion == 'success' else 'failing_sha')
    if (not isinstance(evidence, dict) or evidence.get('conclusion') != conclusion
            or evidence.get('source_sha') != source):
        raise InitError('Protection probe evidence is missing; preserve artifacts and reconcile.')
    path = '/actions/runs/' + str(positive(evidence.get('run_id')))
    observed = api(ctx, path)
    expected = {'id': evidence['run_id'], 'run_attempt': positive(evidence.get('run_attempt')),
                'head_sha': observed_sha(evidence.get('source_sha')),
                'check_suite_id': positive(evidence.get('check_suite_id')),
                'status': 'completed', 'conclusion': evidence.get('conclusion'),
                'head_branch': probe['branch'], 'event': 'pull_request', 'path': '.github/workflows/ci.yml'}
    if (any(observed.get(key) != value for key, value in expected.items())
            or observed.get('repository', {}).get('full_name', '').lower() != ctx.values['REPOSITORY'].lower()
            or not any(pull.get('number') == probe['pr_number'] for pull in observed.get('pull_requests', []))):
        raise InitError('Protection probe CI run, source or attempt changed before recording proof; preserve artifacts and inspect.')
    jobs = pages(ctx, path + '/attempts/' + str(evidence['run_attempt']) + '/jobs', 'jobs')
    gates = [job for job in jobs if job.get('name') == GATE]
    if (len(gates) != 1 or gates[0].get('status') != 'completed'
            or gates[0].get('conclusion') != evidence['conclusion']
            or source_app(ctx, observed, gates[0], evidence['conclusion']) != probe['app_id']):
        raise InitError('Protection probe check identity changed before recording proof.')
    final = api(ctx, path)
    if any(final.get(key) != value for key, value in expected.items()):
        raise InitError('Protection probe CI attempt changed during final evidence inspection.')


def prove_mergeability(ctx, probe, *, failing):
    deadline = time.monotonic() + 180
    sha = probe['failing_sha'] if failing else probe['corrected_sha']
    while time.monotonic() < deadline:
        pull = probe_pull(ctx, probe)
        main = api(ctx, '/git/ref/heads/main')['object']['sha']
        if main != probe['base_sha'] or pull.get('base', {}).get('sha') != main:
            raise InitError('Main advanced during the protection probe; preserve artifacts and reconcile the proof base.')
        observed = graph_pull(ctx, probe['pr_number'])
        if observed.get('headRefOid') != sha or observed.get('baseRefOid') != main:
            raise InitError('Protection probe mergeability source changed.')
        if observed.get('mergeable') != 'UNKNOWN' and observed.get('mergeStateStatus') != 'UNKNOWN':
            reviews = observed.get('reviews', {})
            if reviews.get('totalCount') != len(reviews.get('nodes', [])):
                raise InitError('Protection probe review inventory is incomplete.')
            if any(item.get('state') == 'APPROVED' for item in reviews.get('nodes', [])):
                raise InitError('Protection probe received an approval; zero-approval behavior is not proven.')
            wanted = 'BLOCKED' if failing else 'CLEAN'
            if observed.get('mergeStateStatus') == wanted and observed.get('mergeable') == 'MERGEABLE':
                return {'merge_state': wanted, 'approvals': 0, 'base_sha': main}
            if not failing and observed.get('mergeStateStatus') not in {'BEHIND', 'BLOCKED'}:
                raise InitError('Corrected protection probe is not mergeable under the preserved effective policy.')
        print('Waiting for GitHub to calculate protection probe mergeability...', flush=True)
        time.sleep(5)
    raise InitError('Protection probe remains blocked or has unknown mergeability; preserve stronger policy and inspect other required evidence.')


def delete_owned_ref(ctx, probe):
    repository = api(ctx, '')
    if (repository.get('id') != positive(read_state(ctx).get('repository_id'))
            or repository.get('full_name', '').lower() != ctx.values['REPOSITORY'].lower()
            or not isinstance(repository.get('node_id'), str) or not repository['node_id']):
        raise InitError('Repository identity changed before atomic protection branch cleanup.')
    result = api(ctx, 'graphql', method='POST', body={
        'query': '''mutation($input:UpdateRefsInput!) { updateRefs(input:$input) { clientMutationId } }''',
        'variables': {'input': {'repositoryId': repository['node_id'], 'clientMutationId': probe['nonce'],
            'refUpdates': [{'name': 'refs/heads/' + probe['branch'],
                            'beforeOid': observed_sha(probe['corrected_sha']),
                            'afterOid': '0' * 40, 'force': False}]}}})
    if (result.get('errors') or result.get('data', {}).get('updateRefs', {}).get('clientMutationId') != probe['nonce']):
        raise InitError('Atomic protection branch cleanup failed or became uncertain; preserve artifacts and resume after inspection.')


def policy_fingerprint(settings):
    # Exclude timestamps, URLs and display names, retain all effective behavior and provenance.
    def meaningful(item):
        return {key: value for key, value in item.items()
                if key not in {'created_at', 'updated_at', 'url', '_links', 'name'}}
    protection = settings['protection'] or {}
    behavior = {'classic': settings['desired'],
                'observed_enforce_admins': enabled(protection.get('enforce_admins')),
                'observed_strict': (protection.get('required_status_checks') or {}).get('strict'),
                'observed_gate_checks': (protection.get('required_status_checks') or {}).get('checks', []),
                'observed_pr_required': protection.get('required_pull_request_reviews') is not None,
                'observed_force_pushes': enabled(protection.get('allow_force_pushes')),
                'observed_deletions': enabled(protection.get('allow_deletions')),
                'required_signatures': enabled((settings['protection'] or {}).get('required_signatures')),
                'effective_rules': sorted((meaningful(item) for item in settings['rules']),
                                          key=lambda item: json.dumps(item, sort_keys=True)),
                'rulesets': sorted((meaningful(item) for item in settings['rulesets']),
                                   key=lambda item: json.dumps(item, sort_keys=True))}
    def normalized(value):
        if isinstance(value, dict):
            return {key: normalized(item) for key, item in value.items()}
        if isinstance(value, list):
            return sorted((normalized(item) for item in value), key=lambda item: json.dumps(item, sort_keys=True))
        return value
    return hashlib.sha256(json.dumps(normalized(behavior), sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def final_settings_readback(ctx, gate, settings, probe):
    """Observe final acceptance without repairing settings that changed during proof."""
    current = snapshot(ctx, gate['app_id'])
    if (not protection_verified(current['protection'], settings['desired'], gate['app_id'])
            or policy_fingerprint(current) != probe['policy_sha256']):
        raise InitError('Effective policy changed during the protection proof; preserve artifacts and inspect.')
    for name, plan in current['environments'].items():
        if plan['current'] is None or plan['add_branch']:
            raise InitError(name + ' environment or selected release branch policy changed during the protection proof; '
                            'preserve artifacts and reconcile before resuming. No settings were repaired.')


def verify_protection(ctx, gate, settings):
    if proof_conflict(settings):
        raise InitError('Settings are verified, but stronger existing approval, signature or restricted-push rules prevent automatic zero-approval proof. They were preserved; enforcement proof remains incomplete.')
    probe = copy.deepcopy(read_state(ctx).get(PROBE_KEY))
    if probe is None:
        nonce = uuid.uuid4().hex[:16]
        base = observed_sha(api(ctx, '/git/ref/heads/main')['object']['sha'])
        probe = {'schema': 1, 'repository_id': positive(read_state(ctx).get('repository_id')),
                 'app_id': gate['app_id'], 'nonce': nonce, 'branch': 'initialization/protection-' + nonce,
                 'base_sha': base, 'phase': 'intent', 'policy_sha256': policy_fingerprint(settings),
                 'body': 'Task-owned initialization protection probe ' + nonce + '. Never merge this PR.'}
        journal(ctx, probe)
    if (not isinstance(probe, dict) or probe.get('schema') != 1 or probe.get('repository_id') != read_state(ctx).get('repository_id')
            or probe.get('app_id') != gate['app_id'] or not re.fullmatch('[0-9a-f]{16}', probe.get('nonce', ''))
            or probe.get('branch') != 'initialization/protection-' + probe['nonce']
            or probe.get('body') != 'Task-owned initialization protection probe ' + probe['nonce'] + '. Never merge this PR.'
            or probe.get('phase') not in {'intent', 'failing', 'blocked', 'corrected', 'green', 'closing', 'complete'}):
        raise InitError('Recorded protection probe ownership is invalid; preserve artifacts and reconcile.')
    if probe.get('policy_sha256') != policy_fingerprint(settings):
        raise InitError('Effective protection policy changed since this probe began; preserve artifacts and deliberately reconcile or start a new proof.')
    if probe['phase'] == 'complete':
        if api(ctx, ref_path(probe), absent=True) is not None:
            raise InitError('Completed protection probe branch reappeared; preserve it and inspect ownership.')
        pull = probe_pull(ctx, probe, open_only=False)
        recheck_probe_evidence(ctx, probe, probe.get('green'))
        if pull.get('state') != 'closed' or not probe.get('blocked') or not probe.get('green'):
            raise InitError('Completed protection proof artifacts differ; inspect before accepting readiness.')
        final_settings_readback(ctx, gate, settings, probe)
        print('Existing completed protection proof verified; its PR remains closed and unmerged.', flush=True)
        return
    if probe['phase'] not in {'green', 'closing'}:
        failing_sha = make_commit(ctx, probe, failing=True)
        ref = api(ctx, ref_path(probe), absent=True)
        if ref is None:
            if probe['phase'] != 'intent':
                raise InitError('Unfinished owned protection branch disappeared; preserve the journal and inspect.')
            api(ctx, '/git/refs', method='POST', body={'ref': 'refs/heads/' + probe['branch'], 'sha': failing_sha})
            ref = api(ctx, ref_path(probe))
        allowed = {probe['failing_sha']}
        if probe.get('corrected_sha'):
            allowed.add(probe['corrected_sha'])
        if ref.get('ref') != 'refs/heads/' + probe['branch'] or ref.get('object', {}).get('sha') not in allowed:
            raise InitError('Protection branch contains unowned commits; preserve it and inspect.')
        if not probe.get('pr_number'):
            pulls = pages(ctx, '/pulls?state=all&base=main&head=' + ctx.values['GH_ORG'] + ':' + probe['branch'])
            if len(pulls) > 1:
                raise InitError('Multiple protection probe PRs exist; preserve them and reconcile ownership.')
            if not pulls:
                api(ctx, '/pulls', method='POST', body={'title': 'Verify initialization branch protection',
                    'head': probe['branch'], 'base': 'main', 'body': probe['body']})
                pulls = pages(ctx, '/pulls?state=all&base=main&head=' + ctx.values['GH_ORG'] + ':' + probe['branch'])
            if len(pulls) != 1:
                raise InitError('Protection probe PR creation is unresolved; resume to reconcile before retrying.')
            journal(ctx, probe, pr_number=positive(pulls[0].get('number')), phase='failing')
        print('Protection probe PR: https://github.com/' + ctx.values['REPOSITORY'] + '/pull/' + str(probe['pr_number']), flush=True)
        if probe['phase'] in {'intent', 'failing'}:
            failed = probe_gate(ctx, probe, failing=True)
            blocked = prove_mergeability(ctx, probe, failing=True)
            recheck_probe_evidence(ctx, probe, failed, conclusion='failure')
            journal(ctx, probe, blocked={**failed, **blocked}, phase='blocked')
        if probe['phase'] == 'blocked':
            corrected = make_commit(ctx, probe, failing=False)
            ref = api(ctx, ref_path(probe))
            if ref.get('object', {}).get('sha') not in {failing_sha, corrected}:
                raise InitError('Protection branch advanced outside this task; preserve it and inspect.')
            if ref['object']['sha'] == failing_sha:
                api(ctx, '/git/refs/heads/' + quote(probe['branch'], safe='/'), method='PATCH',
                    body={'sha': corrected, 'force': False})
            journal(ctx, probe, phase='corrected')
        if probe['phase'] == 'corrected':
            green = probe_gate(ctx, probe, failing=False)
            mergeable = prove_mergeability(ctx, probe, failing=False)
            recheck_probe_evidence(ctx, probe, green)
            journal(ctx, probe, green={**green, **mergeable}, phase='green')
    if probe['phase'] in {'green', 'closing'}:
        recheck_probe_evidence(ctx, probe, probe.get('green'))
        # Recheck final settings and exact branch before deleting task-owned artifacts.
        final_settings_readback(ctx, gate, settings, probe)
        pull = probe_pull(ctx, probe, open_only=False)
        owned_commit(ctx, probe, probe['corrected_sha'], failing=False)
        journal(ctx, probe, phase='closing')
        if pull.get('state') == 'open':
            api(ctx, '/pulls/' + str(probe['pr_number']), method='PATCH', body={'state': 'closed'})
        if probe_pull(ctx, probe, open_only=False).get('state') != 'closed':
            raise InitError('Protection probe PR did not close; branch retained.')
        ref = api(ctx, ref_path(probe), absent=True)
        if ref is not None:
            if ref.get('object', {}).get('sha') != probe['corrected_sha']:
                raise InitError('Protection branch changed before cleanup; preserve it and inspect.')
            delete_owned_ref(ctx, probe)
        if api(ctx, ref_path(probe), absent=True) is not None:
            raise InitError('Protection branch deletion remains unresolved; resume to reconcile.')
        final_settings_readback(ctx, gate, settings, probe)
        journal(ctx, probe, phase='complete')
    print('Proved failing CI gate blocks merging and corrected green permits it with zero approvals. Probe PR closed; owned branch removed. Nothing was merged.', flush=True)


def configure(args):
    ctx = context(args, consumer=True)
    path = ctx.env_path.parent / '.github-policy.lock'
    try:
        descriptor = os.open(path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    except OSError:
        raise InitError('Cannot acquire the protected policy step lock; inspect private path ownership and permissions.') from None
    try:
        info = os.fstat(descriptor)
        if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid()
                or stat.S_IMODE(info.st_mode) != 0o600):
            raise InitError('Policy step lock must be an owner-only regular file.')
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise InitError('Another policy step is running for these values; wait for it before resuming.') from None
        configure_locked(ctx, args)
    finally:
        os.close(descriptor)


def configure_locked(ctx, args):
    resume = shlex.join(['python3', '-B', 'docs/template-initialization/scripts/12_2_configure_github_policy.py',
                         '--env', str(ctx.env_path), *(['--verify-protection'] if args.verify_protection else [])])
    try:
        verify_github(ctx, 'resume')
        gate = initial_gate(ctx)
        settings = configure_settings(ctx, gate)
        if args.verify_protection:
            verify_protection(ctx, gate, settings)
        else:
            print('Settings verified; merge enforcement proof is incomplete. Rerun with --verify-protection before continuing initialization.', flush=True)
    except (InitError, KeyboardInterrupt) as error:
        message = str(error) if isinstance(error, InitError) else 'Interrupted; existing settings and task-owned probe artifacts are preserved.'
        raise InitError(message + ' Resume with: ' + resume) from None


def cli():
    arguments = parser('Configure consumer main protection and deployment environments; preserve stronger policy.')
    arguments.add_argument('--verify-protection', action='store_true',
                           help='Create a resumable failing/corrected validation PR, prove merge enforcement, then close it without merging.')
    args = arguments.parse_args()
    try:
        configure(args)
    except InitError as error:
        print('Initialization stopped: ' + str(error), file=sys.stderr)
        raise SystemExit(1) from None
