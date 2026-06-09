"""Orchestrator — the only trusted server in the IDE backend.

It sits behind Azure Container Apps EasyAuth (Entra ID), so every request
arrives with a verified user identity in the `X-MS-CLIENT-PRINCIPAL-*` headers.
It has two jobs:

  1. POST /run   — allocate/route a per-user sandbox in the Dynamic Sessions
                   pool (identifier = the user's Entra object id) and forward
                   the code to it. Uses the orchestrator's managed identity to
                   get a session token; end users never see that token.

  2. POST /llm/* — proxy LLM calls to the internal OpenAI-compatible gateway,
                   enforcing a per-user rate limit. Sandboxes egress ONLY to
                   this orchestrator for LLM access, so no gateway secret ever
                   sits inside an untrusted session. This is what makes 300
                   concurrent users safe to share one gateway.

Designed for ~300 concurrent users. State here is in-memory (rate-limit
counters); if you run more than one orchestrator replica, move counters to
Redis — see RATE_LIMIT note below.
"""

import base64
import json
import os
import time
from collections import defaultdict, deque

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field

# ── Config (all from env; set by Bicep) ──────────────────────────────────────
SESSION_POOL_ENDPOINT = os.environ.get("SESSION_POOL_ENDPOINT", "").rstrip("/")
# The internal OpenAI-compatible LLM gateway. Sandboxes never see this.
LLM_GATEWAY_URL = os.environ.get("LLM_GATEWAY_URL", "").rstrip("/")
# How the orchestrator authenticates to the gateway. The gateway does its own
# auth + per-user rate-limit, but we still authenticate the orchestrator→gateway
# hop. Wire the real scheme here (see auth_headers_for_gateway()).
LLM_GATEWAY_TOKEN = os.environ.get("LLM_GATEWAY_TOKEN", "")

# Per-user LLM rate limit: max requests per window.
RATE_LIMIT_MAX = int(os.environ.get("RATE_LIMIT_MAX", "60"))
RATE_LIMIT_WINDOW_S = int(os.environ.get("RATE_LIMIT_WINDOW_S", "60"))

# aud for the Dynamic Sessions data-plane token.
SESSION_AUDIENCE = "https://dynamicsessions.io"

app = FastAPI(title="lesson-ide-orchestrator")
_http = httpx.AsyncClient(timeout=130.0)

# user-oid -> deque[timestamps]. In-memory: single-replica assumption.
_rate: dict[str, deque] = defaultdict(deque)


# ── Identity ─────────────────────────────────────────────────────────────────
def current_user(request: Request) -> dict:
    """Read the Entra identity injected by EasyAuth.

    Container Apps built-in auth sets X-MS-CLIENT-PRINCIPAL (base64 JSON) and
    X-MS-CLIENT-PRINCIPAL-ID (the stable object id). We key sandboxes and rate
    limits on the object id.
    """
    oid = request.headers.get("x-ms-client-principal-id")
    name = request.headers.get("x-ms-client-principal-name", "")
    if not oid:
        # Local/dev fallback so the app is runnable without EasyAuth in front.
        principal = request.headers.get("x-ms-client-principal")
        if principal:
            try:
                data = json.loads(base64.b64decode(principal))
                claims = {c["typ"]: c["val"] for c in data.get("claims", [])}
                oid = claims.get(
                    "http://schemas.microsoft.com/identity/claims/objectidentifier"
                )
                name = claims.get(
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", name
                )
            except Exception:
                oid = None
    if not oid:
        if os.environ.get("ALLOW_ANONYMOUS") == "1":
            return {"oid": "local-dev-user", "name": "local"}
        raise HTTPException(401, "no authenticated user")
    return {"oid": oid, "name": name}


def session_identifier(oid: str) -> str:
    # Dynamic Sessions identifier must be 4–128 chars. Entra OIDs are GUIDs.
    return f"u-{oid}"[:128]


