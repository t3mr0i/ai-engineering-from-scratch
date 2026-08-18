# Retire JupyterLite: inline `editable`/`fillin` blocks in `docs/en.md`

Status: design, not yet implemented.

## Problem

`site/lesson.html` currently ships two separate interaction models for
hands-on code:

1. **Inline blocks** in `docs/en.md` — plain read-only, `python editable`
   (edit + Run, real Pyodide execution incl. real network `pyfetch` calls),
   and (as of the fillin rollout, see git history around commit range
   including the 37-lesson rollout) `python fillin` (guided blanks + a
   `PASS`/`WRONG` self-check against a hardcoded reference value).
2. **JupyterLite** — a full embedded notebook IDE (`ide/jupyterlite/` build
   pipeline → `site/jupyterlite/`, iframe-embedded via
   `renderLrnNotebookPanel`/the non-LRN notebook-panel function in
   `site/lesson.html`, ~lines 5210-5470), sourced from
   `phases/**/code/notebook*.py` (jupytext `# %%` / `# %% [markdown]`
   cell format).

The user does not see what JupyterLite buys over the inline blocks and wants
it gone, with the inline blocks picking up whatever slack that requires.

**Why JupyterLite exists at all, and why this isn't a pure delete:**
39 lessons have a base `code/notebook.py` (53 files total counting the 14
course-variant files on 3 of those lessons — see Scope below). Of the 39,
**38 make a real call to a live LLM gateway** (`lrn_llm.call()` →
same-origin `/api/llm/chat/completions` → `LLM_GATEWAY_KEY`-backed proxy,
see `CLAUDE.md` §1b) — the sole exception is
`00-setup-and-tooling/01-dev-environment`, whose "notebook" has zero real
code cells (it's an install-instructions guide formatted as markdown cells
containing fenced shell blocks, not executable Python). Average cell count
across the 39 is ~23 per notebook. These are multi-step, stateful, exploratory walkthroughs
with genuinely non-deterministic output (real model responses) — not
graded exercises. `fillin`'s `PASS`/`WRONG` self-check requires a fixed
reference value, which doesn't exist for "call the model and see what comes
back." `editable` blocks have no such requirement (no self-check, just
edit-and-run) and already support real network calls in Pyodide — they are
the correct target for these cells, not `fillin`.

Separately: for each of these 39 lessons, `docs/en.md` **already has its own
full prose walkthrough of the same concepts**, written independently of the
notebook (confirmed by spot-check: `11-llm-engineering/11-caching-cost`'s
`docs/en.md` has `### Exact Caching: Hash and Match`, `### Semantic Caching:
Your Custom Layer`, etc. as prose sections, while `code/notebook.py` has
`# %% [markdown]` cells titled "Step 3 — Exact Cache", "Step 4 — Semantic
Cache" covering the same ground from scratch). The notebook's own markdown
cells are therefore mostly **redundant scaffolding for notebook navigation**
("Step 0a", "Step 1", ...), not new content. This is the reason the
migration cannot be a mechanical `# %% [markdown]` → prose dump: that would
duplicate what `en.md` already says. The actual per-lesson work is placing
each **code** cell next to the `en.md` section it already illustrates, and
mostly discarding the notebook's own narration.

## Scope

**In scope:**
- All 39 lessons with `phases/**/code/notebook.py`.
- Each code cell becomes one ```` ```python editable ```` block (default) or
  ```` ```python fillin ```` (only for the rare cell with a deterministic,
  checkable result — same bar as the earlier 37-lesson rollout), inserted
  into `docs/en.md` next to the prose section it illustrates.
- The shared `lrn_llm` setup boilerplate (first ~20-50 lines of every
  notebook, identical pattern each time) collapses to **one** block per
  lesson, not repeated per cell.
- Full decommission of the JupyterLite subsystem (list below).
- `CLAUDE.md` update: remove/replace the "JupyterLite notebooks are a
  separate manual build — do not skip" section (§1b) with whatever the new
  build story is (none — inline blocks ship as part of `docs/en.md`, no
  separate build step).

**Explicitly out of scope / open questions (need your call before I write
the implementation plan):**

1. **Course-variant notebooks.** 3 lessons (`11-llm-engineering/
   01-prompt-engineering`, `03-structured-outputs`, `10-evaluation`) have
   per-course variants (`notebook.AI-15.py`, `notebook.AI-18.py`, etc. — 14
   variant files total), selected today via `?course=` in the URL.
   `docs/en.md` is not per-course. Default: inline the base `notebook.py`
   variant only, drop the course-specific ones (minor content loss, 3
   lessons). Flag if you want the variant content preserved some other way
   (e.g. a `> **For AI-15:**` callout) — that's extra design, not covered
   below.
2. **Local testing of live-LLM `editable` blocks.** Per `CLAUDE.md`, `/api/
   llm` is only real on the deployed OpenShift route (`serve.sh`'s local
   `python3 -m http.server` has no such proxy — lesson.html's
   `IS_LOCAL_DEV` check already falls back for lesson *content* fetching,
   but does not stand up a fake `/api/llm`). So: cell *syntax* and Pyodide
   *load* are locally verifiable, but the actual live-call round-trip is
   only verifiable against the deployed route. The plan below accounts for
   this — see Testing.

## Content transformation rules

Per lesson (one agent per small batch, same shape as the fillin rollout):

1. Read `docs/en.md` and `code/notebook.py` side by side.
2. Split the notebook into cells on `# %%` / `# %% [markdown]` markers
   (already the jupytext convention every file follows — confirmed via
   spot-check of `11-caching-cost/code/notebook.py`).
3. Identify the shared `lrn_llm` bootstrap cell (the one defining
   `lrn_llm.call`/`.text`/`.ping`, always first) — this becomes a single
   ```` ```python editable ```` block placed once, near the top of the
   lesson's `## The Concept` section (or wherever the first cell that needs
   it lands), not repeated.
