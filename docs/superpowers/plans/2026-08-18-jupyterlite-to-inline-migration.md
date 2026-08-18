# Retire JupyterLite: Inline `editable`/`fillin` Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the JupyterLite subsystem and redistribute every notebook's code cells into the corresponding lesson's `docs/en.md` as inline `python editable` (default) or `python fillin` (rare, deterministic-result cells) blocks, so all hands-on code lives in the page's own markdown flow.

**Architecture:** Per lesson, read `docs/en.md` and `code/notebook.py` side by side, find the `en.md` heading each notebook code cell already illustrates (headings and notebook step order match 1:1 per spot-check), and insert the cell's code there as a fenced block. The shared `lrn_llm` bootstrap cell collapses to one block per lesson instead of being repeated. Once every lesson is migrated, delete `ide/jupyterlite/`, the Dockerfile step that stages it, and the notebook-iframe rendering code in `site/lesson.html`.

**Tech Stack:** Static HTML/JS site (`site/lesson.html`), Markdown lesson docs (`phases/**/docs/en.md`), Pyodide (in-browser Python), jupytext-format notebook sources (`phases/**/code/notebook*.py`) being retired.

**Spec:** `docs/superpowers/specs/2026-08-17-jupyterlite-to-inline-migration-design.md`

## Global Constraints

- Every code cell that calls `lrn_llm.call(...)` or `lrn_llm.ping()` (non-deterministic, real network) becomes `python editable`, never `python fillin`.
- The `lrn_llm` bootstrap cell (defines `lrn_llm.call`/`.text`/`.ping`) is inserted **once** per lesson, not once per cell that uses it.
- Notebook code is reused **verbatim** where it lands in `en.md` — this is a placement/wrapping task, not a rewrite.
- A notebook's own `# %% [markdown]` narration ("Step 1", "Step 2", ...) is discarded by default; only fold in a sentence if it says something `en.md`'s existing prose doesn't already say.
- Course-variant notebooks (`code/notebook.<COURSE>.py`) are dropped — only the base `code/notebook.py` gets migrated. Affects `11-llm-engineering/03-structured-outputs`, `11-llm-engineering/10-evaluation`, `11-llm-engineering/01-few-shot-cot`'s sibling `02-few-shot-cot`... (see exact variant file list in Task 2, Step 1).
- `code/notebook*.py` for a lesson is deleted only after that lesson's migration is verified — never in a bulk sweep ahead of content migration.
- JupyterLite decommission (Task 9) happens only after every lesson in Tasks 1-8 is confirmed migrated — deleting it earlier breaks any not-yet-migrated lesson.
- Local testing cannot exercise the real `/api/llm` round-trip (no proxy in `serve.sh`'s plain `python3 -m http.server`) — verification is: code is syntactically valid Python (checked with `python3 -c` for cells that don't need `lrn_llm`; for `lrn_llm`-dependent cells, verify the cell parses and the surrounding markdown/HTML renders, defer the live round-trip to a post-deploy smoke check).

---

## File Structure

- Modify (per lesson, 39 total): `phases/<phase>/<lesson>/docs/en.md` — insert `editable`/`fillin` blocks.
- Delete (per lesson, once migrated): `phases/<phase>/<lesson>/code/notebook.py` and any `code/notebook.<COURSE>.py` variants.
- Modify (Task 9): `site/lesson.html` — remove `renderLrnNotebookPanel`, the non-LRN notebook-panel function, `wipeJupyterLiteStorage`, and their call sites.
- Delete (Task 9): `ide/jupyterlite/` (entire directory).
- Modify (Task 9): `openshift/Dockerfile` — remove the `site/jupyterlite/` staging step, if any exists beyond the generic `COPY site ./site`.
- Modify (Task 9): `CLAUDE.md` — remove/replace §1b's "JupyterLite notebooks are a separate manual build — do not skip" section.

---

### Task 1: Pilot A — migrate `11-llm-engineering/11-caching-cost`

**Files:**
- Modify: `phases/11-llm-engineering/11-caching-cost/docs/en.md`
- Delete: `phases/11-llm-engineering/11-caching-cost/code/notebook.py`

