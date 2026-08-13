import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from main import (
    CheckResult,
    LoopPolicy,
    Trigger,
    TriggerKind,
    demo_checker,
    demo_maker,
    read_round_receipts,
    run_maker_checker,
    trigger_is_due,
    write_round_receipts,
)


class LoopEngineTests(unittest.TestCase):
    def test_demo_reaches_completion_with_receipts(self):
        result = run_maker_checker("ship it", demo_maker, demo_checker)

        self.assertTrue(result.complete)
        self.assertEqual(result.status, "complete")
        self.assertEqual(len(result.rounds), 3)
        self.assertTrue(result.rounds[-1].passed)
        self.assertEqual(result.rounds[-1].score, 1.0)

    def test_checker_feedback_is_passed_to_the_next_round(self):
        seen_feedback = []

        def maker(goal, artifact, feedback):
            del goal
            seen_feedback.append(feedback)
            return artifact + (" + fix" if feedback else "")

        def checker(goal, artifact):
            del goal
            return CheckResult("fix" in artifact, feedback="add fix")

        result = run_maker_checker("repair", maker, checker)

        self.assertTrue(result.complete)
        self.assertEqual(seen_feedback, ["", "add fix"])

    def test_max_rounds_is_a_hard_stop(self):
        def maker(goal, artifact, feedback):
            del goal, feedback
            return artifact + " attempt"

        def checker(goal, artifact):
            del goal, artifact
            return CheckResult(False, feedback="still failing")

        result = run_maker_checker(
            "never passes",
            maker,
            checker,
            policy=LoopPolicy(max_rounds=2, max_stalled_rounds=3),
        )

        self.assertEqual(result.status, "exhausted")
        self.assertEqual(len(result.rounds), 2)

    def test_stall_stop_catches_an_unchanged_failed_artifact(self):
        def maker(goal, artifact, feedback):
            del goal, feedback
            return artifact or "unchanged"

        def checker(goal, artifact):
            del goal, artifact
            return CheckResult(False, feedback="no change")

        result = run_maker_checker(
            "stalled",
            maker,
            checker,
            initial_artifact="unchanged",
            policy=LoopPolicy(max_rounds=8, max_stalled_rounds=2),
        )

        self.assertEqual(result.status, "stalled")
        self.assertEqual(len(result.rounds), 2)
        self.assertFalse(result.complete)

    def test_stable_passing_artifact_can_accumulate_required_passes(self):
        def maker(goal, artifact, feedback):
            del goal, feedback
            return artifact or "done"

        def checker(goal, artifact):
            del goal, artifact
            return CheckResult(True, feedback="stable", score=1.0)

        result = run_maker_checker(
            "confirm repeatedly",
            maker,
            checker,
            policy=LoopPolicy(max_rounds=5, required_passes=4, max_stalled_rounds=2),
        )

        self.assertTrue(result.complete)
        self.assertEqual(len(result.rounds), 4)
        self.assertEqual(result.reason, "independent evaluator passed")

    def test_required_consecutive_passes_prevents_one_lucky_pass(self):
        verdicts = iter([True, False, True, True])

        def maker(goal, artifact, feedback):
            del goal, feedback
            return artifact + "." if artifact else "draft"

        def checker(goal, artifact):
            del goal, artifact
            return CheckResult(next(verdicts), feedback="retry")

        result = run_maker_checker(
            "stable result",
            maker,
            checker,
            policy=LoopPolicy(required_passes=2, max_rounds=5),
        )

        self.assertTrue(result.complete)
        self.assertEqual(len(result.rounds), 4)
        self.assertEqual(result.consecutive_passes, 2)

    def test_empty_goal_and_invalid_score_are_rejected(self):
        with self.assertRaises(ValueError):
            run_maker_checker(" ", demo_maker, demo_checker)
        with self.assertRaises(ValueError):
            CheckResult(True, score=1.1)
        with self.assertRaises(TypeError):
            CheckResult("yes")
        with self.assertRaises(ValueError):
            LoopPolicy(max_rounds=2, required_passes=3)

    def test_manual_and_goal_triggers_need_an_explicit_request(self):
        for kind in (TriggerKind.MANUAL, TriggerKind.GOAL):
            trigger = Trigger(kind)
            self.assertFalse(trigger_is_due(trigger, now=0))
            self.assertTrue(trigger_is_due(trigger, now=0, requested=True))

    def test_timer_and_event_triggers_are_stateless(self):
        timer = Trigger(TriggerKind.TIMER, interval_seconds=10)
        self.assertTrue(trigger_is_due(timer, now=11, last_run=0))
        self.assertFalse(trigger_is_due(timer, now=9, last_run=0))

        event = Trigger(TriggerKind.EVENT, event_name="ci.failed")
        self.assertTrue(trigger_is_due(event, now=0, event_name="ci.failed"))
        self.assertFalse(trigger_is_due(event, now=0, event_name="pr.opened"))

    def test_timer_and_event_specs_validate_required_fields(self):
        with self.assertRaises(ValueError):
            Trigger(TriggerKind.TIMER)
        with self.assertRaises(ValueError):
            Trigger(TriggerKind.EVENT)

        self.assertEqual(Trigger("timer", interval_seconds=5).kind, TriggerKind.TIMER)
        with self.assertRaises(ValueError):
            Trigger("unknown")

    def test_round_receipts_round_trip_through_jsonl(self):
        result = run_maker_checker("ship it", demo_maker, demo_checker)
        with TemporaryDirectory() as directory:
            path = Path(directory) / "rounds.jsonl"
            write_round_receipts(result, path)
            restored = read_round_receipts(path)
            line_count = len(path.read_text(encoding="utf-8").splitlines())

        self.assertEqual(restored, result.rounds)
        self.assertEqual(line_count, 3)

    def test_round_receipt_reader_rejects_malformed_records(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "bad.jsonl"
            path.write_text('{"number": 1}\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                read_round_receipts(path)


if __name__ == "__main__":
    unittest.main()
