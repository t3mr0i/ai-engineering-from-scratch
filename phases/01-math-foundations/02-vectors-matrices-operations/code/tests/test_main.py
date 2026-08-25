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
sys.path.insert(0, str(CODE))
from matrices import Matrix, Vector, relu_matrix  # noqa: E402
ALLOWED = set(sys.stdlib_module_names) | {"numpy", "torch", "h5py", "zstandard", "safetensors"}

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

    def test_matrix_products_are_distinct(self) -> None:
        a = Matrix([[1, 2], [3, 4]])
        b = Matrix([[5, 6], [7, 8]])
        self.assertEqual((a.element_wise_multiply(b)).data, [[5, 12], [21, 32]])
        self.assertEqual((a @ b).data, [[19, 22], [43, 50]])

    def test_inverse_and_determinant_fixture(self) -> None:
        a = Matrix([[4, 7], [2, 6]])
        self.assertEqual(a.determinant(), 10)
        identity = a @ a.inverse_2x2()
        for i in range(2):
            for j in range(2):
                self.assertAlmostEqual(identity.data[i][j], 1.0 if i == j else 0.0)

    def test_row_and_column_broadcasting(self) -> None:
        output = Matrix([[1, 2, 3], [4, 5, 6]])
        self.assertEqual((output + Matrix([[10, 20, 30]])).data, [[11, 22, 33], [14, 25, 36]])
        self.assertEqual((output + Matrix([[10], [20]])).data, [[11, 12, 13], [24, 25, 26]])

    def test_relu_and_dense_shapes(self) -> None:
        values = relu_matrix(Matrix([[-1, 2], [3, -4]]))
        self.assertEqual(values.data, [[0, 2], [3, 0]])
        self.assertEqual((Matrix([[1, 2, 3], [0, 1, 0]]) @ Matrix([[1], [2], [3]])).shape, (2, 1))

    def test_invalid_shapes_raise_value_error(self) -> None:
        with self.assertRaises(ValueError):
            Matrix([[1, 2]]) @ Matrix([[1, 2]])
        with self.assertRaises(ValueError):
            Matrix([[1, 2]]) - Matrix([[1], [2]])
        with self.assertRaises(ValueError):
            Matrix([[1, 2]]).element_wise_multiply(Matrix([[1], [2]]))

if __name__ == "__main__":
    unittest.main()