**Interfaces:** None (content-only task, no code interfaces).

- [ ] **Step 1: Read both source files**

Read `phases/11-llm-engineering/11-caching-cost/docs/en.md` (headings: `## Learning Objectives`, `## The Problem`, `## The Concept` with subsections `### The Cost Anatomy of an LLM Call`, `### Provider Caching: Built-in Discounts`, `### Semantic Caching: Your Custom Layer`, `### Exact Caching: Hash and Match`, `### Rate Limiting: Protecting Your Budget`, `### Model Routing: Right Model for the Right Job`, `### Cost Tracking: Know Where the Money Goes`, `### Batching: Bulk Discounts`, `### Budget Alerts and Circuit Breakers`, `### The Optimization Stack`, `## Further Reading`) and `phases/11-llm-engineering/11-caching-cost/code/notebook.py` (cells: bootstrap `lrn_llm` setup, Step 0a endpoint/key print, Step 1 reachability ping, Step 2 cost calculator, Step 3 exact cache, Step 4 semantic cache, and further steps for rate limiting/routing/tracking — read the full file, it is 633 lines).

- [ ] **Step 2: Insert the bootstrap block once**

Immediately after `## The Concept` (before `### The Cost Anatomy of an LLM Call`), insert:

```markdown
Every example below shares this setup — run it once, then the rest reuse `lrn_llm`:

```python editable
import sys, json, types
lrn_llm = types.ModuleType("lrn_llm")
try:
    from pyodide.http import pyfetch as _pyfetch
    _IN_PYODIDE = True
except ImportError:
    import urllib.request as _urlreq
    _IN_PYODIDE = False
lrn_llm.API_BASE = "/api/llm"
lrn_llm.DEFAULT_MODEL = "azure/gpt-5.4-mini"
lrn_llm.API_KEY = ""

async def _lrn_call(messages, *, system=None, max_tokens=400, model=None):
    if system is not None:
        messages = [{"role": "system", "content": system}] + list(messages)
    payload = {"model": model or lrn_llm.DEFAULT_MODEL, "messages": messages,
               "max_completion_tokens": max_tokens}
    headers = {"content-type": "application/json"}
    _key = lrn_llm.API_KEY
    if _key:
        headers["Authorization"] = "Bearer " + _key
    url = lrn_llm.API_BASE.rstrip("/") + "/chat/completions"
    body = json.dumps(payload)
    if _IN_PYODIDE:
        r = await _pyfetch(url, method="POST", headers=headers, body=body)
        data = await r.json()
    else:
        req = _urlreq.Request(url, method="POST", headers=headers, data=body.encode("utf-8"))
        with _urlreq.urlopen(req, timeout=60) as r:
            data = json.loads(r.read())
    if "error" in data:
        raise RuntimeError("LLM error: " + str(data["error"]))
    return data

def _lrn_text(r):
    ch = (r or {}).get("choices") or []
    return (ch[0].get("message", {}) or {}).get("content", "") if ch else ""

async def _lrn_ping():
    r = await _lrn_call([{"role": "user", "content": "Reply with exactly: OK"}], max_tokens=5)
    return {"ok": _lrn_text(r).strip().upper().startswith("OK"), "model": r.get("model")}

lrn_llm.call = _lrn_call
lrn_llm.text = _lrn_text
lrn_llm.ping = _lrn_ping
r = await lrn_llm.ping()
print(f"LLM reachable: {r}")
```
```

- [ ] **Step 3: Insert the cost calculator under its matching heading**

Under `### The Cost Anatomy of an LLM Call`, after the existing prose, insert the notebook's Step 2 cell (the `MODEL_PRICING` dict and `calculate_cost` function, verbatim from `code/notebook.py` lines 79-120) as:

```markdown
```python editable
import hashlib, time, math
from dataclasses import dataclass

