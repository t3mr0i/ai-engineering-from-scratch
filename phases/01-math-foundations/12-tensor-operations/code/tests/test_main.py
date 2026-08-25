# Shape and indexing tests for phases/01-math-foundations/12-tensor-operations/docs/en.md.
# The custom Tensor tests keep the row-major implementation honest; NumPy checks the AI fixtures.
# Every assertion is local and deterministic.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# No framework tensor package is required.

from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from tensors import Tensor  # noqa: E402


class TensorTests(unittest.TestCase):
    def test_nested_tensor_shape_rank_size_and_stride(self) -> None:
        tensor = Tensor([[1, 2, 3], [4, 5, 6]])
        self.assertEqual(tensor.shape, (2, 3))
        self.assertEqual(tensor.rank, 2)
        self.assertEqual(tensor.size, 6)
        self.assertEqual(tensor.strides, (3, 1))

    def test_indexing_and_assignment_use_row_major_offsets(self) -> None:
        tensor = Tensor([[1, 2], [3, 4]])
        self.assertEqual(tensor[1, 0], 3)
        tensor[0, 1] = 9
        self.assertEqual(tensor.to_list(), [[1, 9], [3, 4]])

    def test_reshape_supports_one_inferred_dimension(self) -> None:
        tensor = Tensor(list(range(12)), shape=(2, 6))
        reshaped = tensor.reshape((-1, 3))
        self.assertEqual(reshaped.shape, (4, 3))
        self.assertEqual(reshaped.to_list()[2], [6, 7, 8])

    def test_permute_and_transpose_preserve_values(self) -> None:
        tensor = Tensor(list(range(24)), shape=(2, 3, 4))
        permuted = tensor.permute((1, 0, 2))
        self.assertEqual(permuted.shape, (3, 2, 4))
        self.assertEqual(permuted[2, 1, 3], tensor[1, 2, 3])
        self.assertEqual(tensor.transpose(0, 1).shape, (3, 2, 4))

    def test_reductions_and_elementwise_operations_keep_shapes(self) -> None:
        a = Tensor([[1, 2], [3, 4]])
        b = Tensor([[10, 20], [30, 40]])
        self.assertEqual((a + b).to_list(), [[11, 22], [33, 44]])
        self.assertEqual((a * 2).to_list(), [[2, 4], [6, 8]])
        self.assertEqual(a.sum(), 10)
        self.assertEqual(a.sum(axis=0).to_list(), [4.0, 6.0])

    def test_invalid_nested_shape_and_partial_indexing_raise(self) -> None:
        with self.assertRaises(ValueError):
            Tensor([[1, 2], [3]])
        with self.assertRaises(IndexError):
            Tensor([[1, 2]])[0]

    def test_numpy_attention_einsum_shapes_match_contract(self) -> None:
        q = np.zeros((2, 4, 8, 16))
        k = np.zeros_like(q)
        v = np.zeros_like(q)
        scores = np.einsum("bhtd,bhsd->bhts", q, k)
        output = np.einsum("bhts,bhsd->bhtd", scores, v)
        self.assertEqual(scores.shape, (2, 4, 8, 8))
        self.assertEqual(output.shape, (2, 4, 8, 16))


if __name__ == "__main__":
    unittest.main()
