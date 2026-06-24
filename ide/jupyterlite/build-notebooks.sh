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

total=0; executed=0; plain=0; skipped_marker=0; skipped_prebake=0
# Prefer notebook.py (audit-generated, lesson-tailored) over main.py.
# We find both, then skip any main.py whose lesson also has a notebook.py.
# A lesson can opt out of having a JupyterLite notebook by placing an empty
# file `code/.no-notebook` next to main.py — used for pure-theory lessons
# (vendor comparisons, compliance frameworks, etc.) where running Python in
# the browser adds no learning value over the docs themselves.
for py in $(find "$REPO/phases" \( -name 'notebook.py' -o -name 'notebook.*.py' -o -name main.py \) | sort); do
  dir=$(dirname "$py")
  lesson=$(dirname "$dir")                           # .../phases/XX/YY
  rel=${lesson#"$REPO/"}                             # phases/XX/YY
  base=$(basename "$py")
  if [[ -f "$dir/.no-notebook" ]]; then
    skipped_marker=$((skipped_marker+1))
    continue
  fi
  # main.py loses to ANY audit-generated notebook (shared notebook.py or per-course notebook.<course>.py).
  if [[ "$base" == "main.py" ]] && ls "$dir"/notebook*.py >/dev/null 2>&1; then
    continue
  fi
  # notebook.<course>.py -> phases/XX/YY.<course>.ipynb ; notebook.py/main.py -> phases/XX/YY.ipynb
  if [[ "$base" == notebook.*.py ]]; then
    course="${base#notebook.}"; course="${course%.py}"
    out="$CONTENT/${rel}.${course}.ipynb"
  else
    out="$CONTENT/${rel}.ipynb"
  fi
  mkdir -p "$(dirname "$out")"
  total=$((total+1))

  # 1. clean notebook
  python3 "$PY2NB" "$py" "$out" 2>/dev/null || { cp /dev/null "$out"; continue; }

  # 2. execute to bake outputs (best effort, short timeout) — UNLESS the lesson
  # has a `code/.no-prebake` marker. Audit-generated notebooks (real LLM calls,
  # step-by-step learner experience) opt out so the outputs are produced only
  # when the learner clicks each cell in JupyterLite.
  if [[ -f "$(dirname "$py")/.no-prebake" ]]; then
    skipped_prebake=$((skipped_prebake+1))
    continue
  fi
  if "$VENV/bin/jupyter" nbconvert --to notebook --execute \
        --ExecutePreprocessor.timeout=90 \
        --output "$out" "$out" >/dev/null 2>&1; then
    executed=$((executed+1))
  else
    plain=$((plain+1))   # keep the un-executed clean notebook
  fi
done

echo "notebooks: $total total, $executed executed (with output), $plain without output, $skipped_marker skipped (.no-notebook marker), $skipped_prebake delivered blank (.no-prebake marker, learner runs cells)"
