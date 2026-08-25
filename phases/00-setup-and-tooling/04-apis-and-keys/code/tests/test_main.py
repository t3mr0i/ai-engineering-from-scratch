# Behavioral tests for the stdlib-first request builder in docs/en.md.
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
sys.path.insert(0, str(CODE))

from first_api_call import (  # noqa: E402
    API_URL,
    build_headers,
    build_request,
    call_raw_http,
    mock_response,
)


class FakeResponse:
    def __init__(self, payload: dict[str, object]) -> None:
        self.payload = payload

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return json.dumps(self.payload).encode("utf-8")


class RequestBuilderTests(unittest.TestCase):
    def test_default_request_has_messages_contract(self) -> None:
        request = build_request()
        self.assertEqual(request["model"], "lesson-fixture")
        self.assertEqual(request["max_tokens"], 64)
        self.assertEqual(request["messages"], [{"role": "user", "content": "What is a neural network in one sentence?"}])

    def test_request_rejects_empty_prompt_and_nonpositive_limit(self) -> None:
        with self.assertRaises(ValueError):
            build_request("   ")
        with self.assertRaises(ValueError):
            build_request(max_tokens=0)

    def test_headers_require_key_and_include_api_version(self) -> None:
        with self.assertRaises(ValueError):
            build_headers("")
        headers = build_headers("secret")
        self.assertEqual(headers["x-api-key"], "secret")
        self.assertEqual(headers["anthropic-version"], "2023-06-01")
        self.assertEqual(headers["Content-Type"], "application/json")

    def test_mock_response_is_deterministic_and_has_usage(self) -> None:
        response = mock_response(build_request())
        self.assertEqual(response["usage"], {"input_tokens": 12, "output_tokens": 17})
        self.assertIn("content", response)

    def test_raw_http_builder_can_be_checked_without_network(self) -> None:
        captured: dict[str, object] = {}

        def opener(request: object, timeout: int) -> FakeResponse:
            captured["request"] = request
            captured["timeout"] = timeout
            return FakeResponse({"content": [{"text": "ok"}], "usage": {}})

        response = call_raw_http("secret", build_request(), opener=opener)
        request = captured["request"]
        self.assertEqual(response["content"], [{"text": "ok"}])
        self.assertEqual(captured["timeout"], 10)
        self.assertEqual(request.full_url, API_URL)  # type: ignore[union-attr]
        self.assertEqual(json.loads(request.data), build_request())  # type: ignore[union-attr]

    def test_canonical_demo_defaults_to_mock_and_exits_zero(self) -> None:
        env = {key: value for key, value in os.environ.items() if key not in {"ANTHROPIC_API_KEY", "ANTHROPIC_LIVE"}}
        result = subprocess.run(
            [sys.executable, MAIN.name],
            cwd=CODE,
            env=env,
            text=True,
            capture_output=True,
            check=False,
            timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("mode: MOCK (no network", result.stdout)
        self.assertIn("lesson-fixture", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
