from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main


class RecommenderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.matrix = np.array([[1, 1, 0, 0], [1, 0, 1, 0], [0, 1, 1, 1]], dtype=float)

    def test_popularity_counts_observed_interactions(self) -> None:
        np.testing.assert_array_equal(main.popularity_scores(self.matrix), [2, 2, 2, 1])

    def test_similarity_is_symmetric_with_zero_diagonal(self) -> None:
        similarity = main.cosine_user_similarity(self.matrix)
        np.testing.assert_allclose(similarity, similarity.T)
        np.testing.assert_allclose(np.diag(similarity), 0.0)

    def test_recommendations_exclude_consumed_items(self) -> None:
        ranked = main.recommend(self.matrix, 0, method="neighbors", k=2)
        self.assertTrue(all(self.matrix[0, item] == 0 for item in ranked))

    def test_ranking_metrics_reward_early_hit(self) -> None:
        self.assertEqual(main.recall_at_k([2, 3], {2}, 2), 1.0)
        self.assertGreater(main.ndcg_at_k([2, 3], {2}, 2), main.ndcg_at_k([3, 2], {2}, 2))
        for metric in (main.precision_at_k, main.recall_at_k, main.ndcg_at_k):
            with self.assertRaises(ValueError):
                metric([1, 1], {1}, 2)
        self.assertLessEqual(main.ndcg_at_k([1, 2], {1}, 2), 1.0)

    def test_factorization_is_deterministic(self) -> None:
        first = main.factorize(self.matrix, epochs=5, seed=3)
        second = main.factorize(self.matrix, epochs=5, seed=3)
        np.testing.assert_allclose(first.users, second.users)
        np.testing.assert_allclose(first.items, second.items)

    def test_leave_one_out_uses_users_with_two_items(self) -> None:
        train, held_out = main.leave_one_out(self.matrix)
        self.assertEqual(set(held_out), {0, 1, 2})
        self.assertEqual(int(train.sum()), int(self.matrix.sum()) - 3)

    def test_invalid_matrix_ranking_and_factor_parameters_fail(self) -> None:
        with self.assertRaises(ValueError):
            main.popularity_scores([[1, -1]])
        with self.assertRaises(ValueError):
            main.top_k([1.0, float("nan")], 1)
        with self.assertRaises(ValueError):
            main.recommend(self.matrix, 0, method="neighbors", k=0)
        with self.assertRaises(ValueError):
            main.factorize(self.matrix, learning_rate=0)
        with self.assertRaises(ValueError):
            main.factorize(np.zeros((2, 3)))

    def test_user_cold_start_uses_seed_independent_popularity_fallback(self) -> None:
        matrix = np.array([[0, 0, 0], [1, 0, 1]], dtype=float)
        expected = main.recommend(matrix, 0, method="popularity", k=3)
        self.assertEqual(expected, [0, 2, 1])
        for method in ("neighbors", "factors"):
            self.assertEqual(main.recommend(matrix, 0, method=method, k=3), expected)
        self.assertTrue(all(matrix[0, item] == 0 for item in expected))


if __name__ == "__main__":
    unittest.main()
