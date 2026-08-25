# Guided demo: Linear Regression

This short path checks the values that matter in the local Python implementation.

## Run

From the lesson code directory:

    python3 main.py

The seeded command prints the gradient fit, the scalar normal-equation fit, the R-squared value, and the standardized means used by Ridge. It exits with status 0 without network access.

## Probe

Use X=[0,1,2,3] and y=[7,10,13,16]. Fit LinearRegression for 800 epochs and LinearRegressionNormal once. The expected normal-equation result is w=3 and b=7. The gradient model should approach those values and its cost_history should decrease.

Then call standardize on [[1,10],[2,20],[3,30]]. The expected means are [2,20]; the transformed columns have mean zero. A zero-variance column is represented by zeros, so no division-by-zero exception is expected.

## Exit ticket

Record the two fitted parameter pairs, the first and last cost values, and the scaling means. State which observation is a local fixture and which contract is a reusable input check.
