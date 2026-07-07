#!/bin/bash
# Consolidated JupyterLite build: chains README's steps 1-4 into one command.
#
#   1. venv with jupyterlite + pyodide kernel + jupyter-server + nbconvert deps
#   2. build-notebooks.sh -> hand-authored notebook*.py files, pre-executed
#   3. jupyter lite build --contents -> static app + contents index
#   4. inject-key-bridge.py -> re-apply the LRN key bridge (lost on every build)
#   5. copy into site/jupyterlite (gitignored, deploy picks it up from disk)
#
# Idempotent / re-runnable: the venv is reused if already usable (skip
# reinstall), and every directory this script writes to is wiped and
# recreated fresh on each run.
set -euo pipefail

REPO=$(cd "$(dirname "$0")/../.." && pwd)
VENV=${VENV:-/tmp/jlite-venv}
CONTENT=${CONTENT:-/tmp/jlite-content}
BUILD_DIR=${BUILD_DIR:-/tmp/jlite-build}
OUTPUT="$BUILD_DIR/_output"

echo "== 1. venv ($VENV) =="
if [[ -x "$VENV/bin/python3" ]] && "$VENV/bin/python3" -c "import jupyterlite_core, jupyter_server, nbconvert, ipykernel, numpy, pandas, matplotlib, jupytext" >/dev/null 2>&1; then
  echo "venv already has required packages, skipping install"
else
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --upgrade pip >/dev/null
  "$VENV/bin/pip" install \
    jupyterlite-core jupyterlite-pyodide-kernel jupyter-server \
    nbconvert ipykernel numpy pandas matplotlib jupytext
fi

echo "== 2. build-notebooks.sh (hand-authored notebook*.py -> pre-executed .ipynb) =="
VENV="$VENV" CONTENT="$CONTENT" "$REPO/ide/jupyterlite/build-notebooks.sh"

echo "== 3. jupyter lite build --contents =="
rm -rf "$BUILD_DIR" && mkdir -p "$BUILD_DIR"
"$VENV/bin/jupyter" lite build --contents "$CONTENT" --output-dir "$OUTPUT"

echo "== 4. inject-key-bridge.py =="
python3 "$REPO/ide/jupyterlite/inject-key-bridge.py" "$OUTPUT"

echo "== 5. copy into site/jupyterlite =="
rm -rf "$REPO/site/jupyterlite"
cp -r "$OUTPUT" "$REPO/site/jupyterlite"

echo "== done: site/jupyterlite/ refreshed =="
