#!/usr/bin/env python3
"""Create a private data file without replacing an existing initialization."""
import os
from pathlib import Path
import sys
from _shared import InitError, ROOT, parser, private_file, require_private_inputs, read_values, validate_values


def main():
    command = parser(__doc__)
    inspection = command.add_mutually_exclusive_group()
    inspection.add_argument('--check', action='store_true', help='Validate existing input syntax; no network probes or receipt.')
    inspection.add_argument('--show-values', action='store_true',
        help='Print all validated known nonsecret inputs; never print arbitrary file contents or credential files.')
    args = command.parse_args()
    if args.check or args.show_values:
        values = read_values(args.env)
        validate_values(values)
        if args.show_values:
            print('\n'.join(f'{key}={value}' for key, value in values.items()))
        else:
            print('Input syntax is valid. Run 2_4_verify_values.py for functional verification.')
        return
    path = require_private_inputs(args.env)
    if path.exists() or path.is_symlink():
        private_file(path)
        raise InitError('Values already exist; edit/preserve them, or use --check. Nothing was overwritten.')
    if not path.parent.exists():
        path.parent.mkdir(mode=0o700, parents=False)
    info = path.parent.lstat()
    if path.parent.is_symlink() or info.st_uid != os.getuid() or info.st_mode & 0o777 != 0o700:
        raise InitError('Values directory must be owned by you with mode0700.')
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
        stream.write((ROOT / 'docs/template-initialization/.env.example').read_text())
    print(f'Created {path}. Edit the nonsecret values, then validate them; never source this file.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
