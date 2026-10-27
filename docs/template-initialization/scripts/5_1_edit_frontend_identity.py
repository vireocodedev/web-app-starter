#!/usr/bin/env python3
"""Show exact consumer metadata/localization edits and optional editor."""
from _local import entry, edit_frontend_identity

if __name__ == "__main__":
    entry(edit_frontend_identity, "Review frontend identity fields", editor=True)
