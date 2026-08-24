# Lesson demo for docs/en.md in 00-setup-and-tooling/05-jupyter-notebooks.
# Models the shared state, rich display, restart, and run-all behavior of a notebook.
# Uses Python's ast and exec primitives so the execution model is visible from scratch.
# No external notebook server or package is required.
# Run with: python3 main.py

from __future__ import annotations

import ast
import contextlib
import io
from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True)
class CellResult:
    """Observable output from one notebook cell."""

    stdout: str = ""
    display: str | None = None
    error_type: str | None = None
    error_message: str = ""


class NotebookKernel:
    """A tiny stateful Python kernel suitable for illustrating notebook semantics."""

    def __init__(self) -> None:
        self.restart()

    def restart(self) -> None:
        """Discard all user variables, just like restarting a notebook kernel."""

        self.namespace: dict[str, Any] = {"__name__": "__notebook__"}

    def execute(self, source: str) -> CellResult:
        """Execute a cell and capture printed output, its last value, or its error."""

        output = io.StringIO()
        try:
            module = ast.parse(source, mode="exec")
            last_expression = module.body[-1] if module.body else None
            statements = module.body[:-1] if isinstance(last_expression, ast.Expr) else module.body

            with contextlib.redirect_stdout(output):
                if statements:
                    exec(compile(ast.Module(statements, type_ignores=[]), "<cell>", "exec"), self.namespace)
                value = None
                if isinstance(last_expression, ast.Expr):
                    expression = ast.Expression(last_expression.value)
                    value = eval(compile(expression, "<cell>", "eval"), self.namespace)

            return CellResult(stdout=output.getvalue(), display=None if value is None else repr(value))
        except Exception as error:  # A notebook reports cell errors without killing its kernel.
            return CellResult(
                stdout=output.getvalue(),
                error_type=type(error).__name__,
                error_message=str(error),
            )

    def run_all(self, cells: Iterable[str]) -> list[CellResult]:
        """Restart, then execute every cell once in document order."""

        self.restart()
        return [self.execute(cell) for cell in cells]


def demo() -> None:
    kernel = NotebookKernel()
    cells = [
        "samples = [2, 4, 8]",
        'print(f"samples: {samples}")',
        "sum(samples) / len(samples)",
    ]
    results = kernel.run_all(cells)
    for number, result in enumerate(results, start=1):
        visible = result.stdout.rstrip() or result.display or "(no visible output)"
        print(f"Cell {number}: {visible}")
    kernel.restart()
    print("Restarting the kernel clears samples:", kernel.execute("samples").error_type)


if __name__ == "__main__":
    demo()
