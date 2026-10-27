#!/usr/bin/env python3
"""Install locked dependencies and merge public local HTTP settings."""
from _local import entry, prepare_frontend_env

if __name__ == "__main__":
    entry(prepare_frontend_env, "Prepare frontend HTTP development configuration")
