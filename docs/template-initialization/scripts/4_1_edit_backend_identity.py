#!/usr/bin/env python3
"""Show exact consumer backend edits; optionally open their existing files."""
from _local import entry, edit_backend_identity

if __name__ == "__main__":
    entry(edit_backend_identity, "Review backend identity fields", editor=True)
