# Recommender Systems from Scratch

> A recommender ranks uncertain, selectively observed feedback; an empty cell is not automatically a dislike.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02, Lessons 01–14
**Time:** ~90 minutes

## Learning Objectives

- Distinguish an observed implicit interaction from an explicit rating or an unobserved item.
- Compute popularity and cosine-neighborhood scores from a non-negative user-item matrix.
- Fit the lesson's deterministic matrix-factorization baseline and mask consumed items.
- Evaluate leave-one-out rankings with Precision@K, Recall@K, and NDCG@K.
- Describe cold-start, exposure bias, and temporal leakage boundaries around an offline score.

## The local interaction contract

The canonical matrix is non-empty, finite, and non-negative. A positive entry is
an observed interaction; zero means that this fixture has no observed interaction,
not that the user rejected the item. The demo matrix has six users and eight items.
The final positive entry in each eligible user row is held out by leave_one_out.
Users with fewer than two positive entries are not placed in the held-out map.

popularity_scores counts positive rows per item. It is a useful cold-start
fallback because it needs no user history, but it also reflects the exposure
policy that produced the interactions. cosine_user_similarity binarizes rows,
computes pairwise cosine similarity, and sets the diagonal to zero. The
neighborhood scorer requires a positive minimum overlap, weights neighbor
histories, and masks items already consumed by the requested user.

## Matrix factorization

factorize initializes user and item vectors with a seeded NumPy generator. It
requires at least one observed interaction; factorizing an all-zero matrix is
rejected instead of returning arbitrary latent scores. For
each observed cell it predicts the dot product, computes target minus prediction,
and applies a stochastic gradient update with optional non-negative regularization.
It is a small educational implicit-feedback baseline, not a claim that zeros are
negative samples. FactorModel.scores returns one score per item for a valid user.
Fitting again constructs fresh vectors, so the same seed and input reproduce the
same result.

recommend accepts popularity, neighbors, or factors. It checks the user and K,
then returns at most K unconsumed item indices. If a user has no history, every
method uses the same deterministic popularity fallback; no personal factors are
invented. If a user has history but no useful neighbor evidence,
neighborhood_scores also falls back to popularity. Recommended IDs must be unique;
precision, recall, and NDCG reject duplicate ranked IDs rather than double-counting
one item.

## Ranked evaluation

Precision@K divides relevant items in the first K positions by K. Recall@K
divides retrieved relevant items by the held-out relevant set. NDCG discounts a
relevant hit at rank 2 less than one at rank 1. These metrics require a stated
split and candidate policy. They do not measure diversity, safety, latency, or
catalog coverage.

## Build It

From code/, run python3 main.py. It prints leave-one-out Recall@3 and NDCG@3
for popularity, neighbors, and factors, followed by a popularity top-three
cold-start list. Reproduce the smallest ranking calculation with a three-row
matrix such as [[1,1,0,0], [1,0,1,0], [0,1,1,1]]:
popularity_scores returns [2,2,2,1]. Calling recommend for user 0 never returns
items 0 or 1 because those cells were already consumed.

## Use It

Fit popularity counts, similarities, and factors only on training interactions.
For a time-aware product, use the latest interaction as the held-out target per
user and freeze candidate eligibility at the forecast timestamp. Compare a
personalized method with the popularity baseline and add catalog coverage,
diversity, safety, and latency before an online decision.

## Ship It

outputs/recommender-evaluation-card.md is the handoff artifact. Fill in the
interaction definition, exposure assumptions, split timestamp, candidate set,
consumed-item mask, K, metrics, and cold-start fallback. The card must identify
which statistics were fit on training history and must not present an offline
ranking metric as a causal product outcome.

## Exercises

1. On the three-row matrix above, calculate the item counts and the cosine
   diagonal. Confirm that the diagonal is zero before neighborhood scoring.
2. Run leave_one_out on the six-user demo matrix. List one held-out item and
   show that it is absent from the corresponding training row.
3. Compare popularity and neighbors for a user with no positive row in a copy of
   the matrix. Explain why the popularity fallback has no personalized evidence.
4. Fit factorize twice with seed=3 and once with seed=4. Compare vector equality,
   then report why a different seed is not a model-quality verdict.
5. Compute Recall@3 and NDCG@3 for one relevant item at rank 1 versus rank 3.
   Pass [1,1] to each ranking metric and record the duplicate-ID ValueError.
6. Give one user an all-zero history in a matrix with two observed items. Compare
   popularity, neighbors, and factors; all three must return the same fallback,
   with no consumed-item violation. Factorize an all-zero matrix and record its
   explicit ValueError.

## Reference Solution

A correct submission shows popularity counts [2,2,2,1] for the small fixture,
masks consumed items, holds out only eligible users, and reproduces factor
vectors for a fixed seed. It reports the three ranking metrics with their
denominators and states the training-only split. The evaluation card includes
non-relevance product checks and a deterministic cold-start fallback.
