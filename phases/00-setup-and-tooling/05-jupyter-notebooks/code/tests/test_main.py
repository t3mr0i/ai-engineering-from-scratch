"""Tests for the notebook execution model demo."""

from __future__ import annotations

import unittest

from main import NotebookKernel


class NotebookKernelTests(unittest.TestCase):
    def test_cells_share_state(self) -> None:
        kernel = NotebookKernel()
        kernel.execute("answer = 6 * 7")
        result = kernel.execute("answer")
        self.assertEqual(result.display, "42")

    def test_last_expression_is_displayed(self) -> None:
        result = NotebookKernel().execute("values = [1, 2, 3]\nsum(values)")
        self.assertEqual(result.display, "6")

    def test_printed_output_is_captured(self) -> None:
        result = NotebookKernel().execute('print("hello notebook")')
        self.assertEqual(result.stdout, "hello notebook\n")

    def test_restart_clears_hidden_state(self) -> None:
        kernel = NotebookKernel()
        kernel.execute("hidden = 99")
        kernel.restart()
        result = kernel.execute("hidden")
        self.assertEqual(result.error_type, "NameError")

    def test_run_all_uses_document_order(self) -> None:
        results = NotebookKernel().run_all(["x = 3", "x *= 4", "x"])
        self.assertEqual(results[-1].display, "12")

    def test_a_failed_cell_returns_a_structured_error(self) -> None:
        result = NotebookKernel().execute("1 / 0")
        self.assertEqual(result.error_type, "ZeroDivisionError")
        self.assertIn("division by zero", result.error_message)


if __name__ == "__main__":
    unittest.main()
