#!/usr/bin/env python3
"""Inject the LHG colour overrides into a built JupyterLite output tree.

`jupyter lite build` regenerates every HTML entry and theme package, so the
override stylesheet can't be a tracked source file inside the app — it has to
be re-applied after each build. This script:

  1. copies ide/jupyterlite/lhg-theme.css into <output>/lhg-theme.css
  2. injects <link rel="stylesheet" href="<rel>/lhg-theme.css"> into every
     */index.html that hosts a kernel (notebooks/, lab/, tree/, repl/, …),
     just before </head>, with the correct relative path per file. Placing it
     last in <head> means it wins the cascade over the theme package's own
     stylesheet at equal CSS specificity.

Idempotent: a marker comment guards against double-injection, so re-running on
an already-patched tree is a no-op.

Usage:
  python3 inject-lhg-theme.py <output-dir>
  # e.g. python3 ide/jupyterlite/inject-lhg-theme.py /tmp/jlite-build/_output
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

MARKER = "lhg-theme.css"  # presence of this in <head> means already injected
SRC = Path(__file__).resolve().parent / "lhg-theme.css"


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: inject-lhg-theme.py <output-dir>", file=sys.stderr)
        return 2
    out = Path(sys.argv[1]).resolve()
    if not out.is_dir():
        print(f"output dir not found: {out}", file=sys.stderr)
        return 2
    if not SRC.exists():
        print(f"theme source not found: {SRC}", file=sys.stderr)
        return 2

    shutil.copy2(SRC, out / "lhg-theme.css")

    patched = 0
    for html in out.rglob("index.html"):
        text = html.read_text(encoding="utf-8")
        if "</head>" not in text or MARKER in text:
            continue
        rel = os.path.relpath(out / "lhg-theme.css", html.parent)
        rel = rel.replace(os.sep, "/")
        tag = f'<link rel="stylesheet" href="{rel}">\n</head>'
        html.write_text(text.replace("</head>", tag, 1), encoding="utf-8")
        patched += 1

    print(f"lhg-theme: copied + injected into {patched} index.html files under {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
