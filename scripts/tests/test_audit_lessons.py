"""Regression tests for the curriculum lesson auditor."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "audit_lessons.py"
SPEC = importlib.util.spec_from_file_location("audit_lessons", SCRIPT)
assert SPEC and SPEC.loader
audit_lessons = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = audit_lessons
SPEC.loader.exec_module(audit_lessons)


class LessonDirectoryPatternTests(unittest.TestCase):
    def test_accepts_two_digit_lesson_number(self) -> None:
        self.assertIsNotNone(audit_lessons.LESSON_DIR_RE.fullmatch("09-tokenization"))

    def test_accepts_three_digit_lesson_number(self) -> None:
        self.assertIsNotNone(audit_lessons.LESSON_DIR_RE.fullmatch("114-ai-champion"))

    def test_rejects_unpadded_lesson_number(self) -> None:
        self.assertIsNone(audit_lessons.LESSON_DIR_RE.fullmatch("9-tokenization"))


class MarkdownMaskingTests(unittest.TestCase):
    def test_masks_inline_code_that_resembles_a_link(self) -> None:
        text = 'Read `tool_call["arguments"]` before [the guide](../guide.md).'
        masked = audit_lessons.mask_markdown_code(text)
        self.assertNotIn('tool_call["arguments"]', masked)
        self.assertIn("[the guide](../guide.md)", masked)

    def test_masks_fenced_code_but_keeps_prose_links(self) -> None:
        text = """```python
rename_args({})
```

[Reference](reference.md)
"""
        masked = audit_lessons.mask_markdown_code(text)
        self.assertNotIn("rename_args", masked)
        self.assertIn("[Reference](reference.md)", masked)


if __name__ == "__main__":
    unittest.main()
