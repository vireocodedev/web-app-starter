#!/usr/bin/env python3
"""Create a private data file without replacing an existing initialization."""
import os
from pathlib import Path
import sys
from _shared import InitError, ROOT, parser, private_file, require_private_inputs, read_values, validate_values


def main():
    command = parser(__doc__)
    command.add_argument('--check', action='store_true', help='Validate existing input syntax; no network probes or receipt.')
    args = command.parse_args()
    if args.check:
        validate_values(read_values(args.env))
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
    with path.open('x', encoding='utf-8', opener=lambda filename, flags: os.open(filename, flags, 0o600)) as stream:
        stream.write((ROOT / 'docs/template-initialization/.env.example').read_text())
    print(f'Created {path}. Edit the nonsecret values, then validate them; never source this file.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
