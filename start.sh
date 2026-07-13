#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

case "${1:-browser}" in
  browser)
    echo "Starting Vite dev server (browser access at http://127.0.0.1:6969/)"
    exec yarn vite
    ;;
  desktop)
    echo "Starting full Electron app (requires display)"
    exec yarn dev
    ;;
  *)
    echo "Usage: $0 [browser|desktop]"
    echo ""
    echo "  browser   — Start Vite server only (default). Open http://127.0.0.1:6969/ in your browser."
    echo "  desktop   — Start Vite + Electron window. Requires a display (DISPLAY environment variable)."
    exit 1
    ;;
esac
