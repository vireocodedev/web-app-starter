#!/usr/bin/env python3
"""Run the frontend at the installed strict loopback origin."""
from _local import entry, start_frontend

if __name__ == "__main__":
    entry(start_frontend, "Start the real HTTP frontend (foreground)")
