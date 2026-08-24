"""Regression tests for catalog discovery."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "build_catalog.py"
SPEC = importlib.util.spec_from_file_location("build_catalog", SCRIPT)
assert SPEC and SPEC.loader
build_catalog = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = build_catalog
SPEC.loader.exec_module(build_catalog)


class CatalogDiscoveryTests(unittest.TestCase):
    def test_accepts_three_digit_lesson_number(self) -> None:
        match = build_catalog.LESSON_DIR_RE.fullmatch("114-ai-champion")
        self.assertIsNotNone(match)
        assert match
        self.assertEqual(match.group(1), "114")

    def test_repository_catalog_includes_every_lesson_directory(self) -> None:
        phases = [build_catalog.build_phase_entry(path) for path in build_catalog.iter_phase_dirs()]
        catalog_count = build_catalog.compute_totals(phases)["lessons"]
        disk_count = sum(
            1
            for phase in build_catalog.PHASES_DIR.iterdir()
            if phase.is_dir() and build_catalog.PHASE_DIR_RE.fullmatch(phase.name)
            for lesson in phase.iterdir()
            if lesson.is_dir()
        )
        self.assertEqual(catalog_count, disk_count)


if __name__ == "__main__":
    unittest.main()
