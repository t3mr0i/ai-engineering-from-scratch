#!/bin/bash
# Build learner-friendly, pre-executed lesson notebooks for JupyterLite.
#
# For each lesson main.py:
#   1. py_to_notebook.py  -> clean cells (md docstring + setup + runnable body),
#      no def main / no __main__ guard.
#   2. nbconvert --execute -> bake outputs in, so the embedded notebook shows
#      results immediately (no click, no Pyodide wait).
# Lessons that fail to execute (heavy libs, long runs) keep the notebook
# WITHOUT outputs rather than aborting the build.
#
# Requires the build venv with: jupyterlite-core jupyterlite-pyodide-kernel
# jupyter-server nbconvert ipykernel numpy pandas matplotlib
set -u

VENV=${VENV:-/tmp/jlite-venv}
REPO=$(cd "$(dirname "$0")/../.." && pwd)
CONTENT=${CONTENT:-/tmp/jlite-content}
PY2NB="$REPO/ide/jupyterlite/py_to_notebook.py"

rm -rf "$CONTENT" && mkdir -p "$CONTENT"

total=0; executed=0; plain=0
for py in $(find "$REPO/phases" -name main.py); do
  lesson=$(dirname "$(dirname "$py")")              # .../phases/XX/YY
  rel=${lesson#"$REPO/"}                             # phases/XX/YY
  out="$CONTENT/${rel}.ipynb"
  mkdir -p "$(dirname "$out")"
  total=$((total+1))

  # 1. clean notebook
  python3 "$PY2NB" "$py" "$out" 2>/dev/null || { cp /dev/null "$out"; continue; }

  # 2. execute to bake outputs (best effort, short timeout)
  if "$VENV/bin/jupyter" nbconvert --to notebook --execute \
        --ExecutePreprocessor.timeout=90 \
        --output "$out" "$out" >/dev/null 2>&1; then
    executed=$((executed+1))
  else
    plain=$((plain+1))   # keep the un-executed clean notebook
  fi
done

echo "notebooks: $total total, $executed executed (with output), $plain without output"
