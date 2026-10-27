#!/usr/bin/env python3
"""Check that local credential/configuration files remain ignored."""
from _local import entry, verify_ignored_env

if __name__ == "__main__":
    entry(verify_ignored_env, "Verify local environment files are ignored")
