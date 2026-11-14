#!/usr/bin/env bash
# The Sixth Month: one-step local macOS launcher. No remote deployment or account setup.
set -euo pipefail
cd "$(dirname "$0")"
printf '\nTHE SIXTH MONTH / MERIDIAN STATION\n\n'
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo 'This launcher is for macOS. On other systems use: npm install && npm run check && npm run dev:local -- --open'
  exit 2
fi
# Make an existing Homebrew discoverable on Apple Silicon or Intel Macs.
if [[ -x /opt/homebrew/bin/brew ]]; then eval "$(/opt/homebrew/bin/brew shellenv)";
elif [[ -x /usr/local/bin/brew ]]; then eval "$(/usr/local/bin/brew shellenv)"; fi
node_ok() {
  command -v node >/dev/null 2>&1 && node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=19)?0:1)' >/dev/null 2>&1
}
if ! node_ok; then
  if command -v brew >/dev/null 2>&1; then
    echo 'Node.js 20.19+ is required. Installing current Node.js with your existing Homebrew...'
    brew install node
    hash -r
  fi
fi
if ! node_ok; then
  echo 'Node.js 20.19+ is still unavailable. Install current Node.js from https://nodejs.org/en/download and run this launcher again.'
  exit 2
fi
if ! command -v npm >/dev/null 2>&1; then
  echo 'npm is missing. Repair your Node.js installation, then rerun this launcher.'
  exit 2
fi
echo 'Installing project-local dependencies (no global package install)...'
npm install --no-audit --no-fund
echo 'Checking TypeScript, timeline behavior, textures and production build...'
npm run check
printf '\nPASS: local build checks completed.\n'
echo 'Opening your browser at the local development server (localhost only).'
echo 'Leave this Terminal window open while exploring. Ctrl+C stops the server.'
npm run dev:local -- --open
