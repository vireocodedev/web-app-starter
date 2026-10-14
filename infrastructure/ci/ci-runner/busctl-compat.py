#!/usr/bin/python3 -I
"""Nonprivileged, Docker-only compatibility for private-cgroup UID discovery."""
import os
from pathlib import Path
import re
import select
import stat
import subprocess
import sys
import time

CI_UID = int('@UID@')
SUBUID = int('@SUBUID@')
SUBGID = int('@SUBGID@')
STATUS_ARGUMENTS = ['--user', '--no-pager', 'status']
REAL_BUSCTL = '/usr/bin/busctl'


class AdapterError(Exception):
    def __init__(self, code, exit_status=1):
        super().__init__(code)
        self.exit_status = exit_status


def mapping(kind):
    try:
        return [list(map(int, line.split())) for line in Path('/proc/self/' + kind + '_map').read_text().splitlines()]
    except (OSError, ValueError):
        raise AdapterError('busctl-compat-map-unavailable') from None


def private_identity():
    if (os.getuid(), os.geteuid(), os.getgid(), os.getegid()) != (0, 0, 0, 0):
        raise AdapterError('busctl-compat-mapped-identity-required')
    if mapping('uid') != [[0, CI_UID, 1], [1, SUBUID, 65536]] \
            or mapping('gid') != [[0, CI_UID, 1], [1, SUBGID, 65536]]:
        raise AdapterError('busctl-compat-map-mismatch')
    runtime = f'/run/user/{CI_UID}'
    address = 'unix:path=' + runtime + '/bus'
    if os.environ.get('ROOTLESSKIT_PARENT_EUID') != str(CI_UID) \
            or os.environ.get('XDG_RUNTIME_DIR') != runtime \
            or os.environ.get('DBUS_SESSION_BUS_ADDRESS') != address:
        raise AdapterError('busctl-compat-private-environment-mismatch')
    try:
        information = Path(runtime + '/bus').lstat()
    except OSError:
        raise AdapterError('busctl-compat-private-socket-unavailable') from None
    if not stat.S_ISSOCK(information.st_mode) or information.st_uid != 0:
        raise AdapterError('busctl-compat-private-socket-mismatch')
    return {'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'LC_ALL': 'C', 'SYSTEMD_COLORS': '0',
            'XDG_RUNTIME_DIR': runtime, 'DBUS_SESSION_BUS_ADDRESS': address}


def genuine_status(environment):
    """Read at most 64 KiB from genuine busctl; stderr is never exposed."""
    deadline = time.monotonic() + 10
    try:
        process = subprocess.Popen([REAL_BUSCTL, *STATUS_ARGUMENTS], env=environment,
                                   stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                   stderr=subprocess.DEVNULL)
    except OSError:
        raise AdapterError('busctl-compat-genuine-unavailable') from None
    output = bytearray()
    try:
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0 or not select.select([process.stdout], [], [], remaining)[0]:
                raise AdapterError('busctl-compat-genuine-timeout')
            chunk = os.read(process.stdout.fileno(), min(4096, 65537 - len(output)))
            if not chunk:
                break
            output.extend(chunk)
            if len(output) > 65536:
                raise AdapterError('busctl-compat-genuine-output-too-large')
        status = process.wait(timeout=max(0.001, deadline - time.monotonic()))
        if status != 0:
            raise AdapterError('busctl-compat-genuine-failed', status if 1 <= status <= 255 else 1)
        try:
            return output.decode('utf-8', errors='strict')
        except UnicodeDecodeError:
            raise AdapterError('busctl-compat-genuine-output-invalid') from None
    except (OSError, subprocess.TimeoutExpired):
        raise AdapterError('busctl-compat-genuine-failed') from None
    finally:
        if process.poll() is None:
            process.kill()
        process.wait()
        process.stdout.close()


def owner_uid(output):
    owners = [line for line in output.splitlines() if line.lstrip().startswith('OwnerUID')]
    if len(owners) > 1:
        raise AdapterError('busctl-compat-duplicate-owner')
    if owners:
        match = re.fullmatch(r'OwnerUID=([0-9]{1,10})', owners[0])
        if match is None or int(match[1]) != CI_UID:
            raise AdapterError('busctl-compat-conflicting-owner')
    # The configured owner is justified only by the exact kernel maps, fixed
    # private socket and successful genuine status above. No other fields leak.
    return f'OwnerUID={CI_UID}\n'


def main():
    arguments = sys.argv[1:]
    if arguments != STATUS_ARGUMENTS:
        os.execv(REAL_BUSCTL, [REAL_BUSCTL, *arguments])
    try:
        environment = private_identity()
        sys.stdout.write(owner_uid(genuine_status(environment)))
    except AdapterError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(error.exit_status)


if __name__ == '__main__':
    main()
