# Behavioral tests for the offline data utility described in docs/en.md.
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
sys.path.insert(0, str(CODE))

from data_utils import (  # noqa: E402
    cache_summary,
    convert_format,
    fingerprint,
    load_and_inspect,
    load_from_csv,
    load_from_jsonl,
    make_splits,
    stream_dataset,
)


class DataUtilityTests(unittest.TestCase):
    def test_fixture_load_has_schema_and_rows(self) -> None:
        rows = load_and_inspect()
        self.assertEqual(len(rows), 12)
        self.assertEqual(set(rows[0]), {"id", "text", "label"})
        self.assertEqual(rows[0]["label"], 1)

    def test_stream_is_bounded_and_preserves_order(self) -> None:
        rows = stream_dataset(max_rows=3)
        self.assertEqual(len(rows), 3)
        self.assertEqual([row["id"] for row in rows], [0, 1, 2])

    def test_csv_and_jsonl_round_trip(self) -> None:
        rows = load_and_inspect()[:4]
        with tempfile.TemporaryDirectory() as directory:
            paths = convert_format(rows, directory, "sample")
            self.assertEqual(load_from_csv(paths["csv"]), rows)
            self.assertEqual(load_from_jsonl(paths["jsonl"]), rows)

    def test_splits_are_deterministic_disjoint_and_complete(self) -> None:
        rows = load_and_inspect()
        first = make_splits(rows, seed=42)
        second = make_splits(rows, seed=42)
        self.assertEqual(first, second)
        self.assertEqual({len(part) for part in first.values()}, {9, 1, 2})
        ids = [row["id"] for part in first.values() for row in part]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(set(ids), set(range(12)))

    def test_fingerprint_changes_when_a_sampled_row_changes(self) -> None:
        rows = load_and_inspect()
        original = fingerprint(rows, num_rows=4)
        rows[0]["text"] = "changed fixture row"
        changed = fingerprint(rows, num_rows=4)
        self.assertNotEqual(original, changed)

    def test_cache_summary_counts_exported_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            convert_format(load_and_inspect()[:2], directory, "cache")
            summary = cache_summary(directory)
            self.assertEqual(summary["files"], 2)
            self.assertGreater(summary["bytes"], 0)

    def test_invalid_inputs_are_rejected(self) -> None:
        rows = load_and_inspect()
        with self.assertRaises(ValueError):
            make_splits(rows, train_ratio=0.9, val_ratio=0.2)
        with self.assertRaises(ValueError):
            stream_dataset(max_rows=-1)

    def test_canonical_demo_is_offline_and_successful(self) -> None:
        result = subprocess.run(
            [sys.executable, MAIN.name],
            cwd=CODE,
            text=True,
            capture_output=True,
            check=False,
            timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("All offline data checks passed.", result.stdout)
        self.assertNotIn("Traceback", result.stderr)
        self.assertNotIn("huggingface", result.stdout.lower())


if __name__ == "__main__":
    unittest.main()
