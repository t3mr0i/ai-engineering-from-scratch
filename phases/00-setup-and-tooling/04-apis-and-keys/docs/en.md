# APIs & Keys

> Make authentication, request shape, and response shape separately observable.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lessons 01–03
**Time:** ~30 minutes

## Learning Objectives

- Build and validate an Anthropic Messages-shaped request with `build_request`.
- Keep an API key in `ANTHROPIC_API_KEY` instead of source code or a tracked file.
- Inspect `Content-Type`, `x-api-key`, and `anthropic-version` without sending a request.
- Run the deterministic local response fixture and distinguish it from the opt-in raw-HTTP path.
- Use the API troubleshooting prompt to turn an authentication or rate-limit message into a reproducible next check.

## Why this lesson exists

An API call has a small, inspectable contract: endpoint, authentication headers, JSON request body, and JSON response. `first_api_call.py` builds that contract with Python's standard library. It uses the stable local model label `lesson-fixture` for the exercise; this is a fixture, not a provider model claim.

```mermaid
flowchart LR
    P[build_request] --> M{ANTHROPIC_LIVE=1 and key?}
    M -->|no| F[deterministic response fixture]
    M -->|yes| H[build_headers + urllib HTTP request]
    F --> O[content[] and usage]
    H --> O
```

The default Python command never opens a network connection. A live call is deliberately opt-in: both `ANTHROPIC_LIVE=1` and `ANTHROPIC_API_KEY` must be present. The TypeScript companion follows the same rule with `LIVE=1`; neither path requires a provider SDK.

## Build It

From the lesson directory, run the offline fixture:

```bash
env -u ANTHROPIC_API_KEY -u ANTHROPIC_LIVE python3 code/main.py
```

The output prints a request containing `model: "lesson-fixture"`, `max_tokens: 64`, and one user message, followed by `mode: MOCK (no network)` and fixed `usage` values. Exit status 0 means the local request/response contract ran; it does not mean a provider accepted a request.

`build_request` rejects an empty prompt, empty model, or non-positive token limit. `build_headers` refuses an empty key. `call_raw_http` is the only function that opens `https://api.anthropic.com/v1/messages`, and the main program reaches it only after the explicit live opt-in.

## Use It

The TypeScript companion also has a deterministic path. If `tsx` is already available, run it from an explicit temporary directory so a `.env` file is never created in the tracked lesson:

```bash
ts_file="$PWD/code/first_api_call.ts"
tmp_dir=$(mktemp -d)
printf '%s\n' 'ANTHROPIC_API_KEY=mock' > "$tmp_dir/.env"
(cd "$tmp_dir" && MOCK=1 npx --no-install tsx "$ts_file")
rm -rf "$tmp_dir"
```

It prints the same response shape without contacting a provider. `process.env` takes precedence over the temporary file. If you choose a live experiment, record the status and redacted body; never paste the key into a command, artifact, or commit.

## Ship It

[`outputs/prompt-api-troubleshooter.md`](../outputs/prompt-api-troubleshooter.md) is the reusable artifact. When adapting it, include the exact status/error text, whether the local fixture or raw-HTTP path was used, whether a key was present, and the next command that can confirm the diagnosis. Never paste the key itself.

## Exercises

1. Run the Python command and parse its JSON request. Identify the model label, token limit, role/content message, and fixed usage fields.
2. Call `build_request` with an empty prompt and with `max_tokens=0`. Record the `ValueError` messages and explain why validation belongs before network code.
3. Call `build_headers("demo-secret")` and inspect the three headers. Then verify that `build_headers("")` rejects the missing credential without exposing anything.
4. Use the temporary-directory TypeScript command above and compare `.env` precedence with an `ANTHROPIC_API_KEY` supplied in the process environment. Keep the file outside the repository and remove that exact temporary directory.

## Reference Solution

A correct local run shows `lesson-fixture`, `64`, one user message, `mode: MOCK`, and the fixed response/usage envelope with exit status 0. The request builder rejects malformed local inputs; the header builder requires a key but never prints it. A live acceptance record is separate and requires explicit opt-in, a real key, the documented headers/body, and captured provider status; the fixture alone proves only local plumbing.

Run the lesson tests from `code/`:

```bash
python3 -m unittest discover tests -v
```
