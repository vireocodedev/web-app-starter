#!/usr/bin/env python3
"""Stop only this checkout's PostgreSQL; preserve its persistent volume."""
from _local import entry, stop_database

if __name__ == "__main__":
    entry(stop_database, "Stop this consumer's local PostgreSQL")
