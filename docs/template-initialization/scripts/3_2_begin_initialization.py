#!/usr/bin/env python3
"""Create the initialization branch once and discover the development guide."""
import sys
from _shared import InitError, load_context, parser, require_consumer, run, update_state


def main():
    ctx = load_context(parser(__doc__).parse_args())
    require_consumer(ctx)
    current = run(['git', 'branch', '--show-current'], cwd=ctx.root, capture=True).stdout.strip()
    if current != 'initialization/setup':
        exists = run(['git', 'show-ref', '--verify', '--quiet', 'refs/heads/initialization/setup'],
            cwd=ctx.root, capture=True, check=False)
        if exists.returncode == 0:
            raise InitError('Initialization branch already exists. Inspect/switch it deliberately before resuming.')
        if exists.returncode != 1:
            raise InitError('Cannot establish branch availability.')
        run(['git', 'switch', '-c', 'initialization/setup'], cwd=ctx.root)
    run(['bash', 'backend/scripts/with-local-node.sh', 'frontend/scripts/development-guide-index.mjs'], cwd=ctx.root)
    update_state(ctx, initialization_branch='initialization/setup')
    print('Read applicable AGENTS.md and discovered guide articles before personalization.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
