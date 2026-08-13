import unittest

from main import (
    Graph,
    GraphError,
    GraphRunner,
    NodeResult,
    Status,
    demo_graph,
    fan_out_merge,
)


class WorkflowGraphTests(unittest.TestCase):
    def test_demo_pauses_at_human_approval(self):
        runner = GraphRunner(demo_graph(), {"requirements": "", "attempts": 0}, "research")
        runner.run()
        self.assertEqual(runner.status, Status.PAUSED)
        self.assertEqual(runner.current, "approval")
        self.assertEqual(runner.state["review"], "pass")

    def test_approval_resume_reaches_merge(self):
        runner = GraphRunner(demo_graph(), {"requirements": "", "attempts": 0}, "research")
        runner.run()
        runner.resume({"approval": "approved"})
        runner.run()
        self.assertEqual(runner.status, Status.COMPLETE)
        self.assertTrue(runner.state["merged"])
        self.assertIsNone(runner.state["approval"])

    def test_failed_verification_routes_back_to_implementation(self):
        runner = GraphRunner(demo_graph(), {"requirements": "known", "attempts": 0}, "implement")
        runner.run()
        nodes = [event.node for event in runner.trace]
        self.assertEqual(nodes[:4], ["implement", "verify", "implement", "verify"])
        self.assertEqual(runner.status, Status.PAUSED)

    def test_checkpoint_restore_resumes_from_next_node(self):
        runner = GraphRunner(demo_graph(), {"requirements": "known", "attempts": 0}, "implement")
        runner.run()
        checkpoint = runner.checkpoints[0]
        runner.restore(checkpoint)
        self.assertEqual(runner.status, Status.READY)
        self.assertEqual(runner.current, checkpoint.next_node)
        self.assertEqual(runner.state, checkpoint.state)

    def test_rejected_approval_is_consumed_before_new_repair_approval(self):
        runner = GraphRunner(demo_graph(), {"requirements": "", "attempts": 0}, "research")
        runner.run()
        initial_trace_length = len(runner.trace)
        runner.resume({"approval": "rejected"})
        runner.run()
        self.assertEqual(runner.status, Status.PAUSED)
        self.assertIsNone(runner.state["approval"])
        self.assertEqual(runner.current, "approval")
        self.assertEqual(runner.state["attempts"], 3)
        repair_trace = [event.node for event in runner.trace[initial_trace_length:]]
        self.assertEqual(repair_trace, ["approval", "implement", "verify", "approval"])
        self.assertEqual(runner.trace[initial_trace_length].route, "rejected")
        self.assertEqual(runner.trace[-1].note, "waiting for human approval")

    def test_fan_out_isolates_branch_inputs_and_appends_lists(self):
        seen = []

        def tests(state):
            seen.append(list(state["evidence"]))
            return {"evidence": ["tests"]}

        def security(state):
            seen.append(list(state["evidence"]))
            return {"evidence": ["security"]}

        result = fan_out_merge({"evidence": ["requirements"]}, {"tests": tests, "security": security}, append_keys={"evidence"})
        self.assertEqual(seen, [["requirements"], ["requirements"]])
        self.assertEqual(result["evidence"], ["requirements", "tests", "security"])

    def test_fan_in_rejects_conflicting_scalars(self):
        with self.assertRaises(GraphError):
            fan_out_merge({}, {"a": lambda state: {"status": "pass"}, "b": lambda state: {"status": "fail"}})

    def test_graph_rejects_duplicate_routes_and_unknown_nodes(self):
        graph = Graph()
        graph.add_node("a", lambda state: NodeResult())
        graph.add_node("b", lambda state: NodeResult())
        graph.add_edge("a", "b", "next")
        with self.assertRaises(GraphError):
            graph.add_edge("a", "b", "next")
        with self.assertRaises(GraphError):
            graph.add_edge("a", "missing")

    def test_unknown_route_is_atomic(self):
        graph = Graph()
        graph.add_node("a", lambda state: NodeResult({"bad": True}, route="unknown"))
        graph.add_node("b", lambda state: NodeResult())
        graph.add_edge("a", "b", "expected")
        runner = GraphRunner(graph, {"initial": True}, "a")
        with self.assertRaises(GraphError):
            runner.step()
        self.assertEqual(runner.state, {"initial": True})
        self.assertEqual(runner.trace, [])

    def test_step_budget_is_hard_stop(self):
        graph = Graph()
        graph.add_node("a", lambda state: NodeResult(route="next"))
        graph.add_node("b", lambda state: NodeResult(route="next"))
        graph.add_edge("a", "b", "next")
        graph.add_edge("b", "a", "next")
        with self.assertRaises(GraphError):
            GraphRunner(graph, {}, "a").run(max_steps=2)

    def test_resume_requires_an_explicit_approval(self):
        runner = GraphRunner(demo_graph(), {"requirements": "", "attempts": 0}, "research")
        runner.run()
        with self.assertRaises(GraphError):
            runner.resume({})


if __name__ == "__main__":
    unittest.main()
