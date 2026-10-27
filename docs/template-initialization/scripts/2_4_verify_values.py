#!/usr/bin/env python3
"""Mechanically verify chosen inputs; write evidence only after every probe passes."""
import sys
from _shared import InitError, load_context, parser, verify_environment


def main():
    command = parser(__doc__)
    command.add_argument('--scope', choices=('local', 'full'), required=True,
        help='local checks syntax/workstation only; full also verifies GitHub, SSH and authoritative DNS.')
    command.add_argument('--mode', choices=('new', 'resume'), required=True,
        help='new initializes the existing consumer with unused deployment resources; resume requires recorded identity/resources.')
    args = command.parse_args()
    ctx = load_context(args, require_verified=False)
    verify_environment(ctx, args.scope, args.mode)
    print(f'Verified {args.scope} inputs in {args.mode} mode; private receipt is valid for 24 hours and these exact bytes.')
    if args.scope == 'local':
        print('GitHub, provider DNS, hostname availability and operator SSH are NOT verified in local scope.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
