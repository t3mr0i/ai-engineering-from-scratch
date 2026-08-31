# Contract and executable-behavior tests for this lesson demo.
from __future__ import annotations

import ast
import functools
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
ALLOWED = set(sys.stdlib_module_names) | {"numpy", "torch", "h5py", "zstandard", "safetensors"}

SPEC = importlib.util.spec_from_file_location("copilot_daily_workflow", MAIN)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("could not load lesson module")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)

def source_trees() -> list[ast.AST]:
    return [ast.parse(path.read_text(encoding="utf-8")) for path in CODE.glob("*.py")]

def external_roots() -> set[str]:
    roots: set[str] = set()
    for tree in source_trees():
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                roots.add(node.module.split(".")[0])
    return {name for name in roots if not (CODE / f"{name}.py").exists() and not (CODE / name).is_dir()}

@functools.lru_cache(maxsize=1)
def run_demo() -> subprocess.CompletedProcess[str]:
    missing = sorted(name for name in external_roots() if name in ALLOWED and importlib.util.find_spec(name) is None)
    banned = sorted(external_roots() - ALLOWED)
    if missing or banned:
        raise unittest.SkipTest(f"demo dependencies unavailable or disallowed: {missing + banned}")
    env = os.environ.copy()
    for key in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "HF_TOKEN", "HUGGINGFACE_TOKEN"):
        env.pop(key, None)
    return subprocess.run(
        [sys.executable, MAIN.name], cwd=CODE, text=True, capture_output=True,
        timeout=45, env=env, check=False,
    )

class LessonDemoTests(unittest.TestCase):
    def test_source_compiles(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_demo_has_explicit_entrypoint(self) -> None:
        source = MAIN.read_text(encoding="utf-8")
        self.assertTrue("__main__" in source or "runpy.run_path" in source)

    def test_demo_exits_successfully(self) -> None:
        self.assertEqual(run_demo().returncode, 0, run_demo().stderr)

    def test_demo_emits_bounded_output(self) -> None:
        result = run_demo()
        self.assertTrue((result.stdout + result.stderr).strip())
        self.assertLess(len(result.stdout) + len(result.stderr), 1_000_000)

    def test_demo_has_no_traceback(self) -> None:
        self.assertNotIn("Traceback (most recent call last)", run_demo().stderr)

    def test_task_router_covers_each_copilot_rung(self) -> None:
        fixtures = {
            "add a null check": MODULE.Rung.COMPLETION,
            "explain why this returns None": MODULE.Rung.CHAT,
            "rename this and update both call sites": MODULE.Rung.EDITS,
            "migrate this module and run the tests": MODULE.Rung.AGENT,
            "assign the issue and open a PR": MODULE.Rung.CODING_AGENT,
        }
        for task, expected in fixtures.items():
            with self.subTest(task=task):
                self.assertEqual(MODULE.route_task(task)[0], expected)

    def test_green_tests_do_not_override_hard_review_blocks(self) -> None:
        weakened = MODULE.Diff(2, True, True, False, False)
        secret = MODULE.Diff(1, False, False, True, False)
        self.assertEqual(MODULE.acceptance(weakened, True)[0], MODULE.Decision.BLOCK)
        self.assertEqual(MODULE.acceptance(secret, True)[0], MODULE.Decision.BLOCK)

    def test_project_brief_routes_multi_file_test_work_to_agent_mode(self) -> None:
        brief = MODULE.build_copilot_brief(MODULE.example_project_task())
        self.assertEqual(brief.rung, MODULE.Rung.AGENT)
        self.assertIn("src/booking_sync.py", brief.prompt)
        self.assertIn("tests/test_booking_sync.py", brief.prompt)

    def test_project_brief_makes_scope_and_evidence_explicit(self) -> None:
        brief = MODULE.build_copilot_brief(MODULE.example_project_task())
        for heading in (
            "GOAL:",
            "ALLOWED FILES:",
            "FORBIDDEN CHANGES:",
            "ACCEPTANCE CHECKS:",
            "OUTPUT CONTRACT:",
        ):
            self.assertIn(heading, brief.prompt)
        self.assertGreaterEqual(len(brief.review_gate), 4)

    def test_project_brief_rejects_repository_escape_paths(self) -> None:
        task = MODULE.ProjectTask(
            title="Unsafe path",
            goal="Change a file",
            allowed_files=("../secrets.txt",),
            acceptance_checks=("Run tests",),
        )
        with self.assertRaisesRegex(ValueError, "relative in-repository path"):
            MODULE.build_copilot_brief(task)

    def test_project_brief_requires_observable_acceptance_checks(self) -> None:
        task = MODULE.ProjectTask(
            title="No evidence",
            goal="Change a file",
            allowed_files=("src/service.py",),
            acceptance_checks=(),
        )
        with self.assertRaisesRegex(ValueError, "observable evidence"):
            MODULE.build_copilot_brief(task)

    def test_restricted_project_material_must_be_sanitized(self) -> None:
        task = MODULE.ProjectTask(
            title="Restricted ticket",
            goal="Change a file",
            allowed_files=("src/service.py",),
            acceptance_checks=("Run tests",),
            data_classification="restricted",
        )
        with self.assertRaisesRegex(ValueError, "must be sanitized"):
            MODULE.build_copilot_brief(task)

if __name__ == "__main__":
    unittest.main()
