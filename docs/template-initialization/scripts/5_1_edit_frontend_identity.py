#!/usr/bin/env python3
"""Apply consumer metadata, localized names and documented identity automatically."""
from _local import entry, edit_frontend_identity

if __name__ == "__main__":
    entry(edit_frontend_identity, "Apply frontend identity fields", editor=True)
