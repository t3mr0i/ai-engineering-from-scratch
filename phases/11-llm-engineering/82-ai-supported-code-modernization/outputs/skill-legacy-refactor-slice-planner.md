# Skill: Legacy Refactor Slice Planner

One-page decision aid for the AI-supported code modernization workflow.
Use this before opening a model, a PR, or a sprint ticket.

---

## 1. Four-Pass Audit — Prompt Templates

Run each pass in sequence. Feed the output of each pass into the next prompt.

| Pass | Prompt (paste + append the source files) |
|---|---|
| **1. Structure** | "Map the module's public API, all internal functions, and every call site in this repo. List any dead code. Output as a markdown dependency table with columns: Symbol \| Type \| Called from." |
| **2. Risk** | "Given the structure above: identify hardcoded secrets, SQL/shell injection surfaces, insecure deserialization, and direct dependencies with known CVEs. For each finding, state the OWASP Top 10 category and a one-line remediation." |
| **3. Coverage** | "Enumerate every branch in this module. For each branch, state: (a) whether a test in the test suite exercises it, (b) what input triggers it, (c) whether the failure path is tested. Output a table: Branch \| Tested? \| Input shape \| Failure path tested?" |
| **4. Slice candidates** | "Given the structure, risk list, and coverage gaps above: propose 5–8 refactoring slices. For each slice: name, files changed, estimated line delta, new tests required, risk eliminated. Order by: (1) highest risk eliminated, (2) lowest coupling, (3) has or can get tests. Output as JSON array." |

**Reproducibility check:** run Pass 4 twice (temperature 0). If the slice list differs materially, the codebase context is underspecified — fill the gaps before acting.

---

## 2. Module Readiness Scoring Rubric

Score each candidate module before committing to a slice. Total out of 10.

| Dimension | Red (0) | Amber (1) | Green (2) |
|---|---|---|---|
| **Coupling** | >5 callers across bounded contexts | 2–5 callers, partial interfaces | 0–1 caller, clear single owner |
| **Test Coverage** | <40% branch; no failure-path integration test | 40–70%; some integration tests | >70%; failure paths covered |
| **Secret Hygiene** | Hardcoded secrets in source | Config centralized, not injected | Config injected at boundary, validated at startup |
| **Dependency Age** | Direct dep with known CVE | No CVE, but end-of-life | All deps on supported versions |
| **Change Frequency** | >3 commits/week (past 6 months) | 1–3 commits/week | <1 commit/week (stable or frozen) |

**Readiness tiers:**
- **0–4 (Red):** Stabilize first. Do not cut a slice until blocking Red dimensions are resolved.
- **5–7 (Amber):** Proceed with caution. Explicitly close amber gaps before the slice ships.
- **8–10 (Green):** Safe to start. Recommended first slice target.

---

## 3. Slice Sizing Rules of Thumb

A slice is correctly sized when all of the following are true:

- [ ] The full diff is reviewable by a senior engineer in under 30 minutes.
- [ ] The scope is exactly one module boundary, one dependency upgrade, or one security pattern applied consistently — not all three.
- [ ] Every new or changed test is explainable in one sentence.
- [ ] The slice can be deployed and rolled back independently of adjacent slices.
- [ ] The risk eliminated is stated explicitly in the PR description.

If any box is unchecked, split the slice. Do not force-merge oversized slices under deadline pressure.

---

## 4. Verification Gate Checklist (links to Phase 14 · 38)

Each slice must pass these gates before the next slice begins.

| Gate | Check | Tool / evidence |
|---|---|---|
| **Coverage delta** | Branch coverage did not decrease | `coverage.py` or equivalent; diff the report |
| **No assertion weakening** | No test was changed to make a previously-failing assertion pass | `git diff` the test files; flag any assertion relaxation |
| **Security pass** | Risk findings from Pass 2 that this slice addressed are no longer present | Re-run the risk prompt on the changed files only |
| **Caller compatibility** | All call sites in the repo still compile and pass their own tests | CI full run; do not merge on subset-only green |
| **Diff size bound** | PR diff is within the agreed slice size limit | `git diff --stat`; flag if line count exceeds agreed threshold |

---

## 5. Prioritization Decision Table

When you have multiple candidate slices, use this order:

1. **Exclude Red-tiered modules** unless no other slice exists. Stabilize first.
2. **Rank remaining by:** readiness score + risk reduction estimate (combined score).
3. **Tie-break by coupling:** prefer the module with the most isolated interface (Green coupling dimension wins).
4. **First slice should always be the easiest win:** Green tier, low risk reduction is acceptable — the goal is to prove the workflow, not to maximize impact on the first cut.

---

## 6. Handoff to Reviewer Agent (Phase 14 · 39)

The Pass 4 JSON output should include these fields so the reviewer agent can run its gates without additional context:

```json
{
  "slice_id": "slice-003",
  "module": "auth_middleware.py",
  "files_changed": ["auth_middleware.py", "tests/test_auth.py"],
  "risk_eliminated": "EOL dependency upgrade; config injected at boundary",
  "new_tests_required": ["test_config_injection_missing", "test_token_expiry_failure_path"],
  "readiness_score": 7,
  "readiness_tier": "Amber",
  "estimated_line_delta": 120,
  "verification_gates": ["coverage_delta", "caller_compatibility", "diff_size_bound"]
}
```

Missing fields cause the reviewer agent to request human clarification — close the gap here, not in the PR review.
