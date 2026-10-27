#!/usr/bin/env python3
"""Apply verified consumer identity to the bounded backend configuration fields."""
from _local import entry, edit_backend_identity

if __name__ == "__main__":
    entry(edit_backend_identity, "Apply backend identity fields", editor=True)
