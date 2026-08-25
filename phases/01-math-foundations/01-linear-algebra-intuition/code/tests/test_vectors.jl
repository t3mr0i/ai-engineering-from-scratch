# Behavioral tests for phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md.
# The Julia lesson is a script, so these tests verify its seeded observable contract.
# They intentionally use only Julia's Test and standard process APIs.
# Run from this directory with: julia tests/test_vectors.jl

using Test

const CODE = normpath(joinpath(@__DIR__, ".."))
const MAIN = joinpath(CODE, "main.jl")
const OUTPUT = read(Cmd(`$(Base.julia_cmd()) $MAIN`, dir=CODE), String)

@test occursin("a · b = 32.0", OUTPUT)
@test occursin("Rotate [3.0, 1.0] by 90° → [-1.0, 3.0]", OUTPUT)
@test occursin("Input (3D):", OUTPUT)
@test occursin("Output (2D):", OUTPUT)
@test occursin("cosine_similarity(a, b)", OUTPUT)
@test sizeof(OUTPUT) < 100_000
