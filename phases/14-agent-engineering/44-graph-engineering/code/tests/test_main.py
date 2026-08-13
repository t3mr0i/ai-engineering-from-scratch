import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from main import (
    Checkpoint,
    GraphError,
    GraphRunner,
    GraphSpec,
    GraphStatus,
    NodeResult,
    build_demo_graph,
    fan_out_merge,
    load_checkpoint,
    save_checkpoint,
)


class GraphEngineTests(unittest.TestCase):
    def test_demo_graph_pauses_at_human_approval(self):
        runner = GraphRunner(build_demo_graph(), {"requirements": "", "attempts": 0}, "research")

        runner.run()

        self.assertEqual(runner.status, GraphStatus.PAUSED)
        self.assertEqual(runner.current, "approval")
        self.assertEqual(runner.state["review"], "pass")
        self.assertGreaterEqual(len(runner.checkpoints), 1)

    def test_resume_approval_reaches_terminal_merge(self):
        runner = GraphRunner(build_demo_graph(), {"requirements": "", "attempts": 0}, "research")
        runner.run()

        runner.resume({"approval": "approved"})

        self.assertEqual(runner.status, GraphStatus.COMPLETE)
        self.assertIsNone(runner.current)
        self.assertTrue(runner.state["merged"])
        self.assertEqual(runner.trace[-1].node, "merge")

    def test_rejected_approval_is_consumed_before_repair_and_new_approval(self):
        runner = GraphRunner(build_demo_graph(), {"requirements": "", "attempts": 0}, "research")
        runner.run()

        runner.resume({"approval": "rejected"})

        self.assertEqual(runner.status, GraphStatus.PAUSED)
        self.assertEqual(runner.current, "approval")
        self.assertIsNone(runner.state["approval"])
        runner.resume({"approval": "approved"})
        self.assertEqual(runner.status, GraphStatus.COMPLETE)
        self.assertTrue(runner.state["merged"])

    def test_failed_verification_routes_back_to_implement(self):
        runner = GraphRunner(
            build_demo_graph(),
            {"requirements": "already researched", "attempts": 0},
            "implement",
        )
        runner.run()

        nodes = [event.node for event in runner.trace]
        self.assertEqual(nodes[:4], ["implement", "verify", "implement", "verify"])
        self.assertEqual(runner.status, GraphStatus.PAUSED)

    def test_missing_requirements_routes_to_research(self):
        runner = GraphRunner(build_demo_graph(), {"artifact": "implementation", "attempts": 1}, "verify")
        runner.step()

        self.assertEqual(runner.current, "research")
        self.assertEqual(runner.trace[-1].route, "needs_research")

    def test_checkpoint_restore_replays_from_the_next_node(self):
        runner = GraphRunner(build_demo_graph(), {"requirements": "known", "attempts": 0}, "implement")
        runner.run()
        checkpoint = runner.checkpoints[0]
        runner.resume({"approval": "approved"})
        self.assertEqual(runner.status, GraphStatus.COMPLETE)

        runner.restore(checkpoint)

        self.assertEqual(runner.status, GraphStatus.READY)
        self.assertEqual(runner.current, checkpoint.next_node)
        self.assertEqual(runner.state, checkpoint.state)

    def test_checkpoint_round_trip_restores_a_fresh_runner(self):
        original = GraphRunner(build_demo_graph(), {"requirements": "known", "attempts": 0}, "implement")
        original.run()
        checkpoint = original.checkpoints[0]

        with TemporaryDirectory() as directory:
            path = Path(directory) / "state" / "checkpoint.json"
            save_checkpoint(checkpoint, path)
            loaded = load_checkpoint(path)

        fresh = GraphRunner(build_demo_graph(), {}, "research")
        fresh.restore(loaded)
        self.assertEqual(fresh.status, GraphStatus.READY)
        self.assertEqual(fresh.current, checkpoint.next_node)
        self.assertEqual(fresh.state, checkpoint.state)
        fresh.run()
        fresh.resume({"approval": "approved"})
        self.assertEqual(fresh.status, GraphStatus.COMPLETE)

    def test_checkpoint_loader_rejects_unknown_shape(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"
            path.write_text('{"next_node": "verify"}\n', encoding="utf-8")
            with self.assertRaises(GraphError):
                load_checkpoint(path)

    def test_checkpoint_writer_rejects_non_json_state(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"
            checkpoint = Checkpoint("verify", {"evidence": {"not-json"}}, 0)
            with self.assertRaises(GraphError):
                save_checkpoint(checkpoint, path)
            self.assertFalse(path.exists())

    def test_fan_out_isolates_branches_and_appends_evidence_at_fan_in(self):
        seen = []

        def tests(state):
            seen.append(("tests", list(state["evidence"])))
            return {"evidence": ["tests:pass"]}

        def security(state):
            seen.append(("security", list(state["evidence"])))
            return {"evidence": ["security:pass"]}

        result = fan_out_merge({"evidence": ["requirements:known"]}, {"tests": tests, "security": security}, append_keys={"evidence"})

        self.assertEqual(seen, [("tests", ["requirements:known"]), ("security", ["requirements:known"])])
        self.assertEqual(result["evidence"], ["requirements:known", "tests:pass", "security:pass"])

    def test_fan_in_rejects_conflicting_scalar_updates(self):
        with self.assertRaises(GraphError):
            fan_out_merge(
                {},
                {"a": lambda state: {"status": "pass"}, "b": lambda state: {"status": "fail"}},
            )

    def test_graph_definition_rejects_duplicate_routes_and_bad_endpoints(self):
        graph = GraphSpec()
        graph.add_node("a", lambda state: NodeResult())
        graph.add_node("b", lambda state: NodeResult())
        graph.add_edge("a", "b", label="done")
        with self.assertRaises(GraphError):
            graph.add_edge("a", "b", label="done")
        with self.assertRaises(GraphError):
            graph.add_edge("a", "missing")
        with self.assertRaises(GraphError):
            graph.add_node("not-callable", 123)

    def test_route_error_is_atomic_and_runner_remains_usable(self):
        graph = GraphSpec()
        graph.add_node("a", lambda state: NodeResult(updates={"danger": "committed"}, route="unknown"))
        graph.add_node("b", lambda state: NodeResult(updates={"safe": True}))
        graph.add_edge("a", "b", label="expected")
        runner = GraphRunner(graph, {"initial": True}, "a")

        with self.assertRaises(GraphError):
            runner.run()

        self.assertEqual(runner.state, {"initial": True})
        self.assertEqual(runner.trace, [])
        self.assertEqual(runner.checkpoints, [])
        self.assertEqual(runner.current, "a")
        self.assertEqual(runner.status, GraphStatus.READY)

        graph.nodes["a"] = lambda state: NodeResult(updates={"safe": True}, route="expected")
        runner.step()
        self.assertEqual(runner.current, "b")

    def test_unknown_route_fails_closed_instead_of_ending_successfully(self):
        graph = GraphSpec()
        graph.add_node("a", lambda state: NodeResult(route="unexpected"))
        graph.add_node("b", lambda state: NodeResult())
        graph.add_edge("a", "b", label="expected")
        runner = GraphRunner(graph, {}, "a")

        with self.assertRaises(GraphError):
            runner.step()

        terminal = GraphSpec()
        terminal.add_node("done", lambda state: NodeResult(route="unexpected"))
        with self.assertRaises(GraphError):
            GraphRunner(terminal, {}, "done").step()

    def test_step_budget_is_a_hard_stop(self):
        graph = GraphSpec()
        graph.add_node("a", lambda state: NodeResult(route="next"))
        graph.add_node("b", lambda state: NodeResult(route="next"))
        graph.add_edge("a", "b", label="next")
        graph.add_edge("b", "a", label="next")
        runner = GraphRunner(graph, {}, "a")

        with self.assertRaises(GraphError):
            runner.run(max_steps=3)


if __name__ == "__main__":
    unittest.main()
