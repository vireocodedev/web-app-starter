#!/usr/bin/env python3
"""Probe public backend health without claiming login acceptance."""
from _local import entry, check_local_health

if __name__ == "__main__":
    entry(check_local_health, "Check local backend health")
