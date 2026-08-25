# Recommender Evaluation Card

Run python3 main.py from code/ and record:

- interaction meaning: positive cell means observed implicit feedback; zero is unknown;
- training cutoff and leave-one-out or time-based held-out item per user;
- candidate eligibility, consumed-item mask, K, and the popularity cold-start fallback;
- popularity, neighborhood, and factor settings, including the factor seed;
- Precision@K, Recall@K, and NDCG@K with their denominators;
- unique ranked item IDs (duplicate recommendations are rejected);
- coverage, diversity, safety, latency, and exposure-bias checks.

Fit counts, similarities, and factors only on training interactions. An offline
ranking score does not measure a causal product outcome, and a popularity list can
reinforce the exposure policy that generated the data. Do not factorize an
all-zero matrix: for a user with no history, use the deterministic popularity
fallback and record that no personalized evidence was available.
