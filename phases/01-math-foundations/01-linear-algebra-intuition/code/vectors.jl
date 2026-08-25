# Julia implementation for phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md.
# Demonstrates vector arithmetic, normalization, rotation, and a dense-layer shape.
# Uses only Julia's LinearAlgebra and Random standard libraries; the seed fixes the layer fixture.
# The file is included by the canonical main.jl entry point.
# Run from this directory with: julia main.jl

using LinearAlgebra
using Random
Random.seed!(42)

println("=== Vectors ===")
a = [1.0, 2.0, 3.0]
b = [4.0, 5.0, 6.0]

println("a = ", a)
println("b = ", b)
println("a + b = ", a + b)
println("a - b = ", a - b)
println("a * 3 = ", a * 3)
println("a · b = ", a ⋅ b)
println("|a| = ", norm(a))
println("â = ", normalize(a))

cosine = (a ⋅ b) / (norm(a) * norm(b))
println("cosine_similarity(a, b) = ", round(cosine, digits=4))

println("\n=== Matrices ===")
rotation_90 = [0 -1; 1 0]
point = [3.0, 1.0]
rotated = rotation_90 * point
println("Rotate ", point, " by 90° → ", rotated)

println("\n=== Neural Network Layer ===")
W = randn(2, 3) * 0.1
x = [1.0, 0.5, -0.3]
output = W * x
println("Input (3D):  ", x)
println("Output (2D): ", output)
println("^ This is literally what a neural network layer does.")
