import unittest

from main import (
    Evaluation,
    LoopPolicy,
    LoopResult,
    Trigger,
    TriggerKind,
    compare_manual_and_automated,
    demo_evaluator,
    demo_maker,
    run_loop,
    trigger_due,
)


class AutomatedLoopTests(unittest.TestCase):
    def test_demo_loop_completes_with_round_receipts(self):
        result = run_loop("ship", demo_maker, demo_evaluator)
        self.assertEqual(result.status, "complete")
        self.assertEqual(len(result.receipts), 3)
        self.assertTrue(result.receipts[-1].passed)
        self.assertEqual(result.interventions, 0)

    def test_feedback_reaches_the_next_maker_round(self):
        seen = []

        def maker(goal, artifact, feedback):
            del goal
            seen.append(feedback)
            return artifact + (" fix" if feedback else "start")

        def evaluator(goal, artifact):
            del goal
            return ("fix" in artifact, "add fix")

        result = run_loop("repair", maker, evaluator)
        self.assertEqual(result.status, "complete")
        self.assertEqual(seen, ["", "add fix"])

    def test_round_budget_stops_a_never_passing_loop(self):
        result = run_loop(
            "never",
            lambda goal, artifact, feedback: artifact + ".",
            lambda goal, artifact: (False, "retry"),
            policy=LoopPolicy(max_rounds=2, max_stalled=5),
        )
        self.assertEqual(result.status, "exhausted")
        self.assertEqual(len(result.receipts), 2)

    def test_stall_budget_stops_unchanged_failed_artifact(self):
        result = run_loop(
            "stalled",
            lambda goal, artifact, feedback: artifact or "same",
            lambda goal, artifact: (False, "no change"),
            initial="same",
            policy=LoopPolicy(max_rounds=5, max_stalled=2),
        )
        self.assertEqual(result.status, "stalled")
        self.assertEqual(len(result.receipts), 2)

    def test_trigger_semantics_are_explicit(self):
        self.assertFalse(trigger_due(Trigger(TriggerKind.MANUAL), now=0))
        self.assertTrue(trigger_due(Trigger(TriggerKind.GOAL), now=0, requested=True))
        self.assertTrue(trigger_due(Trigger(TriggerKind.TIMER, interval=10), now=11, last_run=0))
        self.assertFalse(trigger_due(Trigger(TriggerKind.TIMER, interval=10), now=9, last_run=0))
        event = Trigger(TriggerKind.EVENT, event_name="ci.failed")
        self.assertTrue(trigger_due(event, now=0, event_name="ci.failed"))
        self.assertFalse(trigger_due(event, now=0, event_name="ci.opened"))

    def test_trigger_and_policy_validation_reject_bad_limits(self):
        with self.assertRaises(ValueError):
            Trigger(TriggerKind.TIMER)
        with self.assertRaises(ValueError):
            Trigger(TriggerKind.EVENT)
        with self.assertRaises(ValueError):
            LoopPolicy(max_rounds=0)
        with self.assertRaises(ValueError):
            LoopPolicy(max_interventions=-1)

    def test_intervention_is_counted_and_receipted(self):
        seen = []

        def maker(goal, artifact, feedback):
            del goal
            seen.append(feedback)
            return artifact + (" fixed" if feedback else "start")

        def evaluator(goal, artifact):
            del goal
            if "fixed" in artifact:
                return Evaluation(True, "accepted")
            return Evaluation(False, "needs review", "human must approve the repair")

        def intervene(reason, artifact):
            seen.append(reason)
            self.assertIn("start", artifact)
            return "approved repair"

        result = run_loop(
            "repair",
            maker,
            evaluator,
            policy=LoopPolicy(max_interventions=1),
            intervene=intervene,
        )
        self.assertEqual(result.status, "complete")
        self.assertEqual(result.interventions, 1)
        self.assertEqual(result.receipts[0].intervention, "human must approve the repair")
        self.assertEqual(result.receipts[0].intervention_feedback, "approved repair")
        self.assertEqual(seen, ["", "human must approve the repair", "approved repair"])

    def test_intervention_budget_is_hard_and_records_the_excess_request(self):
        called = []

        def intervene(reason, artifact):
            called.append((reason, artifact))
            return "should not run"

        result = run_loop(
            "blocked",
            lambda goal, artifact, feedback: "candidate",
            lambda goal, artifact: Evaluation(False, "needs a decision", "human decision required"),
            policy=LoopPolicy(max_rounds=4, max_interventions=0),
            intervene=intervene,
        )
        self.assertEqual(result.status, "intervention_budget_exhausted")
        self.assertEqual(result.interventions, 1)
        self.assertEqual(len(result.receipts), 1)
        self.assertEqual(result.receipts[0].intervention, "human decision required")
        self.assertEqual(called, [])

    def test_comparison_counts_intervention_reduction(self):
        result = LoopResult("complete", "ok", "done", [], 0)
        comparison = compare_manual_and_automated(4, result)
        self.assertEqual(comparison["interventions_reduced"], 4)
        with self.assertRaises(ValueError):
            compare_manual_and_automated(-1, result)

    def test_invalid_goal_and_evaluator_shape_fail_before_success(self):
        with self.assertRaises(ValueError):
            run_loop(" ", demo_maker, demo_evaluator)
        with self.assertRaises(TypeError):
            run_loop("goal", demo_maker, lambda goal, artifact: True)

    def test_intervention_handler_must_return_feedback(self):
        with self.assertRaises(TypeError):
            run_loop(
                "goal",
                demo_maker,
                lambda goal, artifact: Evaluation(False, "retry", "need input"),
                policy=LoopPolicy(max_interventions=1),
                intervene=lambda reason, artifact: None,
            )


if __name__ == "__main__":
    unittest.main()
