# Recommender Systems from Scratch

> A recommender is a ranking system under missing feedback, exposure bias, and cold-start constraints—not merely a similarity formula.

**Type:** Build
**Languages:** Python
**Prerequisites:** Vectors, Matrices and Operations, Model Evaluation, Handling Imbalanced Data
**Time:** ~105 minutes

## Learning Objectives

- Distinguish explicit ratings, implicit feedback, exposure, and unobserved preference.
- Build popularity, neighborhood, and matrix-factorization recommenders from raw operations.
- Evaluate ranked lists with Precision@K, Recall@K, and NDCG@K using a leakage-safe split.
- Handle new users, new items, sparse histories, and popularity bias with explicit fallbacks.
- Design an offline-to-online validation plan that includes diversity, safety, and business constraints.

## The Real Problem

A user-item matrix is mostly empty. An empty cell rarely means dislike; it may mean the user never saw the item. Recommenders therefore learn from selective feedback produced by an earlier interface, ranking policy, inventory, and user behavior. Treating every missing value as a negative creates a biased training target.

**Explicit feedback** includes ratings or direct preferences. **Implicit feedback** includes clicks, views, saves, purchases, and watch time. Implicit signals are abundant but ambiguous. A click can mean curiosity; no click can mean no exposure.

## Baseline First

A popularity recommender ranks items by aggregate interaction. It ignores personalization, but it is cheap, robust for new users, and a difficult baseline to beat honestly. Segment-aware popularity can respect locale, time window, availability, or age restrictions without pretending to know an individual preference.

Every personalized method needs a fallback. When the user has no history or the candidate item has no interactions, use a documented rule such as eligible recent popularity, editorial curation, or a short onboarding preference—not a random score hidden inside the model.

## Build It: neighborhood methods

User-based collaborative filtering finds users with similar interaction vectors and aggregates their preferences. Item-based filtering finds items co-preferred by similar users. Cosine similarity is easy to inspect, but shared zeros and tiny histories can produce misleading neighbors. Require overlap, shrink similarity toward zero when evidence is thin, and exclude already consumed items.

## Build It: matrix factorization

Matrix factorization represents each user and item with a short latent vector. Their dot product predicts affinity. Stochastic gradient descent updates only the user and item involved in an observed interaction, with regularization limiting runaway factors.

For implicit data, sampled negatives are not confirmed dislikes. The sampling policy becomes part of the model definition. Pairwise objectives such as Bayesian Personalized Ranking optimize the ordering between an observed item and a sampled unobserved item; see [BPR: Bayesian Personalized Ranking from Implicit Feedback](https://arxiv.org/abs/1205.2618).

## Evaluate the Ranking

Randomly splitting interaction rows can leak later behavior into earlier recommendations. Prefer leave-last-out or time-based splits per user. Fit popularity, similarities, factors, and candidate-generation statistics using training history only.

- **Precision@K** asks what share of the recommended list is relevant.
- **Recall@K** asks what share of the held-out relevant items appears in the list.
- **NDCG@K** rewards placing relevant items earlier and supports graded relevance.

Offline relevance is not the whole product. Track catalog coverage, diversity, novelty, creator or supplier concentration, unsafe content, latency, and the effect on different user groups. Online evaluation should guard against feedback loops: a ranking changes exposure, which changes the next training data.

## Use It

The canonical program uses a small NumPy matrix so every score and exclusion can be inspected. It compares popularity, user-neighborhood scoring, and deterministic matrix factorization on a leave-one-out task. The result is a production-shaped interface: candidate scores, consumed-item masking, top-K ranking, fallback, and ranked metrics.

Run:

```bash
python3 main.py
```

## Failure Modes

- **Cold start:** new users or items have no collaborative evidence.
- **Popularity feedback loop:** already exposed items collect more signals and dominate future exposure.
- **Temporal leakage:** future interactions influence earlier rankings.
- **Filter bubble:** repeated similarity reduces discovery and catalog coverage.
- **Metric mismatch:** click optimization may harm long-term satisfaction or safety.

## Exercises

1. Add a new user with no history. Compare the documented fallback with zero-filled collaborative scores and explain which behavior is safer.
2. Change the split from leave-one-out to a random interaction split. Identify at least one statistic that can leak and predict the metric direction.
3. Add a reranking constraint that limits two items from the same category in the top five. Measure the relevance and diversity tradeoff.

## Reference Solution

The canonical [main.py](../code/main.py) treats missing cells as unknown, masks consumed items, and compares methods on held-out interactions. A complete solution fits every statistic on training history only, reports at least one ranked metric and one catalog or safety measure, and specifies a deterministic fallback for users or items without collaborative evidence.

## Further Reading

- [Matrix Factorization Techniques for Recommender Systems](https://doi.org/10.1109/MC.2009.263)
- [BPR: Bayesian Personalized Ranking from Implicit Feedback](https://arxiv.org/abs/1205.2618)
- [Recommender Systems Handbook](https://link.springer.com/book/10.1007/978-1-4899-7637-6)
