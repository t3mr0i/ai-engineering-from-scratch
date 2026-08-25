"""NumPy-first video tokens, divided-attention costs, and a linear world model."""

# Build-It implementation for phases/04-computer-vision/28-world-models-video-diffusion.
# It exposes temporal/spatial patch contracts and a deterministic state rollout offline.
# A video diffusion checkpoint is an optional Use-It backend, not downloaded here.
# Run from this directory with: python3 main.py

from __future__ import annotations

import numpy as np


def _finite(value: object, *, name: str, ndim: int | None = None) -> np.ndarray:
    array = np.asarray(value, dtype=np.float64)
    if ndim is not None and array.ndim != ndim:
        raise ValueError(f"{name} must have {ndim} dimensions")
    if array.size == 0 or not np.all(np.isfinite(array)):
        raise ValueError(f"{name} must be non-empty and finite")
    return array


def _positive_int(value: object, *, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _patch_sizes(patch_t: int, patch_h: int, patch_w: int) -> tuple[int, int, int]:
    return tuple(_positive_int(value, name=name) for value, name in ((patch_t, "patch_t"), (patch_h, "patch_h"), (patch_w, "patch_w")))


def patchify_video(video: object, patch_t: int = 2, patch_h: int = 2, patch_w: int = 2) -> tuple[np.ndarray, tuple[int, int, int]]:
    """Convert ``(N,C,T,H,W)`` video into patch tokens and return its token grid."""
    array = _finite(video, name="video", ndim=5)
    patch_t, patch_h, patch_w = _patch_sizes(patch_t, patch_h, patch_w)
    n, channels, frames, height, width = array.shape
    if frames % patch_t or height % patch_h or width % patch_w:
        raise ValueError("video axes must be divisible by their patch sizes")
    grid = (frames // patch_t, height // patch_h, width // patch_w)
    tokens = array.reshape(n, channels, grid[0], patch_t, grid[1], patch_h, grid[2], patch_w)
    tokens = tokens.transpose(0, 2, 4, 6, 1, 3, 5, 7)
    return tokens.reshape(n, grid[0] * grid[1] * grid[2], channels * patch_t * patch_h * patch_w), grid


def unpatchify_video(tokens: object, video_shape: tuple[int, int, int, int, int], patch_t: int = 2, patch_h: int = 2, patch_w: int = 2) -> np.ndarray:
    """Invert :func:`patchify_video` for a known ``(N,C,T,H,W)`` shape."""
    token_array = _finite(tokens, name="tokens", ndim=3)
    if not isinstance(video_shape, tuple) or len(video_shape) != 5 or any(isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0 for value in video_shape):
        raise ValueError("video_shape must contain five positive integer dimensions")
    patch_t, patch_h, patch_w = _patch_sizes(patch_t, patch_h, patch_w)
    n, channels, frames, height, width = video_shape
    if frames % patch_t or height % patch_h or width % patch_w:
        raise ValueError("video axes must be divisible by their patch sizes")
    grid = (frames // patch_t, height // patch_h, width // patch_w)
    expected = (n, grid[0] * grid[1] * grid[2], channels * patch_t * patch_h * patch_w)
    if token_array.shape != expected:
        raise ValueError(f"tokens must have shape {expected}")
    blocks = token_array.reshape(n, grid[0], grid[1], grid[2], channels, patch_t, patch_h, patch_w)
    return blocks.transpose(0, 4, 1, 5, 2, 6, 3, 7).reshape(video_shape)


def count_tokens(T: int, H: int, W: int, p_t: int = 2, p_h: int = 8, p_w: int = 8) -> int:
    T, H, W = (_positive_int(value, name=name) for value, name in ((T, "T"), (H, "H"), (W, "W")))
    p_t, p_h, p_w = _patch_sizes(p_t, p_h, p_w)
    if T % p_t or H % p_h or W % p_w:
        raise ValueError("dimensions must be divisible by patch sizes")
    return (T // p_t) * (H // p_h) * (W // p_w)


def divided_attention_cost(T: int, H: int, W: int, p_t: int = 2, p_h: int = 8, p_w: int = 8) -> tuple[int, int, int]:
    """Return ``(tokens, joint_pairs, divided_pairs)`` for temporal+spatial attention."""
    tokens = count_tokens(T, H, W, p_t, p_h, p_w)
    temporal, spatial = T // p_t, (H // p_h) * (W // p_w)
    joint = tokens * tokens
    divided = spatial * temporal * temporal + temporal * spatial * spatial
    return tokens, joint, divided


def rollout_linear_world_model(initial_state: object, actions: object, transition: object | None = None, control: object | None = None) -> np.ndarray:
    """Roll ``state[t+1] = A state[t] + B action[t]`` and include the initial state."""
    state = _finite(initial_state, name="initial_state", ndim=1)
    action_array = _finite(actions, name="actions", ndim=2)
    if action_array.shape[0] == 0:
        raise ValueError("actions must contain at least one step")
    dimension = state.shape[0]
    action_width = action_array.shape[1]
    if transition is None:
        matrix_a = np.eye(dimension)
    else:
        matrix_a = _finite(transition, name="transition", ndim=2)
        if matrix_a.shape != (dimension, dimension):
            raise ValueError("transition must be square with state width")
    if control is None:
        matrix_b = np.zeros((dimension, action_width), dtype=np.float64)
        width = min(dimension, action_width)
        matrix_b[:width, :width] = np.eye(width)
    else:
        matrix_b = _finite(control, name="control", ndim=2)
        if matrix_b.shape != (dimension, action_width):
            raise ValueError("control must map action width to state width")
    states = np.empty((action_array.shape[0] + 1, dimension), dtype=np.float64)
    states[0] = state
    for index, action in enumerate(action_array):
        with np.errstate(over="ignore", invalid="ignore"):
            states[index + 1] = matrix_a @ states[index] + matrix_b @ action
        if not np.all(np.isfinite(states[index + 1])):
            raise ValueError("world-model rollout became non-finite")
    return states


def video_consistency_error(predicted: object, target: object) -> float:
    prediction = _finite(predicted, name="predicted", ndim=5)
    truth = _finite(target, name="target", ndim=5)
    if prediction.shape != truth.shape:
        raise ValueError("predicted and target videos must have the same shape")
    result = float(np.mean((prediction - truth) ** 2))
    if not np.isfinite(result):
        raise ValueError("video error was not finite")
    return result


def main() -> None:
    video = np.arange(1 * 2 * 4 * 8 * 8, dtype=np.float64).reshape(1, 2, 4, 8, 8) / 100.0
    tokens, grid = patchify_video(video, 2, 2, 2)
    restored = unpatchify_video(tokens, video.shape, 2, 2, 2)
    token_count, joint, divided = divided_attention_cost(16, 64, 64, 2, 8, 8)
    states = rollout_linear_world_model(np.array([0.0, 0.0]), np.array(((1.0, 0.0), (0.0, 2.0), (1.0, -1.0))))
    print("[video world-model Build-It]")
    print(f"video={video.shape} token_grid={grid} tokens={tokens.shape} roundtrip={np.max(np.abs(restored-video)):.1e}")
    print(f"attention tokens={token_count} joint_pairs={joint} divided_pairs={divided}")
    print(f"linear rollout states={states.tolist()} consistency={video_consistency_error(restored, video):.1e}")


if __name__ == "__main__":
    main()
