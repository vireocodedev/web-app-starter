#!/usr/bin/env bash
set -euo pipefail
umask 077
cd /home/web-app-ci/runner
test -S /run/user/"$(id -u)"/docker.sock
# This is the one-job GitHub configuration, never the controller's PAT.
WEB_APP_JIT_CONFIG=$(cat /home/web-app-ci/jit-config)
rm /home/web-app-ci/jit-config
# Runner 2.338.0 masks this secret input and clears it before spawning job code.
# Keep its value out of argv and avoid retaining a second shell variable.
export ACTIONS_RUNNER_INPUT_JITCONFIG="$WEB_APP_JIT_CONFIG"
unset WEB_APP_JIT_CONFIG
# Replace this shell directly: run.sh/run-helper would retain inherited input
# copies in persistent parent processes after the listener clears its environment.
exec ./bin/Runner.Listener run
