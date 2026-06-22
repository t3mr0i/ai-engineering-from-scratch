# Skill: PR Reviewability Checklist

Use before opening a PR — or before writing the issue you'll hand the Copilot
coding agent. A PR that fails any of the four is unreviewable no matter who
(human, agent, or you) reads it.

## The four criteria

- [ ] **Bounded** — one logical change. Mixing refactor + bugfix + dep bump? Split it.
- [ ] **Intent stated** — body says *what changed and why*, not a diff restatement.
      Good: "Switch session store to Redis to fix multi-pod logout (#412)."
- [ ] **Verification shipped** — a test that fails before / passes after, a repro, or a benchmark.
- [ ] **Issue linked** — closing keyword (`Fixes #412`) so intent is traceable.

If you're assigning the coding agent: you own *intent* and *issue link* in the
issue body, going in. Garbage issue in → unreviewable PR out.

## Reviewing a coding-agent PR (junior-PR rules + model failure modes)

In order:

1. **Diff the test files** — guards against reward hacking (weakened assertion / fixture hard-code).
2. **Every changed line traces to the issue** — guards against scope creep.
3. **Check what it read**, not just what it wrote — guards against stale/wrong context.
4. **Run the tests yourself.** Green is necessary, not sufficient.
5. **You own the merge.** Copilot code review is input, not authority.

## Disposition policy for incoming automated review comments

Give every comment one disposition — avoids both "resolve everything" (busywork)
and "ignore the bot" (incidents):

| Comment | Disposition |
|---|---|
| security / bug, confidence ≥ 0.6 | **fix** |
| style / nit, confidence < 0.8 | **wontfix** (decline explicitly) |
| flags a pattern your repo allows | **false-positive** → fix `copilot-instructions.md`, not the code |

Tune the reviewer mostly by tuning what you feed it: a good
`.github/copilot-instructions.md` removes whole categories of noise at the source.
