#!/usr/bin/env python3
"""Inspect the exact checkout and recorded remote identity without editing anything."""
import sys
from _shared import InitError, load_context, parser, require_consumer, run, verify_github


def main():
    ctx = load_context(parser(__doc__).parse_args())
    require_consumer(ctx)
    if ctx.scope == 'local':
        for argv in (['git', 'remote', '-v'], ['git', 'status', '--short'], ['git', 'branch', '--show-current']):
            run(argv, cwd=ctx.root)
        print('Local consumer origin matches. Remote privacy/admin/repository ID are not verified in local scope.')
        return
    verify_github(ctx, 'resume')
    for argv in (['git', 'remote', '-v'], ['git', 'status', '--short'], ['git', 'branch', '--show-current']):
        run(argv, cwd=ctx.root)
    print('Private consumer and recorded repository ID match. Preserve any existing changes.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
