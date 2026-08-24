from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "verify_capstone.py"
SPEC = importlib.util.spec_from_file_location("verify_capstone", SCRIPT)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = module
SPEC.loader.exec_module(module)


class CapstoneVerifierTests(unittest.TestCase):
    def spec(self) -> dict:
        return {
            "id": "test-v1",
            "required_files": ["README.md", "report.md", "results.json"],
            "required_attestations": ["no_secrets"],
            "minimum_metrics": {"task_success_rate": 0.7},
            "maximum_metrics": {"safety_violation_rate": 0.0},
            "tracks": [{"id": "all", "weeks": 1, "lessons": list(range(20, 88))}],
        }

    def valid_submission(self, root: Path) -> None:
        artifacts = []
        for name in ("README.md", "report.md", "results.json"):
            path = root / name
            path.write_text(f"evidence for {name}\n", encoding="utf-8")
            artifacts.append({"path": name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
        manifest = {
            "challenge": "test-v1",
            "track": "all",
            "candidate": "learner",
            "commit": "0123456",
            "artifacts": artifacts,
            "tests": [{"command": "python3 -m unittest", "exit_code": 0}],
            "metrics": {"task_success_rate": 0.8, "safety_violation_rate": 0.0},
            "attestations": {"no_secrets": True},
        }
        (root / "submission.json").write_text(json.dumps(manifest), encoding="utf-8")

    def test_valid_submission_is_verified(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.valid_submission(root)
            issues, receipt = module.validate_submission(root, self.spec())
            self.assertEqual(issues, [])
            self.assertEqual(receipt["status"], "verified")

    def test_path_traversal_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.valid_submission(root)
            data = json.loads((root / "submission.json").read_text())
            data["artifacts"][0]["path"] = "../README.md"
            (root / "submission.json").write_text(json.dumps(data))
            issues, _ = module.validate_submission(root, self.spec())
            self.assertTrue(any("unsafe artifact path" in issue for issue in issues))

    def test_hash_mismatch_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.valid_submission(root)
            (root / "README.md").write_text("changed\n")
            issues, _ = module.validate_submission(root, self.spec())
            self.assertTrue(any("sha256 mismatch" in issue for issue in issues))

    def test_failed_recorded_test_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.valid_submission(root)
            data = json.loads((root / "submission.json").read_text())
            data["tests"][0]["exit_code"] = 1
            (root / "submission.json").write_text(json.dumps(data))
            issues, _ = module.validate_submission(root, self.spec())
            self.assertTrue(any("exit_code 0" in issue for issue in issues))

    def test_metric_below_threshold_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.valid_submission(root)
            data = json.loads((root / "submission.json").read_text())
            data["metrics"]["task_success_rate"] = 0.4
            (root / "submission.json").write_text(json.dumps(data))
            issues, _ = module.validate_submission(root, self.spec())
            self.assertTrue(any("task_success_rate" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
