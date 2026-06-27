#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  rm -f google_oauth_buildvars.go
}

trap cleanup EXIT

node scripts/write-google-oauth-build-vars.mjs
wails build "$@"