MODEL_PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00, "cached_input": 1.25},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60, "cached_input": 0.075},
    "claude-opus-4": {"input": 15.00, "output": 75.00, "cached_input": 1.50},
    "claude-sonnet-4": {"input": 3.00, "output": 15.00, "cached_input": 0.30},
    "claude-haiku-3.5": {"input": 0.80, "output": 4.00, "cached_input": 0.08},
    "gpt-5.4-mini": {"input": 0.15, "output": 0.60, "cached_input": 0.075},
}

def calculate_cost(model, input_tokens, output_tokens, cached_input_tokens=0):
    pricing_key = model.split("/")[-1]
    if pricing_key not in MODEL_PRICING:
        return {"error": f"Unknown model: {model}"}
    pricing = MODEL_PRICING[pricing_key]
    non_cached = input_tokens - cached_input_tokens
    input_cost = (non_cached / 1_000_000) * pricing["input"]
    cached_cost = (cached_input_tokens / 1_000_000) * pricing["cached_input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    total = input_cost + cached_cost + output_cost
    return {
        "model": model, "input_tokens": input_tokens, "output_tokens": output_tokens,
        "cached_input_tokens": cached_input_tokens, "input_cost": round(input_cost, 6),
        "cached_input_cost": round(cached_cost, 6), "output_cost": round(output_cost, 6),
        "total_cost": round(total, 6),
    }

for model in ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4", "claude-haiku-3.5"]:
    cost = calculate_cost(model, 1000, 500)
    print(f"{model:20} ${cost['total_cost']:.6f}")
```
```

Run: `python3 -c "$(sed -n '/^import hashlib/,/total_cost/p' /tmp/cost_block.py)"` after saving the block body to `/tmp/cost_block.py` — confirms it executes with no `lrn_llm` dependency (pure stdlib).
Expected: prints 4 lines of `$` cost values, no traceback.

- [ ] **Step 4: Insert the exact-cache and semantic-cache cells under their headings**

Under `### Exact Caching: Hash and Match`, insert the `ExactCache` class + demo (notebook lines 128-175) as a `python editable` block, reusing the code verbatim. Under `### Semantic Caching: Your Custom Layer`, insert the `simple_embed`/`cosine_similarity`/`SemanticCache` cell (notebook lines 183+, read the rest of the file for the full `SemanticCache` class body) as a `python editable` block, verbatim.

Run: extract both blocks to scratch `.py` files and `python3 <file>.py` each.
Expected: both run with no traceback (pure stdlib, no `lrn_llm` calls in these two cells).

- [ ] **Step 5: Insert the remaining cells (rate limiting, routing, tracking, batching, alerts) under their matching headings**

Read the rest of `code/notebook.py` past line 200 for the remaining cells (`### Rate Limiting`, `### Model Routing`, `### Cost Tracking`, `### Batching`, `### Budget Alerts`). Insert each as a `python editable` block under its matching `en.md` heading, verbatim from the notebook, in the same order they appear in the notebook.

- [ ] **Step 6: Delete the notebook source**

```bash
git rm phases/11-llm-engineering/11-caching-cost/code/notebook.py
```

- [ ] **Step 7: Verify locally**

```bash
./serve.sh &
sleep 3
curl -s "http://localhost:4173/lesson.html?path=phases%2F11-llm-engineering%2F11-caching-cost" | grep -c 'class="code-editable"'
kill %1
```

Expected: a positive count (the editable blocks are present in the rendered page — exact count depends on how many cells were inserted in Steps 2-5, should be ≥7).

- [ ] **Step 8: Commit**

```bash
git add phases/11-llm-engineering/11-caching-cost/docs/en.md
git commit -m "content: migrate 11-caching-cost off JupyterLite to inline editable blocks"
```

---

### Task 2: Pilot B — migrate `11-llm-engineering/03-structured-outputs` (course-variant case)

**Files:**
- Modify: `phases/11-llm-engineering/03-structured-outputs/docs/en.md` (already has one `python fillin` block from the earlier rollout — under `### The Pydantic Pattern` — leave it untouched, insert new `editable` blocks elsewhere)
- Delete: `phases/11-llm-engineering/03-structured-outputs/code/notebook.py`, `code/notebook.AI-15.py`, `code/notebook.AI-18.py`

**Interfaces:** None.

- [ ] **Step 1: Confirm the variant files to drop**

```bash
ls phases/11-llm-engineering/03-structured-outputs/code/
```

Expected: `notebook.py`, `notebook.AI-15.py`, `notebook.AI-18.py` (and possibly a shared `verify.py` or similar — leave any non-`notebook*.py` file alone). Only the three `notebook*.py` files are in scope for this task.

- [ ] **Step 2: Read `docs/en.md` and the base `code/notebook.py`**

Read `phases/11-llm-engineering/03-structured-outputs/docs/en.md` in full (note the existing `python fillin` block under `### The Pydantic Pattern` — do not duplicate or move it) and `phases/11-llm-engineering/03-structured-outputs/code/notebook.py` in full.

- [ ] **Step 3: Insert the bootstrap block once, near the top of `## The Concept`**

Same `lrn_llm` bootstrap pattern as Task 1 Step 2 (read the base notebook's own bootstrap cell — the exact `API_BASE`/`DEFAULT_MODEL` values are identical across all lessons per `CLAUDE.md` — reuse verbatim), inserted once before the first section that needs it.

- [ ] **Step 4: Insert each remaining code cell under its matching `en.md` heading**

Match each notebook cell to its `en.md` heading (`### The Structured Output Spectrum`, `### JSON Schema: The Contract Language`, `### Function Calling / Tool Use`, `### Common Failure Modes`, etc. — read the actual heading list from the file, it may differ slightly from this example set) and insert as `python editable`, verbatim, in notebook order. If any cell's underlying concept is already covered by the existing `fillin` block under `### The Pydantic Pattern`, skip that cell — don't insert a second block for the same concept.

- [ ] **Step 5: Delete all three notebook files**

```bash
git rm phases/11-llm-engineering/03-structured-outputs/code/notebook.py
git rm phases/11-llm-engineering/03-structured-outputs/code/notebook.AI-15.py
git rm phases/11-llm-engineering/03-structured-outputs/code/notebook.AI-18.py
```

- [ ] **Step 6: Verify locally**

```bash
./serve.sh &
sleep 3
curl -s "http://localhost:4173/lesson.html?path=phases%2F11-llm-engineering%2F03-structured-outputs" | grep -c 'class="code-editable"\|class="fillin-block"'
kill %1
```

Expected: positive count including the pre-existing `fillin-block` (1) plus new `editable` blocks.

- [ ] **Step 7: Commit**

```bash
git add phases/11-llm-engineering/03-structured-outputs/docs/en.md
git commit -m "content: migrate 03-structured-outputs off JupyterLite, drop course variants"
```

---

### Task 3: Batch-migrate lessons 1-6 (`00-setup-and-tooling` + `05-nlp-foundations-to-advanced` + 2×`11-llm-engineering`)

**Files:**
- Modify: `docs/en.md` for each of the 6 lessons below.
- Delete: `code/notebook.py` for each.

**Interfaces:** None. This task is executed by dispatching one `general-purpose` subagent per lesson (or one agent covering all 6 sequentially — subagent-driven-development's dispatcher chooses), each given the prompt template below with its lesson path substituted in.

- [ ] **Step 1: Dispatch one subagent per lesson with this prompt (substitute `<LESSON_PATH>`)**

```
Repo: /Users/U751725/AiSchooling/ai-engineering-from-scratch. Migrate one
lesson off JupyterLite by folding its notebook's code cells into its
docs/en.md as inline python editable blocks, then deleting the notebook
source. Read docs/superpowers/specs/2026-08-17-jupyterlite-to-inline-migration-design.md
first for the full rationale and rules. Read
docs/superpowers/plans/2026-08-18-jupyterlite-to-inline-migration.md Task 1
(11-caching-cost) as your worked example of the exact format expected.

Lesson: phases/<LESSON_PATH>

Steps:
1. Read phases/<LESSON_PATH>/docs/en.md and phases/<LESSON_PATH>/code/notebook.py in full.
2. If the notebook has a `lrn_llm` bootstrap cell (defines lrn_llm.call/.text/.ping),
   insert it ONCE as a `python editable` block near the top of the first
   en.md section that needs it -- not repeated per cell.
3. For every other code cell, find the en.md heading it illustrates (cell's
   own `# %% [markdown]` title matches an en.md `##`/`###` heading almost
   always -- if truly no match exists, place it under the most relevant
   existing heading and say so in your report) and insert the cell's code
   verbatim as a `python editable` block right after that section's prose.
4. Any code cell with a fixed, checkable, non-LLM-call result (rare) may
   become `python fillin` with a PASS/WRONG self-check instead -- same bar
   as the existing fillin rollout in this repo (look at any other lesson's
   en.md with a fillin block for the format).
5. Drop the notebook's own step-navigation markdown ("Step 1", "Step 2"...)
   -- only fold in a sentence if it says something en.md doesn't already say.
6. For any code cell that does NOT call lrn_llm, extract it to a scratch
   .py file and run `python3 <file>.py` to confirm it executes without
   error before inserting it. For lrn_llm-dependent cells, just confirm
   the code is syntactically valid (`python3 -m py_compile <file>.py`) --
   the live call can't be tested locally.
7. Delete the notebook: `git rm phases/<LESSON_PATH>/code/notebook.py`
   (also remove any code/notebook.<COURSE>.py variants if present -- check
   with `ls phases/<LESSON_PATH>/code/` first).
8. Report back one line: `<LESSON_PATH> | N editable blocks | M fillin
   blocks | notebook deleted: yes`. Keep the report under 100 words.

Do not touch site/lesson.html, ide/jupyterlite/, or any other lesson's files.
```

Lessons for this batch (dispatch 6 in parallel):
1. `00-setup-and-tooling/01-dev-environment` — special case: this notebook has ZERO real code cells (all "cells" are markdown containing fenced bash/shell install commands, not executable Python — confirmed by inspection, 0 matches for `^# %%$` in the file). Tell this subagent explicitly: check whether `en.md` already covers the same install steps (it likely does, per `## The Concept`/`## Ship It`); if so, just delete the notebook with no new blocks needed; only add an `editable` block for the one genuine Python snippet (`import sys, numpy` version check) if `en.md` doesn't already have an equivalent, and skip the `torch.cuda.is_available()` cell entirely (torch has no Pyodide wheel, matches `PY_NO_WASM`).
2. `05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding`
3. `05-nlp-foundations-to-advanced/23-chunking-strategies-rag`
4. `05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks`
5. `11-llm-engineering/02-few-shot-cot`
6. `11-llm-engineering/05-context-engineering`

- [ ] **Step 2: Verify each report confirms notebook deletion and at least one inserted block**

Read each subagent's one-line report. If any lesson reports 0 blocks AND the notebook had real code cells (not the dev-environment special case), that's a failure — re-dispatch that single lesson with the same prompt.

- [ ] **Step 3: Spot-check one lesson locally**

```bash
./serve.sh &
sleep 3
curl -s "http://localhost:4173/lesson.html?path=phases%2F11-llm-engineering%2F05-context-engineering" | grep -c 'class="code-editable"'
kill %1
```

Expected: positive count.

- [ ] **Step 4: Commit**

```bash
git add phases/00-setup-and-tooling/01-dev-environment/docs/en.md \
        phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/docs/en.md \
        phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/docs/en.md \
        phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/docs/en.md \
        phases/11-llm-engineering/02-few-shot-cot/docs/en.md \
        phases/11-llm-engineering/05-context-engineering/docs/en.md
git commit -m "content: migrate batch 1 (6 lessons) off JupyterLite"
```

---

### Task 4: Batch-migrate lessons 7-12 (`11-llm-engineering` continued)

Same prompt template and procedure as Task 3, Steps 1-4, for this lesson list:

1. `11-llm-engineering/06-rag`
2. `11-llm-engineering/07-advanced-rag`
3. `11-llm-engineering/09-function-calling`
4. `11-llm-engineering/10-evaluation` — has course variants (`notebook.AI-15.py` or similar, check `ls phases/11-llm-engineering/10-evaluation/code/` first); tell the subagent to drop variants same as Task 2. This lesson already has an existing `python fillin` block from the earlier rollout (ROUGE-L LCS exercise) — don't duplicate it.
5. `11-llm-engineering/12-guardrails`
6. `11-llm-engineering/13-production-app`

- [ ] **Step 1: Dispatch all 6 in parallel with the Task 3 Step 1 prompt template, substituting each lesson path**
- [ ] **Step 2: Verify each report**
- [ ] **Step 3: Spot-check `11-llm-engineering/10-evaluation` locally** (same curl pattern as Task 3 Step 3, confirm both the pre-existing `fillin-block` and new `editable` blocks are present, no duplicated ROUGE-L content)
- [ ] **Step 4: Commit** (`git add` the 6 `docs/en.md` files, `git commit -m "content: migrate batch 2 (6 lessons) off JupyterLite"`)

---

### Task 5: Batch-migrate lessons 13-18 (`11-llm-engineering` tail + `13-tools-and-protocols` start)

Same prompt template and procedure, for:

1. `11-llm-engineering/14-model-context-protocol`
2. `13-tools-and-protocols/01-the-tool-interface`
3. `13-tools-and-protocols/02-function-calling-deep-dive` — already has a `python fillin` block from the earlier rollout; don't duplicate.
4. `13-tools-and-protocols/04-structured-output` — already has a `python fillin` block from the earlier rollout; don't duplicate.
5. `13-tools-and-protocols/06-mcp-fundamentals`
6. `13-tools-and-protocols/07-building-an-mcp-server` — already has a `python fillin` block from the earlier rollout; don't duplicate.

- [ ] **Step 1: Dispatch all 6 in parallel**
- [ ] **Step 2: Verify each report**
- [ ] **Step 3: Spot-check `13-tools-and-protocols/07-building-an-mcp-server` locally**
- [ ] **Step 4: Commit** (`git commit -m "content: migrate batch 3 (6 lessons) off JupyterLite"`)

---

### Task 6: Batch-migrate lessons 19-24 (`13-tools-and-protocols` tail + `14-agent-engineering` start)

Same prompt template and procedure, for:

1. `13-tools-and-protocols/17-mcp-gateways-and-registries`
2. `13-tools-and-protocols/23-capstone-tool-ecosystem`
3. `14-agent-engineering/01-the-agent-loop`
4. `14-agent-engineering/02-rewoo-plan-and-execute`
5. `14-agent-engineering/03-reflexion-verbal-rl`
6. `14-agent-engineering/04-tree-of-thoughts-lats`

- [ ] **Step 1: Dispatch all 6 in parallel**
- [ ] **Step 2: Verify each report**
- [ ] **Step 3: Spot-check `14-agent-engineering/01-the-agent-loop` locally**
- [ ] **Step 4: Commit** (`git commit -m "content: migrate batch 4 (6 lessons) off JupyterLite"`)

---

### Task 7: Batch-migrate lessons 25-30 (`14-agent-engineering` continued)

Same prompt template and procedure, for:

1. `14-agent-engineering/13-langgraph-stateful-graphs`
2. `14-agent-engineering/16-openai-agents-sdk`
3. `14-agent-engineering/17-claude-agent-sdk`
4. `14-agent-engineering/31-agent-workbench-why-models-fail`
5. `14-agent-engineering/39-reviewer-agent`
6. `16-multi-agent-and-swarms/08-role-specialization`

- [ ] **Step 1: Dispatch all 6 in parallel**
- [ ] **Step 2: Verify each report**
- [ ] **Step 3: Spot-check `14-agent-engineering/13-langgraph-stateful-graphs` locally** — this lesson already has a `python fillin` block from the earlier rollout (LangGraph reducers); confirm no duplication.
- [ ] **Step 4: Commit** (`git commit -m "content: migrate batch 5 (6 lessons) off JupyterLite"`)

---

### Task 8: Batch-migrate lessons 31-37 (`18-ethics-safety-alignment` + `19-capstone-projects`)

Same prompt template and procedure, for:

1. `18-ethics-safety-alignment/20-bias-representational-harm`
2. `19-capstone-projects/20-agent-harness-loop-contract`
3. `19-capstone-projects/21-tool-registry-schema-validation`
4. `19-capstone-projects/23-function-call-dispatcher`
5. `19-capstone-projects/24-plan-execute-control-flow` — already has a `python fillin` block from the earlier rollout; don't duplicate.
6. `19-capstone-projects/27-eval-harness-fixture-tasks`
7. `19-capstone-projects/29-end-to-end-coding-task-demo`

- [ ] **Step 1: Dispatch all 7 in parallel**
- [ ] **Step 2: Verify each report**
- [ ] **Step 3: Spot-check `19-capstone-projects/24-plan-execute-control-flow` locally**
- [ ] **Step 4: Commit** (`git commit -m "content: migrate batch 6 (7 lessons) off JupyterLite"`)

---

### Task 9: Decommission the JupyterLite subsystem

**Files:**
- Delete: `ide/jupyterlite/` (entire directory)
- Modify: `site/lesson.html`
- Modify: `openshift/Dockerfile`
- Modify: `CLAUDE.md`

**Interfaces:** None.

- [ ] **Step 1: Confirm zero remaining notebook sources**

```bash
find phases -path "*/code/notebook*.py" | wc -l
```

Expected: `0`. If not zero, STOP — go back and migrate the remaining lessons before proceeding with this task.

- [ ] **Step 2: Remove the notebook-panel rendering code from `site/lesson.html`**

```bash
grep -n "renderLrnNotebookPanel\|wipeJupyterLiteStorage\|jupyterlite/" site/lesson.html
```

Read the surrounding function bodies at each match (the two rendering functions span roughly lines 5075-5470, but re-grep since earlier tasks may have shifted line numbers). Remove:
- The `renderLrnNotebookPanel` function definition and its call site.
- The non-LRN notebook-panel function definition and its call site.
- The `wipeJupyterLiteStorage` function (only used by the two functions above).
- Any leftover CSS rules scoped to notebook-panel classes that have no other use (grep for the class names used in the removed HTML strings, e.g. search for `notebook-panel`, `code-card-btn` — only remove CSS for classes with zero remaining usages after the JS removal).

- [ ] **Step 3: Remove the JupyterLite build step from `openshift/Dockerfile`**

```bash
grep -n "jupyterlite" openshift/Dockerfile
```

If any `COPY`/`RUN` line references `site/jupyterlite` or `ide/jupyterlite` specifically, remove it. If the only reference is the generic `COPY site ./site` (which now simply won't find a `site/jupyterlite/` directory since nothing generates it anymore), no change needed there.

- [ ] **Step 4: Delete `ide/jupyterlite/`**

```bash
git rm -r ide/jupyterlite/
```

- [ ] **Step 5: Update `CLAUDE.md`**

Remove the `### JupyterLite notebooks are a separate manual build — do not skip` section (§1b) and its two-step build reminder (`bash ide/jupyterlite/build.sh`) from the "Redeploy after a code change" instructions, since there is no longer a separate notebook build step.

- [ ] **Step 6: Final verification sweep**

```bash
find phases -path "*/code/notebook*.py" | wc -l          # expect 0
grep -rc "jupyterlite" site/lesson.html                   # expect 0 (or "site/lesson.html:0")
test -d ide/jupyterlite && echo "STILL EXISTS" || echo "removed"   # expect "removed"
grep -c "jupyterlite" openshift/Dockerfile 2>/dev/null || echo 0   # expect 0
```

Expected: all checks pass as noted above.

- [ ] **Step 7: Local smoke test**

```bash
./serve.sh &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4173/lesson.html?path=phases%2F11-llm-engineering%2F11-caching-cost"
curl -s "http://localhost:4173/lesson.html?path=phases%2F11-llm-engineering%2F11-caching-cost" | grep -c 'class="code-editable"'
kill %1
```

Expected: `200` status, positive `code-editable` count, no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: decommission JupyterLite, all lessons now use inline editable/fillin blocks"
```
