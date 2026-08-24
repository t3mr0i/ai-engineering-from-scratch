# AI Engineering Verified Capstone

Choose one Phase 19 track and turn its small lesson components into one assessed system. Verification is evidence-based: the repository checks artifact hashes, required reports, recorded test success, common metric thresholds, and explicit safety/reproducibility attestations. It never executes a command supplied by an untrusted submission.

## Deliverables

Create `challenges/submissions/<candidate>-<track>/` with:

- `README.md`: setup, supported environment, canonical command, and expected output.
- `report.md`: architecture, decisions, failure analysis, limitations, and rollback plan.
- `results.json`: fixture-level evaluation evidence from a clean clone.
- `submission.json`: track, commit, metrics, test evidence, attestations, and SHA-256 hashes for every delivered artifact.

Start from [`submission.example.json`](submission.example.json). Every path must be relative, remain inside the submission directory, and match its declared SHA-256 digest.

## Common acceptance bar

All tracks report the same four normalized measures so leaderboard rows remain comparable:

| Measure | Gate |
|---|---:|
| `task_success_rate` | at least 0.70 |
| `reproducibility_rate` | exactly 1.00 |
| `documentation_score` | at least 0.80 |
| `safety_violation_rate` | exactly 0.00 |

Track-specific metrics belong in `results.json` and the report. For example, the RAG track should include retrieval and faithfulness evidence; the safety track should include attack-category recall and over-refusal; the training tracks should include loss, resume parity, and resource measurements.

## Verify locally

```bash
python3 scripts/verify_capstone.py challenges/submissions/<candidate>-<track>
```

Add `--write-receipt` to create `verification-receipt.json`. A receipt proves that the submitted evidence satisfies the machine-checkable contract at a specific content hash. It is not an identity credential and does not replace maintainer review.

## Public leaderboard flow

1. Open a pull request containing only one submission directory and one proposed row in `leaderboard.json`.
2. CI validates the challenge definition and the submission without executing submission-provided shell text.
3. A maintainer reproduces the canonical command in an isolated environment, checks the fixture evidence, and confirms the row.
4. After merge, the repository commit and receipt hash make the leaderboard entry auditable.

Never include model weights, private datasets, credentials, personal data, or copied benchmark answers. Link large public artifacts by immutable digest and document how a reviewer can obtain them.

See [Phase 19 assessed tracks](../../phases/19-capstone-projects/TRACKS.md) for week-by-week milestones.
