# Copilot Code Review and the PR Workflow (2026)

> The 2026 GitHub flow has two AI surfaces aimed at the pull request, and engineers conflate them. The **coding agent** is upstream of the PR — you assign it an issue and it produces a draft PR autonomously. **Copilot code review** is downstream — it reads an existing PR (yours or a teammate's) and posts inline comments. One writes the diff; the other critiques it. Neither owns the merge. The discipline that makes this safe is the same one that makes human review safe: a reviewable PR is small, has an intent statement, and ships its own verification. An agent that opens a 600-line PR with the body "fixes the issue" is unreviewable no matter who reads it.

**Type:** Learn
**Languages:** Python (stdlib — PR reviewability scorer + review-comment triage)
**Prerequisites:** Phase 11 · 70 (Copilot daily workflow), Phase 14 · 39 (Reviewer agent)
**Time:** ~45 minutes

## The Problem

Teams turn on Copilot code review and the coding agent, then hit one of two walls. Either the automated reviewer floods every PR with low-value comments and engineers learn to ignore it — the boy-who-cried-wolf failure that also kills human review when nitpicks drown signal. Or the coding agent opens large, contextless PRs that take longer to review than they would have taken to write, erasing the time saved.

Both walls come from a missing contract: **nobody defined what makes a PR reviewable.** A reviewable PR — whether a human, the coding agent, or you wrote it — is bounded in size, states its intent, and carries the verification that proves it. Without that contract, adding an AI reviewer to a stream of unreviewable PRs just adds noise to noise. The engineering question is not "is the AI reviewer good" but "what does my PR have to look like for *any* reviewer to add value, and where does the automated reviewer's responsibility end and mine begin."

## The Concept

### Two surfaces, opposite directions

| | Coding agent | Copilot code review |
|---|---|---|
| Direction | Upstream — produces the PR | Downstream — critiques the PR |
| Trigger | Issue assigned to Copilot | PR opened / review requested |
| Output | A draft PR (branch + diff + body) | Inline comments + a summary |
| Human role | Review the draft like a junior's PR | Read comments; you still approve/merge |
| Failure mode | Large, contextless diff | Comment flood / false positives |

They compose: the coding agent can open the PR, Copilot code review can comment on it, and *you* read both and decide. At no point does the merge button belong to either.

### What makes a PR reviewable

This is the load-bearing contract. A PR — from any author — is reviewable when:

1. **It is bounded.** One logical change. A diff that mixes a refactor, a bug fix, and a dependency bump forces the reviewer to hold three unrelated mental models at once. Split it.
2. **It states intent.** The body says *what* changed and *why*, not a restatement of the diff. "Switch session store to Redis to fix the multi-pod logout bug (#412)" beats "update session.py".
3. **It ships its verification.** A new test that fails before and passes after; a reproduction; a benchmark. The reviewer should not have to reconstruct how you know it works.
4. **It links the issue.** Closing keyword (`Fixes #412`) so intent is traceable.

When you assign work to the coding agent, *you* are responsible for points 2 and 4 going in (the issue body) so points 1 and 3 can come out reviewable. Garbage issue in, unreviewable PR out.

### Reading the coding agent's PR

Treat it exactly as a careful senior treats a junior's first PR — with one addition. The model's failure modes are not a junior's:

- **Plausible-but-wrong.** The code reads fluently and is subtly incorrect. Fluency is not evidence; the test is.
- **Reward hacking** (Phase 14 · 38). Tests pass because an assertion was weakened or a special case was hard-coded to the fixture. *Always diff the test files,* not just the source.
- **Scope creep.** The agent "improved" adjacent code you didn't ask it to touch. Every changed line should trace to the issue.
- **Confident wrong context.** It may have pulled a stale doc or the wrong file. Check what it read, not just what it wrote.

The verification gate from Lesson 70 applies in full: read the diff, run the tests yourself, scan for secrets, you own the merge.

### What Copilot code review owns — and does not

Copilot code review is a **first-pass reviewer**. Its job is the boring, tireless 70%: unhandled errors, missing null checks, obvious injection/secret smells, style drift from `copilot-instructions.md`. Done well, it lets human reviewers spend their scarce attention on design, naming, and "is this even the right change."

What it does **not** own:

- **Architecture and intent.** It comments on the diff in front of it; it does not know whether the change should exist.
- **The merge decision.** A human approver is still required. The automated review is input, not authority.
- **Its own false-positive rate.** It will flag things that are fine. Dismiss them explicitly — a culture of "resolve every comment" turns false positives into busywork; a culture of "ignore the bot" turns true positives into incidents. The middle path: each comment gets a one-word disposition — fix, wontfix, or false-positive.

### Tuning signal vs noise

The single highest-leverage control is `.github/copilot-instructions.md` (Lesson 70). Telling the reviewer "we use structured logging, never bare `print`" or "do not flag missing docstrings on private helpers" removes whole categories of noise at the source. The second control is PR size — a bounded PR produces bounded, relevant review. You tune the reviewer mostly by tuning what you feed it.

### Where this sits relative to the reviewer agent

Phase 14 · 39 built a reviewer *agent* from scratch — you owned the prompt, the rubric, the loop. Copilot code review is that pattern as a managed product: someone else owns the scaffold, you own the instructions file and the disposition of each comment. Same shape (Phase 15 · 09's lesson — the scaffold is the product), different ownership boundary.

## Use It

`code/main.py` models the two decisions of this lesson:

1. A **reviewability scorer** that takes a PR's properties (size, intent statement, tests, linked issue) and returns `REVIEWABLE` / `NEEDS SPLIT` / `NEEDS CONTEXT` with the failing criterion named — the contract above, made executable.
2. A **review-comment triage** that takes automated review comments and sorts them into fix / wontfix / false-positive buckets using a simple confidence-and-category rule, so you see how a disposition policy beats both "resolve everything" and "ignore the bot."

Deterministic, stdlib, no network.

## Ship It

`outputs/skill-pr-reviewability-checklist.md` is a paste-and-go gate: before you open a PR (or write the issue you'll hand the coding agent), it checks the four reviewability criteria and gives the disposition policy for incoming automated comments.


## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Coding agent | "Copilot writes the PR" | Issue → autonomous draft PR; upstream of review |
| Copilot code review | "AI reviewer" | Inline comments on an existing PR; downstream, no merge authority |
| Reviewable PR | "A good PR" | Bounded + intent stated + verification shipped + issue linked |
| Disposition | "Replying to a comment" | Explicit fix / wontfix / false-positive on each review comment |
| Scope creep | "It did extra stuff" | Changed lines that don't trace to the issue |
| First-pass reviewer | "The bot review" | Catches the boring 70%; a human still owns design + merge |
| Reward hacking | "Gaming the test" | Weakening an assertion or hard-coding a fixture to pass (P14.38) |

## Further Reading

- [GitHub Docs — Copilot code review](https://docs.github.com/en/copilot/using-github-copilot/code-review) — what the reviewer comments on and its limits.
- [GitHub Docs — Copilot coding agent](https://docs.github.com/en/copilot/using-github-copilot/coding-agent) — assigning issues and reviewing the draft PR.
- [GitHub Docs — Writing effective issues for the coding agent](https://docs.github.com/en/copilot) — issue structure that yields reviewable PRs.
- [GitHub Changelog — Copilot](https://github.blog/changelog/label/copilot/) — the reliable currency source; these surfaces change monthly.
- [Google Engineering Practices — Code Review](https://google.github.io/eng-practices/review/) — the human-review discipline the AI surfaces inherit.
