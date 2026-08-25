# Statistical Testing Skill

Use this skill to turn an experiment into a report that separates evidence from impact.

## Required record

```text
estimand: <mean, difference, correlation, or other statistic>
groups_or_pairs: <data relationship and sample sizes>
null: <exact null value>
estimate: <value and units>
interval: <method, confidence level, bounds>
test: <statistic, df, p-value, approximation note>
effect_size: <Cohen's d or domain lift>
correction: <none or multiple-test procedure>
decision_threshold: <practical minimum and cost/risk>
seed: <when resampling>
```

Interpret p-values conditionally on the null; they are not probabilities that hypotheses are true. Report an effect size and practical threshold because a large sample can make a tiny lift statistically detectable. For repeated tests, compare each p-value with the Bonferroni-adjusted alpha or state another correction explicitly.
