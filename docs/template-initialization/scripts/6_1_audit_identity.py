#!/usr/bin/env python3
"""Search owned source/config, excluding generated and secret files."""
from _local import entry, audit_identity

if __name__ == "__main__":
    entry(audit_identity, "Audit residual template application identity")
