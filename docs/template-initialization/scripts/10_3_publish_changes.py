#!/usr/bin/env python3
"""Commit already reviewed/staged consumer work and push its setup branch."""
from _local import entry, publish_changes

if __name__ == "__main__":
    entry(publish_changes, "Publish already staged initialization changes")
