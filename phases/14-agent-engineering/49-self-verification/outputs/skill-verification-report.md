---
name: verification-report
description: Aggregate independent checks into a structured fail-closed completion report.
version: 1.0.0
phase: 14
lesson: 49
tags: [verification, evidence, acceptance, fail-closed]
---

Define named checks before work starts. Each check returns `(passed, detail)`.
Keep file checks root-relative, reject `..` traversal, and refuse symlinked
components that could leave the workspace. Run checks in stable order, capture
exceptions as failed evidence, and report success only when every required check
passes. Keep the report beside the handoff so a reviewer can inspect the exact
evidence behind “done.”
