# Behavioral tests for phases/01-math-foundations/04-calculus-for-ml/docs/en.md.
using Test

const CODE = normpath(joinpath(@__DIR__, ".."))
const MAIN = joinpath(CODE, "main.jl")
include(MAIN)

@test isapprox(numerical_derivative(x -> x^2, 2.0), 4.0; atol=1e-5)
@test isapprox(numerical_gradient(p -> p[1]^2 + 3 * p[1] * p[2] + p[2]^2, [1.0, 2.0]), [8.0, 7.0]; atol=1e-5)
@test begin
    x, history = gradient_descent_1d(x -> 2x, 5.0; lr=0.1, steps=20)
    isapprox(x, 5.0 * 0.8^20; atol=1e-10) && length(history) == 20
end
@test begin
    saddle = hessian_2d((x, y) -> x^2 - y^2, 0.0, 0.0)
    values = sort(hessian_eigenvalues(saddle))
    isapprox(values, [-2.0, 2.0]; atol=1e-4)
end
@test isapprox(taylor_approx(exp, exp, exp, 1.0, 0.1; order=1), exp(1.0) * 1.1; atol=1e-12)
@test isapprox(taylor_approx(exp, exp, exp, 1.0, 0.1; order=2), exp(1.0) * (1.0 + 0.1 + 0.005); atol=1e-12)

result = read(Cmd(`$(Base.julia_cmd()) $MAIN`, dir=CODE), String)
@test !isempty(strip(result))
@test sizeof(result) < 1_000_000
