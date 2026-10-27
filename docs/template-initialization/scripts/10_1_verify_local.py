#!/usr/bin/env python3
"""Run the guide's full local gates sequentially; browser install is opt-in."""
from _local import entry, verify_local

if __name__ == "__main__":
    entry(verify_local, "Verify initialized consumer locally", browser=True)
