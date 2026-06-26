"""Pyodide-safe LLM wrapper for LRN notebooks (OpenAI-compatible).

Single source of truth for LLM-Calls aus den generierten Lesson-Notebooks. Wird
inline in jedes Notebook eingebettet (siehe scripts/generate_notebooks.py +
phases/<phase>/<lesson>/code/notebook.py).

Default-Endpoint ist das LHIND-AI-Gateway (Bifrost, gateway.lhind.ai,
CORS-friendly). Du kannst durch das Setzen einer anderen API_BASE jeden
OpenAI-kompatiblen Provider nutzen. Modell-IDs sind im Format "provider/model"
(z.B. "azure/gpt-4o").

Usage in a notebook:
    lrn_llm.API_KEY = "sk-xf-..."  # LHIND-Gateway-Key (optional, je nach Netz)
    response = await lrn_llm.call([{"role": "user", "content": "Sag OK"}])
    print(lrn_llm.text(response))  # → "OK"

    # Health-Check
    result = await lrn_llm.ping()
    print(result)  # → {"ok": True, "model": "gpt-4o-2024-11-20", "tokens": ...}
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


API_BASE = "https://gateway.lhind.ai/v1"
DEFAULT_MODEL = "azure/gpt-4o"   # provider/model-Format; verfügbar u.a. azure/gpt-4.1-mini
API_KEY = ""   # set by the notebook's Step-0a cell, or via os.environ below


def _injected_key():
    # The lesson site postMessages the central key into the JupyterLite iframe,
    # where lrn-key-bridge.js parks it on window.__LRN_LLM_KEY__. In Pyodide we
    # read that via the `js` module. Outside Pyodide (local tests) there's no
    # window → return "".
    try:
        import js  # only present in the Pyodide kernel
        return (getattr(js, "__LRN_LLM_KEY__", "") or "").strip()
    except Exception:
        return ""


def _key():
    # Das LHIND-Gateway authentifiziert primär netz-/WAF-basiert; ein Key ist
    # optional (für Attribution). Leerer Key → kein Authorization-Header.
    # Priorität: explizit gesetzter API_KEY → vom Lesson-Site injizierter Key →
    # os.environ → "".
    return (API_KEY or _injected_key() or os.environ.get("LRN_LLM_API_KEY", "")).strip()


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
