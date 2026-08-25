# Lesson implementation for phases/00-setup-and-tooling/09-data-management/docs/en.md.
# Uses a checked-in JSONL fixture and Python's standard library for every operation.
# Builds CSV/JSONL exports, deterministic splits, fingerprints, and an output summary.
# No Hub, network, or optional package is required; stdlib-first is intentional.
# Run with: python3 main.py.

from __future__ import annotations

import csv
import hashlib
import json
import random
import tempfile
from collections.abc import Iterable, Mapping
from pathlib import Path


Row = dict[str, object]
DATA_PATH = Path(__file__).with_name("fixtures") / "mini_reviews.jsonl"
OUTPUT_DIR = Path(tempfile.gettempdir()) / "phase00-data-management"
REQUIRED_COLUMNS = ("id", "text", "label")


def _coerce_row(value: object, line_number: int) -> Row:
    if not isinstance(value, dict):
        raise ValueError(f"line {line_number}: expected a JSON object")
    missing = [column for column in REQUIRED_COLUMNS if column not in value]
    if missing:
        raise ValueError(f"line {line_number}: missing {', '.join(missing)}")
    try:
        row = {
            "id": int(value["id"]),
            "text": str(value["text"]),
            "label": int(value["label"]),
        }
    except (TypeError, ValueError) as error:
        raise ValueError(f"line {line_number}: id and label must be integers") from error
    if row["label"] not in (0, 1):
        raise ValueError(f"line {line_number}: label must be 0 or 1")
    return row


def _read_jsonl(path: str | Path) -> list[Row]:
    rows: list[Row] = []
    with Path(path).open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"line {line_number}: invalid JSON") from error
            rows.append(_coerce_row(value, line_number))
    if not rows:
        raise ValueError(f"dataset is empty: {path}")
    return rows


def load_and_inspect(dataset_path: str | Path = DATA_PATH, split: str = "all") -> list[Row]:
    rows = _read_jsonl(dataset_path)
    print(f"Dataset: {Path(dataset_path).name}")
    print(f"  Split: {split}")
    print(f"  Rows: {len(rows)}")
    print(f"  Columns: {list(REQUIRED_COLUMNS)}")
    print(f"  First row: {rows[0]}")
    return rows


def stream_dataset(dataset_path: str | Path = DATA_PATH, max_rows: int = 5) -> list[Row]:
    if max_rows <= 0:
        raise ValueError("max_rows must be positive")
    rows: list[Row] = []
    with Path(dataset_path).open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            rows.append(_coerce_row(json.loads(line), line_number))
            if len(rows) == max_rows:
                break
    print(f"Streamed {len(rows)} rows from {Path(dataset_path).name}")
    return rows


def convert_format(rows: Iterable[Mapping[str, object]], output_dir: str | Path, name: str) -> dict[str, Path]:
    records = [dict(row) for row in rows]
    if not records:
        raise ValueError("cannot export an empty dataset")
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    csv_path = output_path / f"{name}.csv"
    jsonl_path = output_path / f"{name}.jsonl"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(REQUIRED_COLUMNS))
        writer.writeheader()
        writer.writerows(records)
    with jsonl_path.open("w", encoding="utf-8") as handle:
        for row in records:
            handle.write(json.dumps(row, sort_keys=True) + "\n")
    print(f"Wrote {len(records)} rows:")
    print(f"  CSV:   {csv_path} ({csv_path.stat().st_size} bytes)")
    print(f"  JSONL: {jsonl_path} ({jsonl_path.stat().st_size} bytes)")
    return {"csv": csv_path, "jsonl": jsonl_path}


def load_from_csv(path: str | Path) -> list[Row]:
    with Path(path).open(encoding="utf-8", newline="") as handle:
        rows = [_coerce_row(row, index) for index, row in enumerate(csv.DictReader(handle), start=2)]
    if not rows:
        raise ValueError(f"dataset is empty: {path}")
    return rows


def load_from_jsonl(path: str | Path) -> list[Row]:
    return _read_jsonl(path)


def make_splits(
    rows: Iterable[Mapping[str, object]],
    train_ratio: float = 0.75,
    val_ratio: float = 0.125,
    seed: int = 42,
) -> dict[str, list[Row]]:
    records = [dict(row) for row in rows]
    if len(records) < 3 or train_ratio <= 0 or val_ratio <= 0 or train_ratio + val_ratio >= 1:
        raise ValueError("ratios must be positive, leave a test split, and fit at least three rows")
    indices = list(range(len(records)))
    random.Random(seed).shuffle(indices)
    train_count = int(len(records) * train_ratio)
    val_count = int(len(records) * val_ratio)
    test_count = len(records) - train_count - val_count
    if min(train_count, val_count, test_count) == 0:
        raise ValueError("ratios must produce three non-empty splits")
    splits = {
        "train": [records[index] for index in indices[:train_count]],
        "val": [records[index] for index in indices[train_count : train_count + val_count]],
        "test": [records[index] for index in indices[train_count + val_count :]],
    }
    print(f"Splits (seed={seed}): train={len(splits['train'])}, val={len(splits['val'])}, test={len(splits['test'])}")
    return splits


def fingerprint(rows: Iterable[Mapping[str, object]], num_rows: int = 100) -> str:
    if num_rows < 0:
        raise ValueError("num_rows must not be negative")
    sample = [dict(row) for row in rows][:num_rows]
    content = json.dumps(sample, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    digest = hashlib.sha256(content).hexdigest()[:16]
    print(f"Dataset fingerprint (first {len(sample)} rows): {digest}")
    return digest


def cache_summary(output_dir: str | Path = OUTPUT_DIR) -> dict[str, int | str]:
    path = Path(output_dir)
    files = [entry for entry in path.iterdir() if entry.is_file()] if path.exists() else []
    summary = {"path": str(path), "files": len(files), "bytes": sum(entry.stat().st_size for entry in files)}
    print(f"Output summary: {summary['files']} files, {summary['bytes']} bytes in {summary['path']}")
    return summary


def main() -> int:
    print("=" * 60)
    print("Data Management Utility (stdlib fixture)")
    print("=" * 60)
    rows = load_and_inspect()
    preview = stream_dataset(max_rows=3)
    print(f"  Preview IDs: {[row['id'] for row in preview]}")
    paths = convert_format(rows, OUTPUT_DIR, "mini_reviews_sample")
    reloaded = load_from_jsonl(paths["jsonl"])
    print(f"Reloaded JSONL rows: {len(reloaded)}")
    make_splits(reloaded, seed=42)
    fingerprint(reloaded, num_rows=12)
    cache_summary(OUTPUT_DIR)
    print("All offline data checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
