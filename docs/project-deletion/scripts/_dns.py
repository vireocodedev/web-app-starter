"""Delete only exact, previously inspected A RRsets; retain their shared zone."""
import json
from pathlib import Path
import time
from urllib.parse import quote
import urllib.error
import urllib.request
from _state import Error, operation
from _shared import read_values, _NoRedirect, dns_query


def api(snapshot, path, method='GET'):
    token = read_values(Path(snapshot['dns_token_file']), fields=frozenset({'HCLOUD_TOKEN'}))['HCLOUD_TOKEN']
    request = urllib.request.Request('https://api.hetzner.cloud/v1' + path, method=method,
                                    headers={'Authorization': 'Bearer ' + token, 'User-Agent': 'project-deletion/1'})
    try:
        with urllib.request.build_opener(_NoRedirect()).open(request, timeout=30) as response:
            raw = response.read(4 * 1024 * 1024 + 1)
            if len(raw) > 4 * 1024 * 1024:
                raise ValueError()
            value = json.loads(raw) if raw else {}
    except (urllib.error.URLError, OSError, ValueError):
        raise Error('DNS API outcome uncertain or inaccessible; inspect/read back before retry.') from None
    if not isinstance(value, dict):
        raise Error('Invalid DNS provider response.')
    return value


def records(snapshot):
    identity = snapshot['identity']
    base = '/zones/' + str(identity['dns_zone_id'])
    zone = api(snapshot, base).get('zone', {})
    if str(zone.get('id')) != str(identity['dns_zone_id']) or zone.get('name') != identity['dns_zone']:
        raise Error('DNS zone identity changed; shared zone preserved.')
    result = []
    for page in range(1, 1001):
        response = api(snapshot, base + '/rrsets?per_page=100&page=' + str(page))
        batch = response.get('rrsets')
        if not isinstance(batch, list):
            raise Error('DNS RRset inventory unavailable.')
        result.extend(batch)
        if len(batch) < 100:
            return result
    raise Error('DNS inventory exceeded its reviewed bound.')


def inspect(snapshot):
    identity = snapshot['identity']
    result = []
    for rr in records(snapshot):
        for host in identity['hostnames'].values():
            relative = host.removesuffix('.' + identity['dns_zone'])
            if rr.get('name') != relative:
                continue
            if rr.get('type') != 'A' or rr.get('records') != [{'value': identity['operator_ipv4']}]:
                # Provider may supply a null comment; normalize only this documented optional field.
                values = [{k: v for k, v in record.items() if k != 'comment' or v is not None} for record in rr.get('records', [])]
                if rr.get('type') != 'A' or values != [{'value': identity['operator_ipv4']}]:
                    raise Error('Environment RRset contains foreign/shared values or type; preserve it.')
            result.append({'name': relative, 'type': 'A', 'records': [{'value': identity['operator_ipv4']}], 'ttl': rr.get('ttl')})
    if len({item['name'] for item in result}) != len(result):
        raise Error('Duplicate environment DNS identity.')
    return result


def remove(directory, selected, snapshot):
    for target in selected['dns']:
        def absent(target=target):
            matches = [rr for rr in inspect(snapshot) if rr['name'] == target['name']]
            if matches and matches != [target]:
                raise Error('DNS predecessor changed; do not delete the replacement.')
            return not matches
        def delete(target=target):
            api(snapshot, '/zones/' + str(selected['identity']['dns_zone_id']) + '/rrsets/' + quote(target['name'], safe='') + '/A', 'DELETE')
            for _ in range(30):
                if absent(target):
                    return
                time.sleep(2)
            raise Error('DNS deletion is still pending; rerun to reconcile.')
        operation(directory, selected, 'dns-' + target['name'], target, delete, absent)
    verify(selected, snapshot)


def verify(selected, snapshot):
    if inspect(snapshot):
        raise Error('Environment provider DNS records still exist.')
    identity = selected['identity']
    servers = [value for owner, kind, value in dns_query(identity['dns_zone'], 'NS') if kind == 'NS' and owner == identity['dns_zone']]
    if not servers:
        raise Error('Authoritative DNS inventory unavailable.')
    for host in identity['hostnames'].values():
        for server in servers:
            for kind in ('A', 'AAAA', 'CNAME'):
                if any(owner == host and record_type == kind for owner, record_type, _ in dns_query(host, kind, server=server)):
                    raise Error('Authoritative environment DNS absence not yet verified; retry after propagation.')
