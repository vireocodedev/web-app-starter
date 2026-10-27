#!/usr/bin/env python3
"""Check installed versions and Docker access without changing workstation setup."""
import sys
from _shared import InitError, parser, verify_tools


def main():
    parser(__doc__).parse_args()
    verify_tools()
    print('Workstation tools, version pins and Docker access verified.')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
