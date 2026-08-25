# Graph-theory tests for phases/01-math-foundations/21-graph-theory/docs/en.md.
# They assert adjacency, traversal, spectral, message-passing, and ranking invariants.
# NumPy is the only non-stdlib dependency and every graph is a local fixture.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.

from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from graph_theory import (  # noqa: E402
    Graph,
    bfs,
    connected_components,
    dfs,
    message_passing,
    pagerank,
    spectral_clustering,
)


class GraphTheoryTests(unittest.TestCase):
    def test_undirected_edges_update_both_adjacency_entries(self) -> None:
        graph = Graph(3)
        graph.add_edge(0, 1, weight=2.5)
        self.assertEqual(graph.neighbors(0), [1])
        self.assertEqual(graph.neighbors(1), [0])
        self.assertEqual(graph.weighted_degree(0), 2.5)
        np.testing.assert_allclose(graph.adjacency_matrix(), [[0, 2.5, 0], [2.5, 0, 0], [0, 0, 0]])

    def test_directed_edge_has_one_direction(self) -> None:
        graph = Graph(2, directed=True)
        graph.add_edge(0, 1)
        self.assertEqual(graph.neighbors(0), [1])
        self.assertEqual(graph.neighbors(1), [])

    def test_bfs_distances_and_dfs_visit_all_reachable_nodes(self) -> None:
        graph = Graph(5)
        graph.add_edge(0, 1)
        graph.add_edge(0, 2)
        graph.add_edge(1, 3)
        graph.add_edge(3, 4)
        order, distances = bfs(graph, 0)
        self.assertEqual(distances[4], 3)
        self.assertEqual(set(order), {0, 1, 2, 3, 4})
        self.assertEqual(set(dfs(graph, 0)), {0, 1, 2, 3, 4})

    def test_laplacian_zero_modes_match_components(self) -> None:
        graph = Graph(6)
        graph.add_edge(0, 1)
        graph.add_edge(1, 2)
        graph.add_edge(3, 4)
        components = connected_components(graph)
        eigenvalues = np.linalg.eigvalsh(graph.laplacian())
        zero_modes = int(np.sum(np.abs(eigenvalues) < 1e-8))
        self.assertEqual(len(components), 3)
        self.assertEqual(zero_modes, len(components))

    def test_message_passing_normalizes_neighbor_aggregate(self) -> None:
        graph = Graph(3)
        graph.add_edge(0, 1)
        graph.add_edge(1, 2)
        features = np.eye(3)
        output = message_passing(graph, features, np.eye(3))
        np.testing.assert_allclose(output[0], [0.0, 1.0, 0.0])
        np.testing.assert_allclose(output[1], [0.5, 0.0, 0.5])
        self.assertEqual(output.shape, (3, 3))

    def test_spectral_clustering_rejects_invalid_k(self) -> None:
        with self.assertRaises(ValueError):
            spectral_clustering(Graph(1), k=2)
        with self.assertRaises(ValueError):
            spectral_clustering(Graph(3), k=1)

    def test_spectral_clustering_returns_one_label_per_node(self) -> None:
        graph = Graph(6)
        for left, right in ((0, 1), (1, 2), (0, 2), (3, 4), (4, 5), (3, 5), (2, 3)):
            graph.add_edge(left, right)
        labels = spectral_clustering(graph, k=2)
        self.assertEqual(labels.shape, (6,))
        self.assertEqual(set(labels.tolist()), {0, 1})

    def test_pagerank_conserves_probability_mass(self) -> None:
        graph = Graph(3, directed=True)
        graph.add_edge(0, 1)
        graph.add_edge(1, 2)
        scores = pagerank(graph)
        self.assertAlmostEqual(float(scores.sum()), 1.0)
        self.assertTrue(np.all(scores >= 0))


if __name__ == "__main__":
    unittest.main()
