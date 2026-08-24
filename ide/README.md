# In-browser code execution for lessons

The lesson site's **Run** panel executes compatible Python snippets in Pyodide. It is a lightweight practice surface, not the canonical four-language environment.

This repository does **not** currently ship a JupyterLite build or an embedded Jupyter UI. Notebook files remain downloadable curriculum assets; open them in a local Jupyter installation or another notebook host. The full supported execution path is the checked-in Dev Container described in [`docs/getting-started.md`](../docs/getting-started.md).

Pyodide cannot load every native Python wheel, and it does not execute TypeScript, Rust, or Julia. When a lesson needs those runtimes, native packages, filesystem behavior, or a persistent server, run its `code/main.*` entrypoint locally or in the Dev Container.

Earlier server-side Azure and JupyterHub experiments were removed. Their code remains in git history; no current documentation or UI should imply that those services are available.
