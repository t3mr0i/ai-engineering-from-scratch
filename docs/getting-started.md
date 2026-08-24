# Reproducible local environment

The supported full-curriculum environment is the checked-in dev container. It installs Python 3.12, Node.js 20, stable Rust with the 2021 edition, and Julia LTS. Python runtime packages are pinned in [`requirements.txt`](../requirements.txt); `tsx` is installed only as TypeScript tooling.

## Fastest path

1. Clone the repository and open it in a client that supports Dev Containers or GitHub Codespaces.
2. Choose **Reopen in Container**. The first build downloads the pinned Python stack, including PyTorch, so allow roughly 32 GB of storage.
3. Wait for `scripts/bootstrap.sh`. Success ends with four lines beginning with `ok:`—one each for Python, TypeScript, Rust, and Julia.

To verify an existing local installation without a container, install the pinned packages and TypeScript runner, then execute `bash scripts/bootstrap.sh`.

## Supported runtime matrix

| Runtime | Supported version | Canonical lesson command |
|---|---:|---|
| Python | 3.12+ | `python3 code/main.py` |
| Node.js / TypeScript | Node 20+, `tsx` 4.23.12 | `npx --no-install tsx code/main.ts` |
| Rust | stable, edition 2021 | `rustc --edition 2021 code/main.rs -o /tmp/lesson && /tmp/lesson` |
| Julia | 1.10+ / LTS | `julia code/main.jl` |

Run commands from the lesson directory unless a document explicitly says otherwise. A canonical demo prints a bounded result and exits with status 0. Tests use the language's standard runner: `python3 -m unittest discover tests -v`, `npx --no-install tsx --test tests`, `rustc --edition 2021 --test tests/test_main.rs`, or `julia tests/test_main.jl`.

## API keys and offline behavior

Canonical demos must terminate without credentials. Lessons that compare a hosted API either use a deterministic local simulation or print a clear skip message when the relevant key is absent. Never commit keys; provide them only through your shell or secret store.

The browser lesson runner is a smaller execution path: it uses Pyodide for compatible Python snippets and cannot provide every native wheel, TypeScript, Rust, or Julia. Use the dev container for full fidelity.

## Troubleshooting

- **`tsx` not found:** run `npm install --global tsx@4.23.12`, then repeat the bootstrap.
- **Python wheel unavailable:** confirm Python 3.12 and install only from `requirements.txt`; adding an unlisted framework violates the curriculum dependency policy.
- **Julia missing:** use the dev container. Julia is required there, not treated as an optional smoke check.
- **GPU unavailable:** most demos fall back to CPU. GPU-specific setup lessons report the missing capability instead of hanging.
- **A demo waits for input:** report it as a contract bug. The default `main.*` command must be self-terminating; persistent servers belong behind an explicit `--serve` flag.
