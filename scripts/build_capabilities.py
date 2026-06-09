#!/usr/bin/env python3
"""Extract the LHIND AI-Literacy capability framework from trainings.xlsx into
site/capabilities.js.

Source of truth: trainings.xlsx, sheet "Capability".
Output: site/capabilities.js — script-tag globals CAPABILITIES, ROLES, CAP_PATHS,
matching the existing data.js convention (plain `const` globals, no module system).

The LinkedIn Learning links in the sheet are intentionally NOT emitted: paths are
built from the in-curriculum lessons (data.js PHASES). The capability->phase mapping
lives in CAP_PATH_MAP below and is curated by content intent, not auto-guessed.
"""
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "trainings.xlsx"
OUT = ROOT / "site" / "capabilities.js"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Role columns in the Capability sheet (target level per capability per role).
ROLE_COLS = {
    10: "Business & Strategy Consulting",
    11: "Products & Value Streams",
    12: "Technology Consulting",
    13: "Application Management",
    14: "Project Management & Agility",
    15: "Corporate Functions",
    16: "Leadership",
}

LEVEL_ORDER = {"Basic": 1, "Advanced": 2, "Expert": 3}


def norm_level(raw):
    """Normalise a target-level cell to Basic/Advanced/Expert or None (n.a.)."""
    if not raw:
        return None
    head = raw.strip().splitlines()[0].strip().rstrip(":").strip()
    if head in LEVEL_ORDER:
        return head
    if head.lower().startswith("n"):  # "n. a."
        return None
    return None


# Capability ID -> ordered list of existing phase ids (data.js) that teach it.
# Curated from each capability's description + "What/Why" intent. Capabilities with
# no genuine in-curriculum backing map to [] and are surfaced honestly as such.
CAP_PATH_MAP = {
    1: [13, 11, 7],          # Digital & AI Terminology, Concepts, Tool overviews
    2: [11, 10],             # Data Literacy (data pipelines, embeddings, evals)
    3: [],                   # Personal AI Productivity — no engineering lessons
    4: [18, 15],             # Corporate Ethics & Compliance
    5: [11, 7, 17, 13],      # AI Systems and Architecture
    6: [14, 13, 15],         # Agentic Software Development
    7: [11, 19],             # AI-Driven Testing & QA (eval/testing lessons)
    8: [14, 19],             # AI-Supported Code Modernization (code agents)
    9: [13, 11],             # AI-Assisted Documentation (tool/structured output)
    10: [17],                # Sustainable Software & Green Coding (FinOps/efficiency)
    11: [11],                # AI-Augmented Requirement Engineering (prompting/structured)
    12: [11],                # AI-Enhanced User Research (embeddings/RAG synthesis)
    13: [17, 19],            # AI & Automation Use Case Spotting
    14: [17],                # AI Cost & Value Economics (FinOps, caching, routing)
    15: [11],                # Consultative Prompting (prompt engineering lessons)
    16: [13, 11, 16],        # AI Ecosystem Knowledge (frameworks, protocols, models)
    17: [],                  # Managing AI Transformations — no engineering lessons
    18: [],                  # AI Workforce Strategy — no engineering lessons
    19: [],                  # Decision Making with AI — no engineering lessons
}


def col_idx(ref):
    m = re.match(r"([A-Z]+)(\d+)", ref)
    col = 0
    for c in m.group(1):
        col = col * 26 + (ord(c) - 64)
    return col - 1, int(m.group(2))


def read_sheet(z, ss, path):
    rows = {}
    for row in ET.fromstring(z.read("xl/" + path)).iter(f"{NS}row"):
        for c in row.findall(f"{NS}c"):
            v = c.find(f"{NS}v")
            isn = c.find(f"{NS}is")
            if v is not None:
                val = ss[int(v.text)] if c.get("t") == "s" else v.text
            elif isn is not None:
                val = "".join(x.text or "" for x in isn.iter(f"{NS}t"))
            else:
                val = None
            ci, ri = col_idx(c.get("r"))
            rows.setdefault(ri, {})[ci] = val
    return rows


def main():
    z = zipfile.ZipFile(XLSX)
    ss = []
    for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(f"{NS}si"):
        ss.append("".join(t.text or "" for t in si.iter(f"{NS}t")))

    cap = read_sheet(z, ss, "worksheets/sheet3.xml")

    capabilities = []
    # role -> { capId: target level }
    role_targets = {r: {} for r in ROLE_COLS.values()}

    for ri in sorted(cap):
        if ri < 2 or ri > 20:
            continue
        r = cap[ri]
        cid = r.get(1)
        if cid is None:
            continue
        cid = int(cid)
        capabilities.append(
            {
                "id": cid,
                "cluster": (r.get(2) or "").strip(),
                "title": (r.get(3) or "").strip(),
                "description": (r.get(5) or "").strip(),
                "levels": {
                    "Basic": (r.get(6) or "").strip(),
                    "Advanced": (r.get(7) or "").strip(),
                    "Expert": (r.get(8) or "").strip(),
                },
                "phases": CAP_PATH_MAP.get(cid, []),
            }
        )
        for col, role in ROLE_COLS.items():
            lvl = norm_level(r.get(col))
            if lvl:
                role_targets[role][cid] = lvl

    roles = [{"name": name, "targets": role_targets[name]} for name in ROLE_COLS.values()]

    header = (
        "// Auto-generated by scripts/build_capabilities.py — do not edit manually.\n"
        "// Source: trainings.xlsx (sheet 'Capability'). Script-tag globals, no modules.\n\n"
    )
    body = (
        "const CAPABILITIES = " + json.dumps(capabilities, ensure_ascii=False, indent=2) + ";\n\n"
        "const ROLES = " + json.dumps(roles, ensure_ascii=False, indent=2) + ";\n\n"
        "const LEVEL_ORDER = " + json.dumps(LEVEL_ORDER) + ";\n"
    )
    OUT.write_text(header + body, encoding="utf-8")
    print(f"Wrote {OUT}  ({len(capabilities)} capabilities, {len(roles)} roles)")
    mapped = sum(1 for c in capabilities if c["phases"])
    print(f"  {mapped} capabilities mapped to lessons, {len(capabilities) - mapped} with no in-curriculum match")


if __name__ == "__main__":
    main()
