#!/usr/bin/env python3
"""Generate missing credentials and bind a fresh env to selected identity."""
from _local import entry, prepare_backend_env

if __name__ == "__main__":
    entry(prepare_backend_env, "Prepare private backend local configuration")
