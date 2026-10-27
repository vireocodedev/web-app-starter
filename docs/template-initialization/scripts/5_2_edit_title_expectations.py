#!/usr/bin/env python3
"""Update title expectations automatically, preserving page prefixes and credentials."""
from _local import entry, edit_title_expectations

if __name__ == "__main__":
    entry(edit_title_expectations, "Update title test expectations", editor=True)
