#!/usr/bin/env python3
"""Open only title expectation owners; keep locale and mock credentials."""
from _local import entry, edit_title_expectations

if __name__ == "__main__":
    entry(edit_title_expectations, "Review title test expectations", editor=True)
