#!/usr/bin/env python3
"""Execute every generated notebook with a MOCKED LLM and report runtime errors.

The notebooks have `.no-prebake`, so they are never run at build time — syntax is
valid but runtime bugs (missing methods, undefined names, bad logic in the stdlib
framework mirrors) slip through. This runs each notebook.py in a real ipykernel with
urllib.urlopen mocked (no gateway calls, fast) and collects the first failure.

Usage: .venv/bin/python scripts/check_notebooks_exec.py
"""
import sys, glob, os, subprocess
import nbformat
from nbformat.v4 import new_code_cell
from nbclient import NotebookClient
from nbclient.exceptions import CellExecutionError

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY2NB = os.path.join(REPO, "ide", "jupyterlite", "py_to_notebook.py")

# Mock urllib.urlopen (the CPython path of the inline lrn_llm helper) so no real
# gateway call happens. content is a JSON string that both JSON-parsers and plain
# text consumers tolerate, to minimise mock-induced false positives.
MOCK = '''import urllib.request as _u, json as _j
def _mock_urlopen(req, timeout=None):
    content = '{"score": 4, "verdict": "pass", "label": "positive", "reasoning": "mock", "result": "ok"}'
    resp = {"choices": [{"message": {"content": content}, "finish_reason": "stop"}],
            "model": "mock-gpt", "usage": {"prompt_tokens": 5, "completion_tokens": 5}}
    class _R:
        status = 200
        def read(self): return _j.dumps(resp).encode()
        def __enter__(self): return self
        def __exit__(self, *a): return False
    return _R()
_u.urlopen = _mock_urlopen'''

# --real = no mock, hit the live gateway (separates real bugs from mock-format artifacts).
# Extra args = explicit notebook paths to check (else all 62).
REAL = "--real" in sys.argv
paths = [a for a in sys.argv[1:] if not a.startswith("--")]
if paths:
    nbs = [os.path.join(REPO, p) if not os.path.isabs(p) else p for p in paths]
else:
    nbs = sorted(glob.glob(os.path.join(REPO, "phases/*/*/code/notebook.py")) +
                 glob.glob(os.path.join(REPO, "phases/*/*/code/notebook.*.py")))
print(f"Checking {len(nbs)} notebooks (mode={'REAL gateway' if REAL else 'mock'})...\n")
errors = []
for f in nbs:
    rel = f[len(REPO) + 1:]
    tmp = f + ".exec_tmp.ipynb"
    subprocess.run([sys.executable, PY2NB, f, tmp], check=False,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        nb = nbformat.read(tmp, as_version=4)
        if not REAL:
            nb.cells.insert(0, new_code_cell(MOCK))
        NotebookClient(nb, timeout=90, kernel_name="python3").execute()
        print(f"  ok    {rel}")
    except CellExecutionError as e:
        last = [l for l in str(e).strip().splitlines() if l.strip()][-1][:140]
        errors.append((rel, last)); print(f"  FAIL  {rel}  ::  {last}")
    except Exception as e:
        errors.append((rel, f"{type(e).__name__}: {str(e)[:120]}")); print(f"  ERR   {rel}  ::  {type(e).__name__}")
    finally:
        if os.path.exists(tmp): os.remove(tmp)

print(f"\n==== {len(nbs)} checked · {len(errors)} with runtime errors ====")
for f, e in errors:
    print(f"  ❌ {f}\n        {e}")
