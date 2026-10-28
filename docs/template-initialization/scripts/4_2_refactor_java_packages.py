#!/usr/bin/env python3
"""Move Java roots and code references while preserving fixtures, comments and SQL."""
from _local import entry, refactor_java_packages

if __name__ == "__main__":
    entry(refactor_java_packages, "Refactor consumer Java package roots")
