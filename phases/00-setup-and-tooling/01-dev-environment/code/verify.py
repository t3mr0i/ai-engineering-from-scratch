# Companion probe for phases/00-setup-and-tooling/01-dev-environment/docs/en.md.
# Checks interpreter and command presence without importing project packages.
# GPU/PyTorch evidence is optional and is never required for the core result.
# Core checks use Python's standard library; the optional GPU branch imports allowlisted torch.
# Keep this comparison probe separate from the canonical Rust entrypoint.

import sys
import shutil

CHECKS = [
    ("Python 3.10+", lambda: sys.version_info >= (3, 10), f"Python {sys.version}"),
    ("Git", lambda: shutil.which("git") is not None, None),
    ("Node.js", lambda: shutil.which("node") is not None, None),
    ("Rust (cargo)", lambda: shutil.which("cargo") is not None, None),
]

OPTIONAL_TOOLS = [
    ("uv", lambda: shutil.which("uv") is not None, None),
    ("pnpm", lambda: shutil.which("pnpm") is not None, None),
    ("Julia", lambda: shutil.which("julia") is not None, None),
]

GPU_CHECKS = [
    ("PyTorch", lambda: __import__("torch"), None),
    (
        "CUDA",
        lambda: __import__("torch").cuda.is_available(),
        lambda: __import__("torch").cuda.get_device_name(0) if __import__("torch").cuda.is_available() else "Not available",
    ),
]


def run_check(name, check_fn, detail_fn=None):
    try:
        result = check_fn()
        if result is False:
            raise Exception("Check returned False")
        detail = ""
        if detail_fn:
            if callable(detail_fn):
                detail = f" ({detail_fn()})"
            else:
                detail = f" ({detail_fn})"
        print(f"  [PASS] {name}{detail}")
        return True
    except Exception:
        print(f"  [FAIL] {name}")
        return False


def main():
    print("\n=== AI Engineering from Scratch — Environment Check ===\n")

    print("Core:")
    passed = sum(run_check(name, fn, detail) for name, fn, detail in CHECKS)
    total = len(CHECKS)

    print("\nGPU (optional):")
    gpu_passed = sum(run_check(name, fn, detail) for name, fn, detail in GPU_CHECKS)
    gpu_total = len(GPU_CHECKS)

    print("\nOptional tools:")
    optional_passed = sum(run_check(name, fn, detail) for name, fn, detail in OPTIONAL_TOOLS)
    optional_total = len(OPTIONAL_TOOLS)

    print(f"\nResult: {passed}/{total} core checks passed", end="")
    if gpu_passed > 0:
        print(f", {gpu_passed}/{gpu_total} GPU checks passed")
    else:
        print(" (no GPU — that's fine, most lessons work on CPU)")
    print(f"Optional tools: {optional_passed}/{optional_total} present")

    if passed == total:
        print("\nYou're ready. Start with Phase 1.\n")
    else:
        print("\nFix the failed checks above, then run this script again.\n")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
