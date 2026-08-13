import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from main import SessionState, build_handoff, load_state, record_step, save_state


class SessionContinuityTests(unittest.TestCase):
    def test_valid_state_round_trips(self):
        state = SessionState("s1", "T-1")
        with TemporaryDirectory() as directory:
            path = Path(directory) / "state.json"
            save_state(state, path)
            loaded = load_state(path)
        self.assertEqual(loaded, state)

    def test_record_step_is_idempotent_and_tracks_files(self):
        state = SessionState("s1", "T-1")
        updated = record_step(state, "read source", touched=("src/app.py", "src/app.py"))
        updated = record_step(updated, "read source", touched=("src/app.py",))
        self.assertEqual(updated.completed_steps, ["read source"])
        self.assertEqual(updated.touched_files, ["src/app.py"])
        self.assertEqual(updated.next_action, "run acceptance checks")

    def test_empty_step_and_path_are_rejected(self):
        state = SessionState("s1", "T-1")
        with self.assertRaises(ValueError):
            record_step(state, " ")
        with self.assertRaises(ValueError):
            record_step(state, "step", touched=("",))

    def test_loader_rejects_unknown_or_missing_fields(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"
            path.write_text(json.dumps({"schema_version": 1}), encoding="utf-8")
            with self.assertRaises(ValueError):
                load_state(path)

    def test_loader_rejects_unsupported_schema(self):
        state = SessionState("s1", "T-1")
        state.schema_version = 2
        with TemporaryDirectory() as directory:
            path = Path(directory) / "state.json"
            with self.assertRaises(ValueError):
                save_state(state, path)

    def test_invalid_status_and_empty_next_action_fail_validation(self):
        state = SessionState("s1", "T-1", status="unknown")
        with self.assertRaises(ValueError):
            state.validate()
        state.status = "in_progress"
        state.next_action = ""
        with self.assertRaises(ValueError):
            state.validate()

    def test_handoff_contains_machine_and_human_fields(self):
        state = record_step(SessionState("s1", "T-1"), "read source", touched=("README.md",))
        handoff = build_handoff(state, ["python3 -m unittest"], ["none"])
        self.assertEqual(handoff["task_id"], "T-1")
        self.assertEqual(handoff["changed_files"], ["README.md"])
        self.assertEqual(handoff["commands_run"], ["python3 -m unittest"])

    def test_handoff_rejects_non_string_receipts(self):
        with self.assertRaises(ValueError):
            build_handoff(SessionState("s1", "T-1"), ["ok", 2], [])


if __name__ == "__main__":
    unittest.main()
