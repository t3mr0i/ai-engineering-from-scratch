# Linear Regression

> Fit a line twice: once by repeated gradients and once by solving the least-squares geometry directly.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 01 linear algebra, calculus, and optimization
**Time:** ~65 minutes

## Learning Objectives

- Derive the mean-squared-error gradients for a line w*x+b.
- Compare iterative gradient descent with the scalar normal equation.
- Standardize multiple features without changing row order.
- Explain why Ridge adds an L2 penalty to the weights but not the intercept.
- Check a fit with cost history and R-squared rather than training output alone.

## The model

For a row x, the scratch model predicts w*x+b. LinearRegression.compute_gradients returns the derivatives of mean squared error, and fit subtracts learning_rate times each gradient for the requested number of epochs. LinearRegressionNormal computes the scalar closed form: the slope is covariance divided by the variance of x, and the intercept is mean(y)-w*mean(x). The Julia entry point implements the same fixture with Julia standard libraries; the Python path is the easiest route for the tests.

MultipleLinearRegression generalizes the dot product to rows such as [size, bedrooms, age]. standardize returns scaled rows plus the training means and standard deviations. RidgeRegression adds alpha*sum(w squared) to the objective and its gradient; the bias is left unpenalized. PolynomialRegression creates [x, x squared, ...] features, so scaling the input before fitting matters for high degrees.

## Build It

Run python3 main.py from code/. The seeded fixture contains 80 noisy samples from approximately y=3x+7. The output reports gradient and normal-equation coefficients, an R-squared value, the means of two standardized features, and Ridge weights. Re-run with the same seed before comparing a change in learning rate.

The four-row fixture X=[0,1,2,3], y=[7,10,13,16] has exact slope 3 and intercept 7. Fit it with LinearRegression and LinearRegressionNormal, then compare both pairs of parameters.

## Use It

Use the normal equation for a small, static scalar feature when a direct solution is convenient. Use gradient descent when the representation is larger or the data arrives in repeated batches. For multiple features, call standardize on the training rows and reuse its returned means and standard deviations for validation data. A zero-variance column becomes zero after scaling; it must not create a division-by-zero failure.

## Ship It

outputs/skill-regression.md is a handoff template for recording the target definition, split, final MSE/R-squared, and coefficient interpretation. Ship the values with the seed and feature-scaling statistics. A high training R-squared alone is not evidence that a noisy relation will generalize.

## Exercises

1. On the four-row fixture, verify that both fits recover w=3 and b=7 within optimizer tolerance and that the gradient cost falls from its first recorded value.
2. Standardize [[1,10],[2,20],[3,30]]; report means [2,20] and explain why the transformed columns have mean zero.
3. Fit Ridge and ordinary multiple regression on the same standardized rows. Compare the weight norm and identify the L2 term responsible for the difference.

## Reference Solution

The normal fit is exactly w=3, b=7, R-squared is 1 on the noiseless fixture, and gradient descent approaches those values while its cost_history decreases. Standardization returns the two stated means and nonzero scale for each column. Ridge's weights are smaller on the same data because only the weight gradient receives 2*alpha*w; the intercept is not shrunk.
