# Graph Theory for Machine Learning

> The same adjacency structure powers traversal, spectral clustering, message passing, and ranking.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 01, 02, 11, and 12 (vectors, matrices, SVD, and tensors)
**Time:** ~75 minutes

## Learning Objectives

- Represent directed and undirected weighted graphs with adjacency dictionaries and matrices.
- Trace BFS distances and DFS visitation order on a fixed graph.
- Compute `L=D-A` and relate zero eigenvalues to connected components.
- Aggregate node features with one normalized message-passing round.
- Use a Fiedler-vector split, spectral clustering, and PageRank without a graph package.

## Build It

Run the NumPy implementation:

```bash
cd phases/01-math-foundations/21-graph-theory/code
python3 main.py
```

`Graph(6)` starts with nodes `0..5`; `add_edge(0,1)` updates both adjacency dictionaries for an undirected graph. `adjacency_matrix()` and `degree_matrix()` return `(n,n)` arrays, while `laplacian()` returns `D-A`. `bfs` returns `(order, distances)` and uses a FIFO queue; `dfs` uses a stack and returns an order only.

The Laplacian fixture has a triangle on nodes `0,1,2`, an edge `3-4`, and an edge `5-6`, so it has three connected components and three eigenvalues near zero. `spectral_clustering(g,k=2)` uses the second-smallest Laplacian eigenvector and assigns label 1 where its entry is negative. Labels may be swapped without changing the partition.

## Use It

`message_passing(graph, features, weight_matrix)` row-normalizes the adjacency matrix, computes `A_norm @ features`, then applies `@ weight_matrix`. For five nodes, three input features, and a `(3,2)` weight matrix, the output shape is `(5,2)`. An isolated node has a zero row and therefore receives a zero aggregate in this implementation; a self-loop is not added automatically.

`pagerank` distributes dangling-node mass uniformly and iterates until the L1 change is below `tol` or `max_iter` is reached. Its scores sum to approximately one. The demo's bridge edge `2-7` connects two five-node cliques; the PageRank comparison is evidence for this fixture, not a universal bridge-centrality theorem.

## Ship It

The reusable handoff is [the graph-analysis skill](../../21-graph-theory/outputs/skill-graph-analysis.md). Record node count, directedness, edge weights, traversal start, normalization rule, clustering `k`, and PageRank tolerances with the result.

## Exercises

1. Build the six-node path/branch fixture from the demo and verify `bfs(g,0)[1][5] == 4`.
2. Add an isolated node to a seven-node graph and count the near-zero eigenvalues of `g.laplacian()`.
3. Use `features=np.eye(3)` on a three-node path and a `(3,2)` weight matrix; verify the message-passing output shape and the endpoint aggregate.
4. Run `spectral_clustering` on two five-node cliques joined by `2-7`; evaluate whether the labels separate the two cliques up to a label swap.

## Reference Solution

BFS reaches node 5 in four edges in the demo graph. The disconnected seven-node fixture has three components and three Laplacian zero modes. Message passing averages each node's neighbors before applying the weight matrix, so an endpoint receives only its one neighbor's feature. The Fiedler split separates the two cliques except for the weak bridge's influence; either label polarity is valid.

## Tests

```bash
python3 -m unittest discover tests -v
```

Tests cover directed/undirected adjacency, BFS/DFS order, Laplacian structure and components, spectral-clustering validation, normalized message-passing shapes, PageRank mass conservation, and the canonical demo.
