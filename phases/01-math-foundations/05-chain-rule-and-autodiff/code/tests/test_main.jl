# Behavioral tests for phases/01-math-foundations/05-chain-rule-and-autodiff/docs/en.md.
using Test

const CODE = normpath(joinpath(@__DIR__, ".."))
const MAIN = joinpath(CODE, "main.jl")
include(MAIN)

@test begin
    x1, x2 = Value(2.0), Value(3.0)
    y = relu(x1 * x2 + 1.0)
    backward!(y)
    y.data == 7.0 && isapprox(x1.grad, 3.0) && isapprox(x2.grad, 2.0)
end
@test begin
    x = Value(2.0)
    y = x ^ 3
    backward!(y)
    y.data == 8.0 && isapprox(x.grad, 12.0)
end
@test begin
    x = Value(-1.0)
    y = relu(x)
    backward!(y)
    y.data == 0.0 && x.grad == 0.0
end
@test begin
    ad, numeric, difference = gradient_check(x -> x ^ 3 + 2 * x + 1.0, 0.5)
    isapprox(ad, numeric; atol=1e-5) && difference < 1e-5
end
@test begin
    x = Value(3.0)
    y = _log(x)
    backward!(y)
    isapprox(y.data, log(3.0); atol=1e-10) && isapprox(x.grad, 1 / 3; atol=1e-5)
end
@test begin
    x = Value(2.0)
    y = _exp(x)
    backward!(y)
    isapprox(x.grad, exp(2.0); atol=1e-5)
end

result = read(Cmd(`$(Base.julia_cmd()) $MAIN`, dir=CODE), String)
@test !isempty(strip(result))
@test sizeof(result) < 1_000_000
