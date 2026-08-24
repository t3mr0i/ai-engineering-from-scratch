# Contract and executable-behavior tests for this lesson demo.
using Test

const CODE = normpath(joinpath(@__DIR__, ".."))
const MAIN = joinpath(CODE, "main.jl")
const SOURCE = read(MAIN, String)

@test !isempty(strip(SOURCE))
@test occursin(r"(?:function|struct|=)", SOURCE)
@test !occursin(r"(?m)^\s*(?:using|import)\s+(?!Random|Statistics|LinearAlgebra|Printf|Test)", SOURCE)
result = read(Cmd(`$(Base.julia_cmd()) $MAIN`, dir=CODE), String)
@test !isempty(strip(result))
@test sizeof(result) < 1_000_000
