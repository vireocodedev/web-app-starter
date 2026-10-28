#!/usr/bin/env python3
"""Verify coherent consumer identity without manual residual-match classification."""
from _local import entry, audit_identity

if __name__ == "__main__":
    entry(audit_identity, "Verify consumer application identity")