4. For every remaining code cell: find the `docs/en.md` heading whose prose
   already covers that cell's concept (match on the cell's own `# %%
   [markdown]` title against `en.md`'s `##`/`###` headings — they describe
   the same steps in the same order in every spot-checked lesson, so this is
   a reliable anchor, not a guess). Insert the code, wrapped as `python
   editable`, immediately after that section's prose. Reuse the cell's code
   verbatim — this is a placement/wrapping task, not a rewrite.
5. If a cell's `# %% [markdown]` narration says something `en.md` does not
   already say, fold the delta into a short sentence in `en.md` (rare, per
   the spot-check finding above — most narration is pure step-navigation
   filler like "Step 3 — Exact Cache" that restates the heading and adds
   nothing).
6. If a cell has a fixed, checkable output (no live LLM call, deterministic
   given fixed inputs) and it clearly demonstrates a bug/fix worth testing —
   same bar as the fillin rollout — make it `fillin` instead of `editable`.
   Expect this to be rare (the ~2% of cells that don't call `lrn_llm`).
7. Delete `code/notebook*.py` for that lesson once its content has been
   redistributed into `en.md`.

## Decommission list

- `ide/jupyterlite/` (build.sh, build-notebooks.sh, py_to_notebook.py,
  inject-lhg-theme.py, lrn_llm.py template, jupyter-lite.json,
  jupyter_lite_config.json, overrides.json, lhg-theme.css, README.md).
- `site/jupyterlite/` build output (already gitignored, nothing to remove
  from git, just stop generating it).
- `openshift/Dockerfile`: remove whatever step copies `site/jupyterlite/`
  into the image (per `CLAUDE.md` §1b, `COPY site ./site` picks up whatever
  is on disk at build time — once nothing generates `site/jupyterlite/`
  there's nothing to copy, but confirm no explicit separate COPY line
  references it).
- `site/lesson.html`: `renderLrnNotebookPanel` (~5210-5310), the
  non-LRN notebook-panel function (~5350-5470), `wipeJupyterLiteStorage`
  (~5312-5350), and their call sites (~5075 `renderLrnNotebookPanel(...)`
  and whatever calls the non-LRN variant) — exact line numbers will drift
  as earlier edits land, re-grep before touching.
- `phases/**/code/notebook*.py` — deleted lesson-by-lesson as each is
  migrated (step 7 above), not in one bulk sweep, so a partially-migrated
  state never has a lesson that's silently lost content.
- `CLAUDE.md` §1b "JupyterLite notebooks are a separate manual build — do
  not skip" — remove or replace once no lesson references it.
- `ide/jupyterlite/build.sh` is invoked from... (confirm nothing in
  `.gitlab-ci.yml`/`openshift/Dockerfile` shells out to it directly beyond
  what's already covered above — grep before removing).

## Testing

- Per lesson, after migration: load it locally (`./serve.sh`), confirm every
  `editable`/`fillin` block renders, syntax-highlights, and — for blocks
  that don't need `/api/llm` — actually runs in Pyodide via the page's Run
  button (same manual-verification bar as the fillin rollout: build the
  block's code, sanity-check it standalone with `python3` first).
- Blocks that call `lrn_llm.call`/`.ping` cannot be end-to-end verified
  locally (§ Open questions, point 2) — verify Pyodide *loads* the block
  (`pyfetch` import resolves, no syntax errors) and defer the live-call
  round-trip check to a post-deploy smoke pass on the real OpenShift route,
  same as any other change touching `/api/llm`.
- After all 53 are migrated: grep confirms zero remaining
  `phases/**/code/notebook*.py` and zero remaining references to
  `jupyterlite/` in `site/lesson.html`; `ide/jupyterlite/` directory
  removed; `openshift/Dockerfile` no longer stages it.

## Rollout

Same shape as the 37-lesson fillin rollout: 2 pilot lessons done directly
(one with the `lrn_llm` bootstrap-block consolidation, one with the
course-variant case), shown for review, then the remaining 37 lessons split
into parallel batches (6-7 lessons each) via the `Agent` tool, each batch
agent given this document's transformation rules plus the pilot(s) as a
format reference. Decommission (the list above) happens as a
final pass once all 39 lessons are confirmed migrated, not incrementally —
deleting `ide/jupyterlite/` mid-migration would break any lesson not yet
converted.

## Open questions recap (need answers before the implementation plan)

1. Course-variant notebooks (3 lessons, 14 files): drop the variants
   (default) or preserve them some other way?
2. Anything else you want reflected before I turn this into an
   implementation plan via writing-plans?
