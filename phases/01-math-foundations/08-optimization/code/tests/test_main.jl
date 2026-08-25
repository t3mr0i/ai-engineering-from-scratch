# Behavioral tests for phases/01-math-foundations/08-optimization/docs/en.md.
using Test

const CODE = normpath(joinpath(@__DIR__, ".."))
const MAIN = joinpath(CODE, "main.jl")
include(MAIN)

@test rosenbrock([1.0, 1.0]) == 0.0
@test isapprox(rosenbrock_grad([1.0, 1.0]), [0.0, 0.0]; atol=1e-12)
@test step!(GradientDescent(lr=0.1), [3.0], [6.0]) == [2.4]
@test begin
    opt = SGDMomentum(lr=0.1, momentum=0.9)
    first = step!(opt, [3.0], [6.0])
    second = step!(opt, first, [6.0])
    first == [2.4] && second == [1.26]
end
@test begin
    opt = Adam(lr=0.1)
    result = step!(opt, [1.0], [2.0])
    opt.t == 1 && isapprox(result[1], 0.9; atol=1e-7)
end
@test begin
    history = optimize(GradientDescent(lr=0.0005), rosenbrock, rosenbrock_grad, [-1.0, 1.0]; steps=10)
    length(history) == 11 && all(all(isfinite, p) for p in history)
end

result = read(Cmd(`$(Base.julia_cmd()) $MAIN`, dir=CODE), String)
@test !isempty(strip(result))
@test sizeof(result) < 1_000_000
