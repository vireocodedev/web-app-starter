"""Bounded GitHub transport and the immutable paired-release contract."""
import base64
import hashlib
import io
import json
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import zipfile


class ReleaseError(Exception):
    """Credential-free categories; never include API bodies or command output."""


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        return None


def command(*args, input_bytes=None, timeout=180, env=None):
    try:
        result = subprocess.run(args, input=input_bytes, capture_output=True, timeout=timeout, env=env)
    except (OSError, subprocess.TimeoutExpired):
        raise ReleaseError('command-unavailable-or-timed-out') from None
    if result.returncode:
        raise ReleaseError('command-failed-' + args[0].rsplit('/', 1)[-1])
    return result.stdout


def decode(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ReleaseError('duplicate-json-key')
            result[key] = value
        return result

    try:
        return json.loads(raw, object_pairs_hook=unique)
    except (ValueError, UnicodeError):
        raise ReleaseError('invalid-json') from None


def bearer(value):
    if not isinstance(value, str) or not 20 <= len(value) <= 16384 or any(
            ord(character) <= 32 or ord(character) >= 127 for character in value):
        raise ReleaseError('invalid-bearer')
    return value


def repository(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]*/[a-z0-9][a-z0-9_.-]*', value):
        raise ReleaseError('invalid-repository')
    return value


def positive(value):
    if type(value) is not int or value <= 0:
        raise ReleaseError('invalid-positive-id')
    return value


def pair(value, repo, sha):
    repository(repo)
    if not isinstance(sha, str) or not re.fullmatch('[0-9a-f]{40}', sha):
        raise ReleaseError('invalid-source-sha')
    if not isinstance(value, dict) or set(value) != {'source_sha', 'repository', 'frontend', 'backend'}:
        raise ReleaseError('invalid-pair-fields')
    if value['source_sha'] != sha or value['repository'] != repo:
        raise ReleaseError('pair-source-mismatch')
    for component in ('frontend', 'backend'):
        prefix = 'ghcr.io/' + repo + '-' + component + '@sha256:'
        image = value[component]
        if not isinstance(image, str) or not image.startswith(prefix) or not re.fullmatch(
                '[0-9a-f]{64}', image[len(prefix):]):
            raise ReleaseError('invalid-image-digest')
    return value


class GitHub:
    def __init__(self, token):
        self.token = bearer(token)

    def request(self, path, method='GET', payload=None, redirect=False):
        if not path.startswith('/repos/') and not path.startswith('/orgs/'):
            raise ReleaseError('github-path-rejected')
        request = urllib.request.Request(
            'https://api.github.com' + path, method=method,
            data=json.dumps(payload).encode() if payload is not None else None,
            headers={'Authorization': 'Bearer ' + self.token, 'Accept': 'application/vnd.github+json',
                     'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json',
                     'User-Agent': 'vireo-paired-release'})
        try:
            with urllib.request.build_opener(NoRedirect()).open(request, timeout=30) as response:
                raw = response.read(2 * 1024 * 1024 + 1)
        except urllib.error.HTTPError as error:
            if redirect and error.code == 302:
                return error.headers.get('Location', '')
            raise ReleaseError('github-http-' + str(error.code)) from None
        except (urllib.error.URLError, TimeoutError):
            raise ReleaseError('github-unreachable') from None
        if len(raw) > 2 * 1024 * 1024:
            raise ReleaseError('github-response-too-large')
        return decode(raw) if raw else None

    def artifact(self, repo, run_id, name, member, maximum=65536):
        root = '/repos/' + repository(repo)
        items = self.request(root + f'/actions/runs/{positive(run_id)}/artifacts?per_page=100')
        if items.get('total_count', 101) > 100:
            raise ReleaseError('artifact-inventory-too-large')
        matches = [item for item in items['artifacts'] if item['name'] == name]
        if len(matches) != 1 or matches[0]['expired'] or matches[0]['size_in_bytes'] > maximum:
            raise ReleaseError('artifact-absent-ambiguous-or-oversized')
        location = self.request(root + '/actions/artifacts/' + str(positive(matches[0]['id'])) + '/zip',
                                redirect=True)
        parsed = urllib.parse.urlsplit(location)
        if (parsed.scheme != 'https' or parsed.username or parsed.password or parsed.port not in (None, 443)
                or not parsed.hostname or not parsed.hostname.endswith('.blob.core.windows.net')):
            raise ReleaseError('artifact-download-host-rejected')
        try:
            with urllib.request.build_opener(NoRedirect()).open(location, timeout=30) as response:
                data = response.read(maximum + 1)
        except (urllib.error.URLError, TimeoutError):
            raise ReleaseError('artifact-download-failed') from None
        if len(data) > maximum:
            raise ReleaseError('artifact-download-too-large')
        expected_digest = matches[0].get('digest')
        if expected_digest != 'sha256:' + hashlib.sha256(data).hexdigest():
            raise ReleaseError('artifact-digest-mismatch')
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                if archive.namelist() != [member] or archive.getinfo(member).file_size > maximum:
                    raise ReleaseError('artifact-members-rejected')
                return archive.read(member)
        except (zipfile.BadZipFile, RuntimeError, OSError):
            raise ReleaseError('artifact-zip-invalid') from None

    def file(self, repo, sha, path):
        value = self.request('/repos/' + repo + '/contents/' + path + '?ref=' + sha)
        if value.get('encoding') != 'base64' or value.get('size', 262145) > 262144:
            raise ReleaseError('workflow-source-size-or-encoding')
        try:
            return base64.b64decode(value['content'], validate=False)
        except (ValueError, KeyError):
            raise ReleaseError('workflow-source-invalid') from None


def private_packages(api, repo):
    owner, name = repository(repo).split('/')
    for component in ('frontend', 'backend'):
        result = api.request('/orgs/' + owner + '/packages/container/' + name + '-' + component)
        if result.get('visibility') != 'private' or result.get('package_type') != 'container':
            raise ReleaseError('package-not-private-container')


def status(api, repo, deployment_id, state, description):
    api.request('/repos/' + repo + f'/deployments/{positive(deployment_id)}/statuses', 'POST',
                {'state': state, 'description': description, 'auto_inactive': False})