# ── Managed-identity token for the session pool ──────────────────────────────
async def session_token() -> str:
    """Get a token for the Dynamic Sessions data plane via the ACA managed
    identity endpoint. The orchestrator's MI must hold the
    'Azure ContainerApps Session Executor' role on the pool.
    """
    endpoint = os.environ.get("IDENTITY_ENDPOINT")
    header = os.environ.get("IDENTITY_HEADER")
    if not endpoint:
        # Local dev: allow a static token so the path is testable.
        tok = os.environ.get("SESSION_TOKEN_DEV")
        if tok:
            return tok
        raise HTTPException(500, "no managed identity available")
    r = await _http.get(
        endpoint,
        params={"resource": SESSION_AUDIENCE, "api-version": "2019-08-01"},
        headers={"X-IDENTITY-HEADER": header or ""},
    )
    r.raise_for_status()
    return r.json()["access_token"]


# ── /run: route code into the user's sandbox ─────────────────────────────────
class RunRequest(BaseModel):
    files: dict[str, str] = Field(default_factory=dict)
    entry: str = "main.py"


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/run")
async def run(request: Request, body: RunRequest) -> Response:
    user = current_user(request)
    if not SESSION_POOL_ENDPOINT:
        raise HTTPException(500, "SESSION_POOL_ENDPOINT not configured")
    token = await session_token()
    ident = session_identifier(user["oid"])

    # The pool forwards <POOL_ENDPOINT>/run?identifier=... to the runner's /run.
    url = f"{SESSION_POOL_ENDPOINT}/run"
    r = await _http.post(
        url,
        params={"identifier": ident},
        headers={"Authorization": f"Bearer {token}"},
        json=body.model_dump(),
    )
    return Response(
        content=r.content,
        status_code=r.status_code,
        media_type=r.headers.get("content-type", "application/json"),
    )


# ── /llm: per-user-rate-limited proxy to the internal gateway ────────────────
def check_rate(oid: str) -> None:
    now = time.monotonic()
    q = _rate[oid]
    while q and now - q[0] > RATE_LIMIT_WINDOW_S:
        q.popleft()
    if len(q) >= RATE_LIMIT_MAX:
        raise HTTPException(429, "rate limit exceeded; slow down")
    q.append(now)


def auth_headers_for_gateway(user: dict) -> dict:
    """How the orchestrator authenticates to the internal LLM gateway.

    ⚠️ WIRE THIS to the real gateway scheme. The gateway is OpenAI-compatible
    and does its own auth + per-user limits. Options, depending on what the
    gateway expects:
      • shared service token:  {"Authorization": f"Bearer {LLM_GATEWAY_TOKEN}"}
      • per-user attribution:  add {"X-User-Id": user["oid"]} so the gateway
                               attributes usage/limits to the real end user
      • managed identity / mTLS: fetch a token for the gateway's app id instead.
    Until confirmed, we send the shared token + user attribution header.
    """
    headers = {}
    if LLM_GATEWAY_TOKEN:
        headers["Authorization"] = f"Bearer {LLM_GATEWAY_TOKEN}"
    headers["X-User-Id"] = user["oid"]
    return headers


@app.api_route("/llm/{path:path}", methods=["GET", "POST"])
async def llm_proxy(path: str, request: Request) -> Response:
    user = current_user(request)
    check_rate(user["oid"])
    if not LLM_GATEWAY_URL:
        raise HTTPException(500, "LLM_GATEWAY_URL not configured")

    url = f"{LLM_GATEWAY_URL}/{path}"
    body = await request.body()
    headers = auth_headers_for_gateway(user)
    # Preserve content-type (JSON for chat/completions).
    if ct := request.headers.get("content-type"):
        headers["content-type"] = ct

    r = await _http.request(
        request.method, url, params=dict(request.query_params),
        content=body, headers=headers,
    )
    return Response(
        content=r.content,
        status_code=r.status_code,
        media_type=r.headers.get("content-type", "application/json"),
    )
