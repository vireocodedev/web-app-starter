"""Root-only GitHub App credentials; installation tokens never enter job inputs."""
import base64
from datetime import datetime
from functools import lru_cache
import json
from pathlib import Path
import subprocess
import ssl
import time
import urllib.error
import urllib.request


@lru_cache(maxsize=1)
def https_context():
    context = ssl.create_default_context()
    context.set_alpn_protocols(['http/1.1'])
    return context


def https_opener(*handlers):
    # Reuse the native trust store, not mutable request/handler state or credentials.
    return urllib.request.build_opener(*handlers, urllib.request.HTTPSHandler(context=https_context()))


def validate_settings(value, error):
    if type(value) is not dict or set(value) != {'app_id', 'installation_id', 'owner'}:
        raise error('invalid-github-app-settings')
    if type(value['owner']) is not str or not value['owner']:
        raise error('invalid-github-app-settings')
    pending = value['app_id'] is None and value['installation_id'] is None
    if not pending and any(type(value[key]) is not int or value[key] <= 0
                           for key in ('app_id', 'installation_id')):
        raise error('invalid-github-app-settings')
    return value


class GitHubAppCredentials:
    def __init__(self, settings, key_path, protect_key, validate_repository, error):
        self.error = error
        self.settings = validate_settings(settings, error)
        validate_repository(settings['owner'] + '/settings-check')
        if settings['app_id'] is None:
            raise error('github-app-not-configured')
        self.key_path = Path(key_path)
        self.protect_key = protect_key
        self.validate_repository = validate_repository
        self.tokens = {}

    def jwt(self):
        self.protect_key(self.key_path)
        now = int(time.time())
        encode = lambda value: base64.urlsafe_b64encode(value).rstrip(b'=')
        header = encode(json.dumps({'alg': 'RS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
        claims = encode(json.dumps({'iat': now - 60, 'exp': now + 540,
                                    'iss': str(self.settings['app_id'])}, separators=(',', ':')).encode())
        message = header + b'.' + claims
        try:
            signature = subprocess.run(
                ['/usr/bin/openssl', 'dgst', '-sha256', '-sign', str(self.key_path)],
                input=message, capture_output=True, timeout=15, env={'PATH': '/usr/bin:/bin'})
        except (OSError, subprocess.TimeoutExpired):
            raise self.error('github-app-signing-failed') from None
        if signature.returncode or not signature.stdout:
            raise self.error('github-app-signing-failed')
        return (message + b'.' + encode(signature.stdout)).decode('ascii')

    def request(self, jwt, suffix, method='GET', payload=None):
        error_type = self.error

        class RejectRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, request, fp, code, message, headers, new_url):
                raise error_type('github-app-api-redirect-rejected')

        request = urllib.request.Request(
            'https://api.github.com/app/installations/' + str(self.settings['installation_id']) + suffix,
            data=json.dumps(payload).encode() if payload is not None else None, method=method,
            headers={'Authorization': 'Bearer ' + jwt, 'Accept': 'application/vnd.github+json',
                     'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'web-app-ci-controller',
                     'Content-Type': 'application/json'})
        try:
            with https_opener(RejectRedirect()).open(request, timeout=30) as response:
                result = json.loads(response.read(1024 * 1024))
        except (urllib.error.URLError, ValueError, TimeoutError):
            raise self.error('github-app-api-request-failed') from None
        if type(result) is not dict:
            raise self.error('invalid-github-app-response')
        return result

    def token_for(self, repository):
        self.validate_repository(repository)
        owner, name = repository.split('/')
        if owner.lower() != self.settings['owner'].lower():
            raise self.error('github-app-repository-owner-rejected')
        cached = self.tokens.get(repository.lower())
        if cached and time.time() < cached[1] - 60:
            return cached[0]
        jwt = self.jwt()
        installation = self.request(jwt, '')
        account = installation.get('account')
        permissions = installation.get('permissions')
        if (type(installation.get('id')) is not int
                    or type(installation.get('app_id')) is not int
                    or installation.get('id') != self.settings['installation_id']
                    or installation.get('app_id') != self.settings['app_id']
                    or type(account) is not dict
                    or account.get('type') != 'Organization'
                    or type(account.get('login')) is not str
                    or account['login'].lower() != self.settings['owner'].lower()
                    or installation.get('repository_selection') != 'selected'
                    or installation.get('suspended_at') is not None
                    or type(permissions) is not dict
                    or permissions.get('actions') != 'read'
                    or permissions.get('administration') != 'write'
                    or not set(permissions) <= {'actions', 'administration', 'metadata'}
                    or permissions.get('metadata', 'read') != 'read'):
            raise self.error('github-app-installation-policy-rejected')
        result = self.request(jwt, '/access_tokens', 'POST',
                              {'repositories': [name],
                               'permissions': {'actions': 'read', 'administration': 'write'}})
        token = result.get('token')
        try:
            expires = datetime.fromisoformat(result['expires_at'].replace('Z', '+00:00'))
            if expires.tzinfo is None:
                raise ValueError
            expiry = expires.timestamp()
        except (KeyError, TypeError, ValueError, AttributeError):
            raise self.error('invalid-github-app-token-expiry') from None
        if (type(token) is not str or not token or any(character.isspace() for character in token)
                or expiry <= time.time() + 60):
            raise self.error('invalid-github-app-token')
        self.tokens[repository.lower()] = (token, expiry)
        return token
