#!/usr/bin/env bash

# VS Code process tasks inherit the desktop PATH, which may predate nvm setup.
script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)" || exit 1
required_major="$(<"$script_directory/../../frontend/.nvmrc")"

if [[ ! "$required_major" =~ ^[0-9]+$ ]]; then
  printf '%s\n' 'Expected a Node major version in frontend/.nvmrc.' >&2
  exit 1
fi
if [[ $# -eq 0 ]]; then
  printf '%s\n' 'Usage: with-local-node.sh <node script> [arguments...]' >&2
  exit 2
fi

has_required_node() {
  command -v node >/dev/null 2>&1 &&
    [[ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)" == "$required_major" ]]
}

if ! has_required_node; then
  nvm_script="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  if [[ -f "$nvm_script" ]]; then
    if ! . "$nvm_script" --no-use || ! nvm use --silent "$required_major"; then
      printf 'Select an installed Node %s runtime before starting local development.\n' "$required_major" >&2
      exit 1
    fi
  fi
fi

if ! has_required_node; then
  printf 'Node %s is required. Put it on PATH or install it in nvm, then retry the debugger.\n' "$required_major" >&2
  exit 1
fi

exec node "$@"
