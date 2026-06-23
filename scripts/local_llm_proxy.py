#!/usr/bin/env python3
"""Tiny local CORS-friendly proxy → OpenAI Chat Completions.

JupyterLite/Pyodide cannot call api.openai.com directly because OpenAI does not
set CORS headers for browsers. Run this proxy locally — it accepts the same
OpenAI Chat Completions request shape on localhost (with CORS headers added)
and forwards to api.openai.com using your key from env.

Usage:
    OPENAI_API_KEY=sk-... python3 scripts/local_llm_proxy.py

Then point notebooks at  http://localhost:8765/v1/chat/completions
(no Authorization header — the proxy attaches your key).

stdlib-only — no installs needed. Listens on 127.0.0.1 only.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

UPSTREAM = "https://api.openai.com/v1/chat/completions"
TIMEOUT = 60
PORT = int(os.environ.get("PROXY_PORT", "8765"))


def _cors(handler: BaseHTTPRequestHandler) -> None:
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.send_header("Access-Control-Max-Age", "86400")


class ProxyHandler(BaseHTTPRequestHandler):
    server_version = "lrn-local-llm-proxy/0.1"

    def log_message(self, format: str, *args) -> None:  # quieter logs
        sys.stderr.write(f"  · {self.address_string()} {format % args}\n")

    def do_OPTIONS(self) -> None:  # CORS pre-flight
        self.send_response(204)
        _cors(self)
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            payload = json.dumps({"ok": True, "upstream": UPSTREAM}).encode()
            self.send_response(200)
            _cors(self)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.send_error(404)

    def do_POST(self) -> None:
        if self.path not in ("/v1/chat/completions", "/chat/completions"):
            self.send_error(404, "use /v1/chat/completions")
            return
        n = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(n) if n else b""
        key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not key:
            self._json_response(500, {"error": "OPENAI_API_KEY not set in proxy env"})
            return
        req = urllib.request.Request(
            UPSTREAM,
            method="POST",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                data = r.read()
                self.send_response(200)
                _cors(self)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read() or b'{"error":{"message":"upstream error"}}'
            self.send_response(e.code)
            _cors(self)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:  # noqa: BLE001 — network/timeout etc.
            self._json_response(502, {"error": {"message": f"proxy upstream error: {e!s}"}})

    def _json_response(self, code: int, payload: dict) -> None:
        data = json.dumps(payload).encode()
        self.send_response(code)
        _cors(self)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> int:
    if not os.environ.get("OPENAI_API_KEY", "").strip():
        print("error: set OPENAI_API_KEY in your environment first.", file=sys.stderr)
        print("  example:  OPENAI_API_KEY=sk-... python3 scripts/local_llm_proxy.py", file=sys.stderr)
        return 2
    print(f"LRN local LLM proxy listening on http://localhost:{PORT}")
    print(f"  → forwarding /v1/chat/completions to {UPSTREAM}")
    print(f"  → CORS open for any origin (use only on localhost)")
    print(f"  health check: curl http://localhost:{PORT}/health")
    HTTPServer(("127.0.0.1", PORT), ProxyHandler).serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
