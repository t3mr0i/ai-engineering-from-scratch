# In-browser code execution for lessons

The lesson site runs lesson code **in the browser** — no backend.

- **Run panel** (in each lesson): Pyodide playground for quick edits.
- **Open in Notebook**: full Jupyter UI via **JupyterLite** (WASM kernel),
  embedded natively in the site. See [`jupyterlite/README.md`](jupyterlite/README.md).

## History

Earlier iterations tried server-side execution on Azure (a Container Apps
runner + orchestrator, then JupyterHub on AKS). Both were dropped: the account
is Contributor-only (no role assignments for Dynamic Sessions / ACR attach) and
the internal LLM gateway's WAF blocks Azure egress, so server-side LLM calls
weren't possible anyway. JupyterLite gives the notebook experience with zero
backend, zero hosting cost, and no auth surface. The old runner/orchestrator/
JupyterHub code is in git history if ever needed.
