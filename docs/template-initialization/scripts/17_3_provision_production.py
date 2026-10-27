#!/usr/bin/env python3
"""Reuse the exact provisioning transaction, with a production backup in its lock."""
import importlib.util
from pathlib import Path
from _shared import InitError, load_context, parser


def main():
    arguments = parser('Provision production using its active digest and fresh locked backup.')
    args = arguments.parse_args()
    context = load_context(args, operator=True)
    if context.scope != 'full':
        raise InitError('Account provisioning requires verified full initialization scope.')
    path = Path(__file__).with_name('16_1_provision_staging.py')
    spec = importlib.util.spec_from_file_location('initialization_provision_transaction', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.provision(context.values['PROJECT_SLUG'], 'production')


if __name__ == '__main__':
    try:
        main()
    except InitError as error:
        raise SystemExit(str(error)) from None
