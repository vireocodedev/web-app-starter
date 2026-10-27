#!/usr/bin/env python3
"""Move fresh template Java roots without changing SQL or feature packages."""
from _local import entry, refactor_java_packages

if __name__ == "__main__":
    entry(refactor_java_packages, "Refactor fresh consumer Java package roots")
