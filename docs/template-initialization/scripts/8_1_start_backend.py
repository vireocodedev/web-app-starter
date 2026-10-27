#!/usr/bin/env python3
"""Start this checkout's PostgreSQL, authenticate it, then run local Java."""
from _local import entry, start_backend

if __name__ == "__main__":
    entry(start_backend, "Start the real local backend (foreground)")
