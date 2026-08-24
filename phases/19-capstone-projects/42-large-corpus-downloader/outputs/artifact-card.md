# Large Corpus Downloader — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to stream remote shards with `urllib` and decompress with `zstandard` without buffering the whole file in memory.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Resume partial downloads by issuing HTTP `Range` requests against a verified byte offset.
- **Evidence to retain:** the input, output, and invariant needed to build a MinHash signature per document and bucket it with LSH so near-duplicates collide.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can emit a shard manifest with content hash, byte size, document count, and dedup verdict.
- Run the lesson tests after adapting the implementation to a new project.

