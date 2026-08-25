# Behavioral tests for phases/01-math-foundations/06-probability-and-distributions/docs/en.md.
using Test

const CODE = normpath(joinpath(@__DIR__, ".."))
const MAIN = joinpath(CODE, "main.jl")
include(MAIN)

@test isapprox(conditional_probability(4 / 52, 12 / 52), 1 / 3; atol=1e-12)
@test isapprox(bernoulli_pmf(1, 0.7), 0.7) && isapprox(bernoulli_pmf(0, 0.7), 0.3)
@test isapprox(poisson_pmf(0, 3.0), exp(-3); atol=1e-12)
@test begin
    probs = softmax([1000.0, 1001.0])
    all(isfinite, probs) && isapprox(sum(probs), 1.0; atol=1e-12)
end
@test isapprox(cross_entropy_loss([2.0, 1.0, 0.1], 0), -log(softmax([2.0, 1.0, 0.1])[1]); atol=1e-12)
@test begin
    joint = [0.40 0.10; 0.05 0.45]
    mx, my = joint_to_marginals(joint)
    mx == [0.5, 0.5] && my == [0.45, 0.55] && !check_independence(joint, mx, my)
end
@test begin
    rng = MersenneTwister(7)
    first = sample_categorical(rng, [0.2, 0.8], 20)
    rng = MersenneTwister(7)
    first == sample_categorical(rng, [0.2, 0.8], 20)
end

result = read(Cmd(`$(Base.julia_cmd()) $MAIN`, dir=CODE), String)
@test !isempty(strip(result))
@test sizeof(result) < 1_000_000
