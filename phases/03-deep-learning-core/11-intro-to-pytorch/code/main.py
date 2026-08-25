# Entry point for phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md.
# Re-exports the optional adapter while keeping import and execution safe without PyTorch.
# The wrapper loads the historical pytorch_intro.py by path; it never installs dependencies.
# Run from this directory with: python3 main.py

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


_SOURCE = Path(__file__).with_name("pytorch_intro.py")
_SPEC = spec_from_file_location("lesson11_pytorch_impl", _SOURCE)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError("cannot load pytorch_intro.py")
_IMPL = module_from_spec(_SPEC)
_SPEC.loader.exec_module(_IMPL)

torch_available = _IMPL.torch_available
device_name = _IMPL.device_name
build_model = _IMPL.build_model
fixture = _IMPL.fixture
train_demo = _IMPL.train_demo


def main() -> int:
    return _IMPL.main()


if __name__ == "__main__":
    raise SystemExit(main())
