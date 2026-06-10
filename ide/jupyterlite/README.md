# JupyterLite — native in-browser notebooks

The lesson site embeds **JupyterLite**: a full Jupyter notebook UI running
entirely in the browser (WASM/Pyodide kernel). No server, no login, no iframe
cross-origin issues — it's served as static files from the same Static Web App
under `site/jupyterlite/`. The lesson Run panel's "Open in Notebook" button opens
`jupyterlite/lab/index.html?path=<lesson>.ipynb`.

This replaced the JupyterHub-on-AKS approach (external link, login, HTTP) with a
self-contained in-page notebook.

## Important: the build is NOT in git

`site/jupyterlite/` is **gitignored** (it's a ~69 MB generated bundle). It is
deployed directly via `swa deploy`, but a CI deploy from `main` will NOT include
it unless the build step below runs. **Re-run this build whenever lessons change
or before a CI deploy that should refresh notebooks.**

## How to build

```bash
# 1. isolated venv with jupyterlite + pyodide kernel + jupytext + jupyter-server.
#    jupyter-server is REQUIRED: without it, `--contents` silently fails to
#    build the contents index (api/contents/all.json), and embedded notebooks
#    error with "Could not find content with path ...". The .ipynb files get
#    copied but JupyterLite can't see them.
python3 -m venv /tmp/jlite-venv
/tmp/jlite-venv/bin/pip install jupyterlite-core jupyterlite-pyodide-kernel jupytext jupyter-server

# 2. convert every lesson main.py -> notebook
rm -rf /tmp/jlite-content && mkdir -p /tmp/jlite-content
for py in $(find phases -name main.py); do
  lesson=$(dirname $(dirname "$py"))            # phases/XX/YY
  out="/tmp/jlite-content/${lesson}.ipynb"
  mkdir -p "$(dirname "$out")"
  /tmp/jlite-venv/bin/jupytext --to notebook --output "$out" "$py"
done

# 3. build JupyterLite with the lessons as contents
rm -rf /tmp/jlite-build && mkdir -p /tmp/jlite-build && cd /tmp/jlite-build
/tmp/jlite-venv/bin/jupyter lite build --contents /tmp/jlite-content --output-dir ./_output

# 4. copy into the site (gitignored) and deploy
cd -    # back to repo root
rm -rf site/jupyterlite && cp -r /tmp/jlite-build/_output site/jupyterlite
```

Then deploy the site (see CLAUDE.md / the SWA deploy steps — remember to also
stage `phases/` into `site/phases/` for the lesson docs).

## Runtime limits

Same as the in-browser Pyodide playground: standard library + numpy/pandas/etc.
that have WASM wheels. No torch/tf/jax. LLM calls run client-side (the LHIND
network can reach the gateway; the browser is on that network).
