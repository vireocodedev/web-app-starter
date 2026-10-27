#!/usr/bin/env bash
# Explicit optional recipe for an existing nvm installation. No download/bootstrap of nvm.
set -euo pipefail
if [[ "${1:-}" == '--help' ]]; then
  echo 'Usage: bash docs/template-initialization/scripts/2_1_prepare_node.sh'
  echo 'Uses existing nvm to install/select Node24 and npm12.0.2. Other prerequisites are installed separately.'
  exit 0
fi
if [[ $# -ne 0 ]]; then echo 'Unexpected argument; use --help.' >&2; exit 1; fi
nvm_source="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
if [[ ! -f "$nvm_source" ]]; then echo 'Install nvm through your workstation tooling first.' >&2; exit 1; fi
# nvm is installed executable workstation code, never initialization env data.
source "$nvm_source"
nvm install 24
nvm use 24
npm install --global npm@12.0.2
