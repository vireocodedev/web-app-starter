#!/usr/bin/env python3
"""Retain a working GitHub login or explicitly start browser authentication."""
import sys
from _shared import InitError, load_context, parser, run, github_api


def main():
    command = parser(__doc__)
    command.add_argument('--login', action='store_true', help='Explicitly open gh browser login if no current login works.')
    args = command.parse_args()
    ctx = load_context(args, require_verified=False)
    result = run(['gh', 'auth', 'status', '--hostname', 'github.com'], capture=True, check=False)
    if result.returncode:
        if not args.login:
            raise InitError('GitHub is unauthenticated. Rerun this script with --login to authorize browser login.')
        run(['gh', 'auth', 'login', '--hostname', 'github.com', '--web', '--scopes', 'repo,read:org'], timeout=None)
    user = github_api('user')
    if user.get('login', '').lower() != ctx.values['MAINTAINER_LOGIN'].lower():
        raise InitError('Active GitHub account differs from MAINTAINER_LOGIN; select the intended account deliberately.')
    print('Intended GitHub account authenticated; 2_4 verifies repository visibility and access.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
