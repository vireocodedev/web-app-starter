#!/usr/bin/env python3
"""Retain a working GitHub login or explicitly start browser authentication."""
import re
import sys
from _shared import InitError, load_context, parser, run, github_api


def main():
    command = parser(__doc__)
    command.add_argument('--login', action='store_true', help='Explicitly authorize browser login or the missing App-inventory read:user scope.')
    args = command.parse_args()
    ctx = load_context(args, require_verified=False)
    result = run(['gh', 'auth', 'status', '--hostname', 'github.com'], capture=True, check=False)
    if result.returncode:
        if not args.login:
            raise InitError('GitHub is unauthenticated. Rerun this script with --login to authorize browser login.')
        run(['gh', 'auth', 'login', '--hostname', 'github.com', '--web', '--scopes', 'repo,read:org,read:user'], timeout=None)
    user = github_api('user')
    if user.get('login', '').lower() != ctx.values['MAINTAINER_LOGIN'].lower():
        raise InitError('Active GitHub account differs from MAINTAINER_LOGIN; select the intended account deliberately.')
    headers = github_api('user', include=True).replace('\r\n', '\n').partition('\n\n')[0]
    scope_header = re.search(r'^x-oauth-scopes:\s*(.*)$', headers, re.IGNORECASE | re.MULTILINE)
    scopes = set(scope.strip() for scope in scope_header[1].split(',')) if scope_header else set()
    if not scopes.intersection({'read:user', 'user'}):
        if not args.login:
            raise InitError('GitHub App inventory requires read:user. Rerun this step with --login to authorize that scope; existing credentials are preserved.')
        run(['gh', 'auth', 'refresh', '--hostname', 'github.com', '--scopes', 'read:user'], timeout=None)
        # Prove the intended account still owns the refreshed credentials and scope.
        user = github_api('user')
        headers = github_api('user', include=True).replace('\r\n', '\n').partition('\n\n')[0]
        scope_header = re.search(r'^x-oauth-scopes:\s*(.*)$', headers, re.IGNORECASE | re.MULTILINE)
        scopes = set(scope.strip() for scope in scope_header[1].split(',')) if scope_header else set()
        if user.get('login', '').lower() != ctx.values['MAINTAINER_LOGIN'].lower() or not scopes.intersection({'read:user', 'user'}):
            raise InitError('Refreshed GitHub account/scope differs; select the intended account deliberately.')
    print('Intended GitHub account and App-inventory scope authenticated; 2_4 verifies repository visibility and access.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
