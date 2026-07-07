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

The one-command way:

```bash
./ide/jupyterlite/build.sh
```

This chains everything below into a single idempotent script: it reuses
`/tmp/jlite-venv` if it already has the required packages, converts the
hand-authored `notebook*.py` files, runs `jupyter lite build`, re-applies the
LRN key bridge and the LHG theme overrides, and refreshes `site/jupyterlite/`.
Override `VENV` / `CONTENT` / `BUILD_DIR` env vars if you need non-default
locations.

### What it does under the hood

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

# 3. build JupyterLite with the lessons as contents. --lite-dir must point at
#    ide/jupyterlite so jupyterlite-core finds overrides.json there (it looks
#    for <lite_dir>/overrides.json, default lite_dir = cwd — without this flag
#    the file is silently never applied).
rm -rf /tmp/jlite-build && mkdir -p /tmp/jlite-build
/tmp/jlite-venv/bin/jupyter lite build --lite-dir ide/jupyterlite \
  --contents /tmp/jlite-content --output-dir /tmp/jlite-build/_output

# 4. inject the LRN key bridge and the LHG theme overrides, then copy into the
#    site (gitignored) and deploy. `jupyter lite build` regenerates every
#    */index.html and the theme package on every run, so both the key bridge
#    (receives the API key from the lesson site via postMessage -> window
#    global) and the LHG colour overrides MUST be re-applied after each
#    build — neither can live inside the app tree.
python3 ide/jupyterlite/inject-key-bridge.py /tmp/jlite-build/_output
python3 ide/jupyterlite/inject-lhg-theme.py /tmp/jlite-build/_output
rm -rf site/jupyterlite && cp -r /tmp/jlite-build/_output site/jupyterlite
```

## API key injection (lesson site → notebook)

Notebooks that call the LHIND gateway need an Authorization header **only off
the LHIND network** (in-network is WAF/IP-authed). The lesson site holds the
key centrally in `localStorage['lrn-llm-key']` (gear icon in the lesson
header). The flow, all same-origin (no CORS):

```
localStorage['lrn-llm-key']
  -> site/lesson.html postMessage({type:'lrn-llm-key', key}) to the iframe
  -> ide/jupyterlite/lrn-key-bridge.js sets window.__LRN_LLM_KEY__
  -> lrn_llm._key() reads it via Pyodide's `js` module
  -> Authorization: Bearer <key>  (omitted when empty)
```

`inject-key-bridge.py` (step 4) wires the bridge into the built HTML; it is
idempotent. Empty key is the in-network default and must keep working.

## LHG theme overrides (stock Jupyter colours → brand colours)

`ide/jupyterlite/lhg-theme.css` overrides JupyterLab's `--jp-*` CSS custom
properties with the same LHG design tokens used elsewhere on the site (see
`site/lrn/tokens.css`), so the notebook UI doesn't look like stock Jupyter
Material blue/green/orange/red. Same story as the key bridge: `jupyter lite
build` regenerates the theme package (and every `index.html`) on every run, so
`inject-lhg-theme.py` (step 4) has to re-copy the stylesheet and re-inject the
`<link>` tag after each build — it can't live inside the app tree either.
Every declaration in `lhg-theme.css` uses `!important`: the theme package's
own CSS is injected into `<head>` at runtime by its webpack bundle, landing
*after* this statically-injected `<link>` regardless of source order, so
`!important` is required for the overrides to actually win.

Then deploy the site (see CLAUDE.md / the SWA deploy steps — remember to also
stage `phases/` into `site/phases/` for the lesson docs).

## Runtime limits

Same as the in-browser Pyodide playground: standard library + numpy/pandas/etc.
that have WASM wheels. No torch/tf/jax. LLM calls run client-side (the LHIND
network can reach the gateway; the browser is on that network).
