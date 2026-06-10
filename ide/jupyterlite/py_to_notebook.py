"""Convert a lesson main.py into a learner-friendly notebook.

jupytext splits every statement into its own cell, so learners must run all 13
fragments in order or hit NameErrors, and output only appears at the very end.
Instead we produce a small, top-down-runnable notebook:

  1. (optional) markdown cell from the module docstring — what the lesson shows
  2. one "setup" code cell: imports + all function/class definitions
  3. one "run" code cell: the body of main() inlined (no def main / no
     if __name__ wrapper), so pressing Run shows real output immediately

Usage: py_to_notebook.py <main.py> <out.ipynb>
"""

import ast
import json
import sys


def split_source(src: str):
    """Return (docstring, setup_src, run_src) from a lesson main.py."""
    tree = ast.parse(src)
    lines = src.splitlines()

    docstring = ast.get_docstring(tree)

    setup_parts = []
    main_body_src = None       # body of def main()
    guard_body_src = None      # body of `if __name__ == "__main__":`

    for node in tree.body:
        # the module docstring expression — skip (handled separately)
        if (
            isinstance(node, ast.Expr)
            and isinstance(getattr(node, "value", None), ast.Constant)
            and isinstance(node.value.value, str)
            and node.lineno == 1
        ):
            continue

        seg = ast.get_source_segment(src, node)
        if seg is None:
            continue

        # `if __name__ == "__main__":` — unroll its body as the run cell
        # (but if it just calls main(), we use def main()'s body instead).
        if isinstance(node, ast.If) and _is_main_guard(node):
            guard_body_src = _join_body(src, node.body)
            continue

        # def main(): ...  -> capture its body for the run cell, drop the def
        if isinstance(node, ast.FunctionDef) and node.name == "main":
            main_body_src = _join_body(src, node.body)
            continue

        # everything else (imports, helper defs, classes, constants) -> setup
        setup_parts.append(seg)

    setup_src = "\n\n".join(setup_parts).strip()

    # Prefer main()'s body. If there's no main() but the __main__ guard holds the
    # real demo code, unroll that. (The guard often just says `main()` — in that
    # case main_body_src is what we want and guard_body is redundant.)
    run_src = (main_body_src or guard_body_src or "").strip()

    # No main() and no guard with code → the module ran top-level; nothing to
    # split out, so put everything in one runnable cell.
    if not run_src:
        run_src = setup_src
        setup_src = ""

    return docstring, setup_src, run_src


def _join_body(src: str, body) -> str:
    """Source of a block's body statements, dedented to column 0."""
    segs = [ast.get_source_segment(src, b) for b in body]
    segs = [s for s in segs if s]
    if not segs:
        return ""
    import textwrap
    # Join first (preserving relative indentation), then dedent the whole block.
    return textwrap.dedent("\n".join(segs))


def _is_main_guard(node: ast.If) -> bool:
    t = node.test
    return (
        isinstance(t, ast.Compare)
        and isinstance(t.left, ast.Name)
        and t.left.id == "__name__"
    )


def _dedent(s: str) -> str:
    """Remove the common leading indentation of a function-body segment."""
    lines = s.splitlines()
    if not lines:
        return s
    # source_segment of a body statement keeps its original indentation;
    # strip the indentation of the first line from all lines.
    import textwrap
    return textwrap.dedent(s)


def code_cell(source: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source.splitlines(keepends=True),
    }


def md_cell(text: str) -> dict:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": text.splitlines(keepends=True),
    }


def build_notebook(src: str) -> dict:
    docstring, setup_src, run_src = split_source(src)
    cells = []
    if docstring:
        cells.append(md_cell(docstring.strip()))
    if setup_src:
        cells.append(code_cell(setup_src))
    if run_src:
        cells.append(code_cell(run_src))
    return {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python (Pyodide)",
                "language": "python",
                "name": "python",
            },
            "language_info": {"name": "python"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def main():
    src_path, out_path = sys.argv[1], sys.argv[2]
    with open(src_path, encoding="utf-8") as f:
        src = f.read()
    try:
        nb = build_notebook(src)
    except SyntaxError:
        # If we can't parse it, fall back to a single raw code cell.
        nb = {
            "cells": [code_cell(src)],
            "metadata": {"kernelspec": {"display_name": "Python (Pyodide)",
                                        "language": "python", "name": "python"},
                         "language_info": {"name": "python"}},
            "nbformat": 4, "nbformat_minor": 5,
        }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=1)


if __name__ == "__main__":
    main()
