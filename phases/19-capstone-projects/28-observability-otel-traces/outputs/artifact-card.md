# Observability with OTel GenAI Spans and Prometheus Metrics — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to build a span data class shaped to the OpenTelemetry GenAI semantic conventions.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement a JSONL exporter that writes one self-contained span per line.
- **Evidence to retain:** the input, output, and invariant needed to build counters and histograms with labels and Prometheus text-format exposition.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can wrap any callable in a span context manager that records duration, status, and exceptions.
- Run the lesson tests after adapting the implementation to a new project.

