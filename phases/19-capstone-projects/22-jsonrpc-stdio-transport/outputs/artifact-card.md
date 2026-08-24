# JSON-RPC 2.0 Over Newline-Delimited Stdio — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to speak JSON-RPC 2.0 framed as newline-delimited JSON over stdin and stdout.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Map the five standard error codes (-32700, -32600, -32601, -32602, -32603) and surface them with the right semantics.
- **Evidence to retain:** the input, output, and invariant needed to distinguish requests, responses, notifications, and batches without inventing new envelope keys.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can handle one parse error per line without poisoning the rest of the stream.
- Run the lesson tests after adapting the implementation to a new project.

