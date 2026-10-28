"""Host-only metadata inventory; the fixed shared signer never leaves the host."""
from datetime import datetime
import importlib.util
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request

from _state import Error, ROOT
from _github_bootstrap import CI_PERMISSIONS

SETTINGS = Path('/etc/web-app-ci/github-app.json')
KEY = Path('/etc/web-app-ci/github-app.pem')
MAXIMUM = 1024 * 1024
MAX_REPOSITORIES = 10000


def owners():
    # The caller checks the clean, root-controlled canonical source each time.
    sys.path.insert(0, str(ROOT / 'infrastructure/release'))
    spec = importlib.util.spec_from_file_location('deletion_release_controller', ROOT / 'infrastructure/release/controller.py')
    controller = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(controller)
    spec = importlib.util.spec_from_file_location('deletion_app_signer', ROOT / 'infrastructure/ci/ci-runner/github_app.py')
    signer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(signer)
    import protocol
    return controller, signer, protocol


def token_request(protocol, token, path, method='GET'):
    if not (method == 'GET' and re.fullmatch(r'/installation/repositories\?per_page=100&page=[1-9][0-9]{0,2}', path)
            or method == 'DELETE' and path == '/installation/token'):
        raise Error('App inventory endpoint is outside its read/revoke contract.')
    request = urllib.request.Request('https://api.github.com' + path, method=method,
        headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'web-app-project-deletion'})
    try:
        with protocol.https_opener(protocol.NoRedirect()).open(request, timeout=30) as response:
            if response.status != (204 if method == 'DELETE' else 200):
                raise Error('App inventory/revocation status was not confirmed.')
            raw = response.read(MAXIMUM + 1)
        if len(raw) > MAXIMUM:
            raise Error('App inventory response exceeds its bound.')
        if method == 'DELETE':
            if raw:
                raise Error('App inventory token revocation response was unexpected.')
            return None
        return protocol.decode(raw)
    except (urllib.error.URLError, OSError, TimeoutError, ValueError, protocol.ReleaseError):
        raise Error('App inventory/revocation failed; access and absence remain unverified.') from None


def repositories(protocol, token, owner):
    identifiers = set()
    expected_total = None
    for page in range(1, 102):
        value = token_request(protocol, token, '/installation/repositories?per_page=100&page=' + str(page))
        if not isinstance(value, dict) or type(value.get('total_count')) is not int:
            raise Error('App repository inventory total is invalid.')
        total = value['total_count']
        batch = value.get('repositories')
        if (not 0 <= total <= MAX_REPOSITORIES or not isinstance(batch, list) or len(batch) > 100
                or expected_total is not None and total != expected_total):
            raise Error('App repository inventory changed or exceeded its reviewed bound.')
        expected_total = total
        for item in batch:
            if (not isinstance(item, dict) or type(item.get('id')) is not int or item['id'] <= 0
                    or item['id'] in identifiers or not isinstance(item.get('owner'), dict)
                    or str(item['owner'].get('login', '')).lower() != owner.lower()
                    or item['owner'].get('type') != 'Organization'
                    or not isinstance(item.get('full_name'), str)
                    or len(item['full_name'].split('/')) != 2
                    or not item['full_name'].split('/')[1]
                    or item['full_name'].split('/')[0].lower() != owner.lower()):
                raise Error('App repository inventory identity is ambiguous or foreign.')
            identifiers.add(item['id'])
        if len(identifiers) > total:
            raise Error('App repository inventory count changed.')
        if len(batch) < 100:
            if len(identifiers) != total:
                raise Error('App repository inventory is incomplete.')
            return sorted(identifiers)
    raise Error('App repository inventory exceeds its pagination bound.')


def inspect(identity):
    controller, signer, protocol = owners()
    token = None
    try:
        settings = protocol.decode(controller.protected(SETTINGS).read_bytes())
        credentials = signer.GitHubAppCredentials(settings, KEY, controller.protected, protocol.repository, Error)
        if (settings['app_id'] != identity['app_id'] or settings['installation_id'] != identity['app_installation_id']
                or settings['owner'].lower() != identity['org'].lower()):
            raise Error('Protected shared App settings differ from historical identity.')
        jwt = credentials.jwt()
        installation = credentials.request(jwt, '')
        if (type(installation.get('id')) is not int or installation['id'] != identity['app_installation_id']
                or type(installation.get('app_id')) is not int or installation['app_id'] != identity['app_id']
                or installation.get('account', {}).get('type') != 'Organization'
                or str(installation.get('account', {}).get('login', '')).lower() != identity['org'].lower()
                or installation.get('repository_selection') != 'selected'
                or 'suspended_at' not in installation or installation['suspended_at'] is not None
                or installation.get('target_type', 'Organization') != 'Organization'
                or installation.get('permissions') != CI_PERMISSIONS):
            raise Error('Shared App installation policy differs from the existing signer contract.')
        result = credentials.request(jwt, '/access_tokens', 'POST', {'permissions': {'metadata': 'read'}})
        # Capture a valid returned token before validating other fields so the
        # finally block revokes our token even if its response policy is invalid.
        token = protocol.bearer(result.get('token'))
        expires = datetime.fromisoformat(result['expires_at'].replace('Z', '+00:00'))
        if (expires.tzinfo is None or expires.timestamp() <= time.time() + 120
                or result.get('permissions') != {'metadata': 'read'}
                or result.get('repository_selection') != 'selected'):
            raise Error('Metadata-only App token response policy or expiry differs.')
        ids = repositories(protocol, token, identity['org'])
        return {'schema_version': 1, 'app_id': settings['app_id'], 'installation_id': settings['installation_id'],
                'owner': settings['owner'], 'repository_selection': 'selected', 'repository_ids': ids}
    except (OSError, ValueError, KeyError, TypeError, AttributeError, protocol.ReleaseError):
        raise Error('Protected App metadata inventory failed; no credential data was exported.') from None
    finally:
        if token is not None:
            # A failed revoke prevents a successful inventory result. Never
            # revoke a shared controller's cached token: only this call's mint.
            token_request(protocol, token, '/installation/token', 'DELETE')
