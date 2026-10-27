#!/usr/bin/env python3
"""Inspect intended changes; staging remains an explicit human decision."""
from _local import entry, review_changes

if __name__ == "__main__":
    entry(review_changes, "Review initialization changes without staging")
