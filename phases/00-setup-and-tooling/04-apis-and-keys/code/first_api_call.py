# Lesson implementation for phases/00-setup-and-tooling/04-apis-and-keys/docs/en.md.
# Builds and validates a Messages-shaped request with Python's standard library.
# The default fixture is deterministic and never opens a network connection.
# Raw HTTP is available only with ANTHROPIC_LIVE=1 and ANTHROPIC_API_KEY set.
# Reference: https://docs.anthropic.com/en/api/messages; run with python3 main.py.

from __future__ import annotations

import json
import os
import urllib.request
from collections.abc import Callable, Mapping


API_URL = "https://api.anthropic.com/v1/messages"
API_VERSION = "2023-06-01"
DEFAULT_MODEL = "lesson-fixture"
DEFAULT_PROMPT = "What is a neural network in one sentence?"
DEFAULT_MAX_TOKENS = 64

MOCK_RESPONSE: dict[str, object] = {
    "content": [
        {
            "type": "text",
            "text": "A neural network learns patterns by adjusting weights against a loss signal.",
        }
    ],
    "usage": {"input_tokens": 12, "output_tokens": 17},
}


def build_request(
    prompt: str = DEFAULT_PROMPT,
    *,
    model: str = DEFAULT_MODEL,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> dict[str, object]:
    """Return a small, provider-shaped request without sending it."""

    if not prompt.strip():
        raise ValueError("prompt must not be empty")
    if not model.strip():
        raise ValueError("model must not be empty")
    if max_tokens <= 0:
        raise ValueError("max_tokens must be positive")
    return {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }


def build_headers(api_key: str, *, api_version: str = API_VERSION) -> dict[str, str]:
    """Build live-request headers while refusing to handle an absent secret."""

    if not api_key:
        raise ValueError("api_key is required for a live request")
    return {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": api_version,
    }


def mock_response(request: Mapping[str, object]) -> dict[str, object]:
    """Return a copy of the deterministic response fixture."""

    del request
    return json.loads(json.dumps(MOCK_RESPONSE))


def call_raw_http(
    api_key: str,
    request: Mapping[str, object],
    *,
    opener: Callable[..., object] = urllib.request.urlopen,
) -> dict[str, object]:
    """Send one explicitly requested HTTP call; tests can inject an opener."""

    model = request.get("model")
    if not isinstance(model, str) or not model.strip() or model == DEFAULT_MODEL:
        raise ValueError("a real ANTHROPIC_MODEL is required for a live request")
    body = json.dumps(request).encode("utf-8")
    http_request = urllib.request.Request(
        API_URL,
        data=body,
        headers=build_headers(api_key),
        method="POST",
    )
    with opener(http_request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def print_response(response: Mapping[str, object]) -> None:
    content = response["content"]
    usage = response["usage"]
    text = content[0]["text"]  # type: ignore[index]
    input_tokens = usage["input_tokens"]  # type: ignore[index]
    output_tokens = usage["output_tokens"]  # type: ignore[index]
    print(f"response: {text}")
    print(f"tokens: {input_tokens} in, {output_tokens} out")


def main() -> int:
    print("=== API Request Lab ===")

    live_requested = os.environ.get("ANTHROPIC_LIVE") == "1"
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    live_model = os.environ.get("ANTHROPIC_MODEL", "").strip()
    if not live_requested:
        request = build_request()
        print(f"request: {json.dumps(request, sort_keys=True)}")
        print("mode: MOCK (no network; set ANTHROPIC_LIVE=1 to opt in)")
        print_response(mock_response(request))
        return 0
    missing = []
    if not api_key:
        missing.append("ANTHROPIC_API_KEY")
    if not live_model:
        missing.append("ANTHROPIC_MODEL")
    if missing or live_model == DEFAULT_MODEL:
        request = build_request()
        print(f"request: {json.dumps(request, sort_keys=True)}")
        reason = (
            f"missing {', '.join(missing)}"
            if missing
            else "ANTHROPIC_MODEL must name a provider model, not lesson-fixture"
        )
        print(f"mode: MOCK (live mode requested, but {reason})")
        print_response(mock_response(request))
        return 0

    request = build_request(model=live_model)
    print(f"request: {json.dumps(request, sort_keys=True)}")
    print("mode: LIVE (explicit opt-in)")
    try:
        print_response(call_raw_http(api_key, request))
    except Exception as error:  # network/provider errors are reported, not hidden
        print(f"live request failed: {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
