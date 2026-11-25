#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "============================================"
echo "  ChartRead Desktop - Easy Launcher"
echo "============================================"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "[ERROR] Node.js is not installed."
  echo "Please install Node.js (v18+) from: https://nodejs.org/"
  exit 1
fi

if [ ! -x "./node_modules/.bin/electron" ]; then
  echo ""
  echo "First-time setup: installing ChartRead runtime (Electron)..."
  npm install --no-audit --no-fund
fi

echo "Launching ChartRead..."
exec ./node_modules/.bin/electron . "$@"
