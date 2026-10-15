#!/usr/bin/env python3
"""Operator-only environment preparation, separate from ordinary releases."""
import argparse
import os
from pathlib import Path
import socket
import sys

from controller import configuration, protected, write_json
from protocol import ReleaseError, command, decode
from runtime import validate


def prepare(config):
    validate(config)
    state = Path(config['state'])
    marker = state / 'preparation.json'
    if marker.exists():
        raise ReleaseError('existing-preparation-requires-operator-inspection')
    for environment in config['environments'].values():
        for name in ('frontend_port', 'backend_port'):
            with socket.socket() as probe:
                try:
                    probe.bind(('127.0.0.1', environment[name]))
                except OSError:
                    raise ReleaseError('configured-loopback-port-unavailable') from None
    site = Path('/etc/caddy/sites') / (config['slug'] + '.caddy')
    if site.exists() or site.is_symlink():
        raise ReleaseError('existing-project-proxy-site')
    # Persist exact resource names before any creation. Never discard interrupted intent.
    resources = {environment: {
        'network': config['slug'] + '-' + environment + '-db',
        'volume': config['slug'] + '-' + environment + '-postgres'} for environment in ('staging', 'production')}
    known_networks = command('docker', 'network', 'ls', '--format', '{{.Name}}').decode().splitlines()
    known_volumes = command('docker', 'volume', 'ls', '--format', '{{.Name}}').decode().splitlines()
    if any(item['network'] in known_networks or item['volume'] in known_volumes for item in resources.values()):
        raise ReleaseError('preexisting-database-resource')
    record = {'state': 'preparing', 'resources': resources}
    write_json(marker, record)
    for environment, item in resources.items():
        label = 'hr.vireocode.deployment=' + config['slug'] + '-' + environment
        command('docker', 'network', 'create', '--label', label, item['network'])
        command('docker', 'volume', 'create', '--label', label, item['volume'])
        mountpoint = command('docker', 'volume', 'inspect', '--format', '{{.Mountpoint}}',
                             item['volume']).decode().strip()
        expected = '/var/lib/docker/volumes/' + item['volume'] + '/_data'
        if mountpoint != expected or Path(mountpoint).is_symlink() or any(Path(mountpoint).iterdir()):
            raise ReleaseError('new-volume-mountpoint-not-empty-or-unexpected')
        os.chown(mountpoint, 999, 999)
        command('docker', 'compose', '--project-name', config['slug'] + '-' + environment + '-db',
                '--file', config['settings'] + '/' + environment + '/database.compose.json',
                'up', '--detach', '--wait', '--wait-timeout', '120', 'postgres', timeout=240)
    blocks = []
    for name, environment in config['environments'].items():
        blocks.append(f"""{environment['hostname']} {{
    header X-Vireo-Environment {name}
    @api path /api /api/*
    handle @api {{
        reverse_proxy 127.0.0.1:{environment['backend_port']}
    }}
    handle {{
        reverse_proxy 127.0.0.1:{environment['frontend_port']}
    }}
}}
""")
    site.write_text('\n'.join(blocks))
    site.chmod(0o644)
    try:
        command('caddy', 'validate', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile')
    except ReleaseError:
        site.unlink()
        raise
    command('systemctl', 'reload', 'caddy')
    record['state'] = 'prepared'
    write_json(marker, record)
    print('Prepared separate persistent databases and validated project Caddy routes. Controller remains disabled.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True, help='Protected controller.json')
    args = parser.parse_args()
    try:
        if os.geteuid() != 0:
            raise ReleaseError('root-required')
        os.umask(0o077)
        controller = configuration(args.config)
        prepare(decode(protected(controller['runtime_config']).read_bytes()))
    except ReleaseError as error:
        print('Preparation stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
