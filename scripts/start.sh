
set -euo pipefail

cd "$(dirname "$0")/.."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"

if [ "$NODE_MAJOR" != "22" ]; then
  echo "error: Directus needs Node 22, but 'node' here is $(node -v)." >&2
  echo "" >&2
  echo "Fix it with:" >&2
  echo "  nvm use 22" >&2
  echo "" >&2
  echo "If that still shows the wrong version, nvm is not loaded in this" >&2
  echo "shell. Non-interactive shells skip ~/.zshrc, so they fall back to" >&2
  echo "/usr/local/bin/node (v24). Run this in an interactive terminal." >&2
  exit 1
fi

exec ./node_modules/.bin/directus start
