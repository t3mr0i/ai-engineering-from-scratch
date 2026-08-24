#!/usr/bin/env bash
# Verify the supported four-language toolchain and run one bounded smoke lesson
# per language. The script never reads API keys and creates only a temporary
# Rust binary, removed automatically on exit.

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

for command_name in python3 node npx rustc julia; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "missing required command: $command_name" >&2
    exit 1
  fi
done

python3 -c 'import sys; assert sys.version_info >= (3, 12), sys.version'
node -e 'const major=Number(process.versions.node.split(".")[0]); if (major < 20) process.exit(1)'
rustc --version
julia -e 'VERSION >= v"1.10" || error("Julia 1.10+ required")'
npx --no-install tsx --version

unset OPENAI_API_KEY ANTHROPIC_API_KEY HF_TOKEN HUGGINGFACE_TOKEN || true

smoke_dir=$(mktemp -d)
trap 'rm -rf "$smoke_dir"' EXIT

python3 phases/00-setup-and-tooling/06-python-environments/code/main.py >"$smoke_dir/python.out"
npx --no-install tsx phases/11-llm-engineering/01-prompt-engineering/code/main.ts >"$smoke_dir/typescript.out"
rustc --edition 2021 phases/07-transformers-deep-dive/02-self-attention-from-scratch/code/main.rs -o "$smoke_dir/rust-demo"
"$smoke_dir/rust-demo" >"$smoke_dir/rust.out"
julia phases/07-transformers-deep-dive/01-why-transformers/code/main.jl >"$smoke_dir/julia.out"

for language in python typescript rust julia; do
  if [[ ! -s "$smoke_dir/$language.out" ]]; then
    echo "$language smoke lesson produced no output" >&2
    exit 1
  fi
  echo "ok: $language smoke lesson"
done
