"""Pyodide-safe LLM wrapper for LRN notebooks (OpenAI-compatible).

Single source of truth for LLM-Calls aus den generierten Lesson-Notebooks. Wird
inline in jedes Notebook eingebettet (siehe scripts/generate_notebooks.py +
phases/<phase>/<lesson>/code/notebook.py).

Default-Endpoint ist der same-origin LLM-Proxy des gated Servers
(server/server.js, POST /api/llm/chat/completions), der den Bifrost-Gateway-
Key server-seitig injiziert — kein Key läuft mehr im Browser. Du kannst durch
das Setzen einer anderen API_BASE jeden OpenAI-kompatiblen Provider nutzen.
Modell-IDs sind im Format "provider/model" (z.B. "azure/gpt-5.4"). Die
Virtual-Key-Policy des Gateways erlaubt aktuell nur die GPT-5.4-Familie
(azure/gpt-5.4, azure/gpt-5.4-mini, azure/gpt-5.4-nano) — andere Modelle
(z.B. gpt-4o) geben 403 model_blocked zurück.

Usage in a notebook:
    response = await lrn_llm.call([{"role": "user", "content": "Sag OK"}])
    print(lrn_llm.text(response))  # → "OK"

    # Health-Check
    result = await lrn_llm.ping()
    print(result)  # → {"ok": True, "model": "gpt-5.4-2026-03-05", "tokens": ...}
"""
import json
import os

try:
    # Only available in Pyodide (the JupyterLite kernel).
    from pyodide.http import pyfetch
    _IN_PYODIDE = True
except ImportError:
    # Local CPython fallback for unit testing the wrapper directly.
    import urllib.request
    _IN_PYODIDE = False


API_BASE = "/api/llm"   # same-origin proxy; server injects the gateway key
DEFAULT_MODEL = "azure/gpt-5.4"   # provider/model-Format; auch verfügbar: azure/gpt-5.4-mini, azure/gpt-5.4-nano
API_KEY = ""   # only needed if API_BASE is pointed at a different provider


def _key():
    # Default path (API_BASE unchanged) needs no key — the server-side proxy
    # injects it. Only relevant if a notebook overrides API_BASE directly.
    return (API_KEY or os.environ.get("LRN_LLM_API_KEY", "")).strip()


def _headers():
    headers = {"content-type": "application/json"}
    key = _key()
    if key:
        headers["Authorization"] = f"Bearer {key}"
    return headers


async def call(messages, *, system=None, tools=None, max_tokens=1024, model=DEFAULT_MODEL):
    """Single LLM API call (OpenAI Chat Completions format). Returns parsed JSON."""
    if system is not None:
        messages = [{"role": "system", "content": system}] + list(messages)
    payload = {"model": model, "max_tokens": max_tokens, "messages": messages}
    if tools is not None:
        payload["tools"] = tools

    url = API_BASE.rstrip("/") + "/chat/completions"

    if _IN_PYODIDE:
        response = await pyfetch(url, method="POST", headers=_headers(), body=json.dumps(payload))
        data = await response.json()
    else:
        req = urllib.request.Request(
            url,
            method="POST",
            headers=_headers(),
            data=json.dumps(payload).encode("utf-8"),
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read())

    if "error" in data:
        raise RuntimeError(f"LLM API error: {data['error']}")
    return data


def text(response):
    """Extract the first message text from a Chat-Completions response."""
    choices = (response or {}).get("choices") or []
    if not choices:
        return ""
    return (choices[0].get("message", {}) or {}).get("content", "") or ""


def usage(response):
    """Return token-usage summary."""
    u = (response or {}).get("usage", {}) or {}
    return {
        "input": u.get("prompt_tokens", 0),
        "output": u.get("completion_tokens", 0),
        "model": (response or {}).get("model", "?"),
    }


async def ping():
    """Smallest possible call — for the Step-1 sanity check in every notebook."""
    response = await call(
        [{"role": "user", "content": "Reply with exactly the word OK and nothing else."}],
        max_tokens=10,
    )
    return {
        "ok": text(response).strip().upper().startswith("OK"),
        "model": response.get("model"),
        "tokens": usage(response),
    }
