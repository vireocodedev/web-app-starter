#!/usr/bin/env python3
"""Check configured VS Code dependency order; interactive debugging is manual."""
from _local import entry, check_ide_configuration

if __name__ == "__main__":
    entry(check_ide_configuration, "Check VS Code launch configuration")
