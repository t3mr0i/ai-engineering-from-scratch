# Browser IDE — LLM-dev sandbox on Azure Container Apps

A Scrimba-style in-browser IDE for the training site that runs **real Python
with LLM libraries** in a sandbox, one isolated environment per user. Internal
LHIND users, authenticated via Entra ID. Built for ~300 concurrent users.

## Why this shape

Code execution uses **Azure Container Apps Dynamic Sessions** — Microsoft's
dedicated product for running untrusted/AI-generated code. Each session is
**Hyper-V isolated**, the pool is pre-warmed (millisecond allocation), and
routing by an `identifier` gives **one sandbox per user for free** (no custom
lifecycle code). This is far less to build and operate than anything
Kubernetes-based, and it fits the existing Azure stack.

```
Static Web App (Monaco editor + files + output)   site/ide-prototype.html
   │  POST /run { files, entry }     (carries the EasyAuth session cookie)
   ▼
Orchestrator  (ACA app, behind Entra EasyAuth — the ONLY trusted server)
   │  • validates the user (X-MS-CLIENT-PRINCIPAL-ID = Entra OID)
   │  • calls the session pool with identifier=<OID> + managed-identity token
   │  • also proxies LLM calls with a per-user rate limit
   ▼
Dynamic Session Pool  (Custom Container, Hyper-V isolated per user)
   │  runs lesson code; egress locked by VNet/NSG
   ▼
internal LLM gateway  +  package mirror   — nothing else (default-deny)
```

The end user never sees a session token or a gateway secret — only the
orchestrator (via managed identity) holds the "Session Executor" role.

## Layout

| Path | What |
|---|---|
| `runner/` | The sandbox image: `python:3.12` + openai/anthropic SDK + a thin FastAPI `/run` that runs a file set and returns stdout/stderr. Runs **non-root**. |
| `orchestrator/` | The trusted backend: Entra-aware `/run` proxy to the session pool + per-user-rate-limited `/llm/*` proxy to the internal gateway. |
| `infra/` | Bicep: ACR, VNet+NSG (egress allowlist), ACA environment, the Custom-Container session pool, the orchestrator app + EasyAuth + role assignment. |
| `../site/ide-prototype.html` | The Scrimba-style frontend (Monaco). `runCodeBackend()` talks to the orchestrator; Pyodide is the offline fallback. |

## The `/run` contract (shared by frontend, orchestrator, runner)

```
request:   { "files": { "main.py": "...", "helper.py": "..." }, "entry": "main.py" }
response:  { "ok": true, "output": "...", "exit_code": 0,
             "duration_ms": 7, "timed_out": false, "truncated": false }
```

Local imports between files work (the runner sets cwd + PYTHONPATH). A run is
capped at `RUN_TIMEOUT_S` (default 120s) and output at 256 KB.

## Local test (no Azure needed)

```bash
# Runner alone
cd ide/runner && docker build -t lesson-runner:test .
docker run -d --name r -p 8799:8000 lesson-runner:test
curl -s -X POST localhost:8799/run -H 'Content-Type: application/json' \
  -d '{"files":{"main.py":"print(sum(range(11)))"},"entry":"main.py"}'
# -> {"ok":true,"output":"55\n",...}

# Orchestrator in front of the runner (runner stands in for the pool)
cd ide && docker build -t lesson-orch:test orchestrator
docker network create ide-test
docker run -d --name run --network ide-test lesson-runner:test
docker run -d --name orch --network ide-test -p 8810:8000 \
  -e SESSION_POOL_ENDPOINT=http://run:8000 -e SESSION_TOKEN_DEV=dummy \
  -e ALLOW_ANONYMOUS=1 -e LLM_GATEWAY_URL=http://run:8000 lesson-orch:test
curl -s -X POST localhost:8810/run -H 'Content-Type: application/json' \
  -d '{"files":{"main.py":"print(1)"},"entry":"main.py"}'
```

## Deploy to Azure

1. **Build & push images** to the ACR created by Bicep (or push first to any ACR
   and point the params at it):

   ```bash
   az acr build -r <acr> -t lesson-runner:latest        ide/runner
   az acr build -r <acr> -t lesson-orchestrator:latest  ide/orchestrator
   ```

2. **Register an Entra app** for the orchestrator EasyAuth (redirect URI =
   `https://<orchestrator-fqdn>/.auth/login/aad/callback`). Note its client id.

3. **Fill parameters** — copy `infra/main.parameters.example.json`, set the LLM
   gateway URL + CIDR, the package-mirror CIDR, and the Entra tenant/client ids.

4. **Deploy**:

   ```bash
   az deployment group create -g <rg> \
     -f ide/infra/main.bicep -p @ide/infra/main.parameters.json
   ```

5. **Point the frontend at the backend** — set on the lesson/IDE page:

   ```html
   <script>window.LESSON_IDE_BACKEND_URL = 'https://<orchestrator-fqdn>';</script>
   ```

   Without it, the IDE uses the Pyodide fallback.

## Sizing & cost (≈300 users, light API/RAG workload)

- Sandbox: **0.5 vCPU / 1 GiB**. Pool: `maxConcurrentSessions` 320,
  `readySessionInstances` 20 (warm pool), `cooldownPeriodInSeconds` 600.
- Dynamic Sessions bill at **~0.0258 €/session-hour**. Mixed usage (not all 300
  at once) lands in the low tens of € per active day; a same-time course of 300
  for 3h ≈ **~23 €** for that block. Tune the warm pool: too small → cold-start
  spikes when a course starts together, too big → idle cost.
- Orchestrator: a small always-on ACA app, ~0 € (free grant).
- **Use the NSG for egress, not Azure Firewall** (Firewall is hundreds of €/mo
  fixed; the NSG allowlist here is free).

## Security posture

- Untrusted code runs **non-root**, **Hyper-V isolated**, one sandbox per user.
- Egress is **default-deny**; only the LLM gateway + package mirror are reachable;
  IMDS (169.254.169.254) is explicitly blocked.
- **No managed identity inside sessions** (`managedIdentitySettings: []`) — so
  untrusted code can't mint Entra tokens.
- The orchestrator is the only holder of the session token and gateway auth.

## ⚠️ Open question to resolve before production

**How does the internal LLM gateway authenticate/identify the user?** Session
contents (env vars, files) are readable by the user, so **no per-user gateway
secret may live in a sandbox**. Two clean options, decided by the gateway:

- **Sandbox → gateway directly** (egress allows the gateway): only safe if the
  gateway accepts a shared/sandbox identity and does its own per-user limits by
  some non-secret signal. Simpler, but the gateway can't attribute usage to the
  real end user unless we pass a non-secret user id.
- **Sandbox → orchestrator `/llm/*` → gateway** (recommended at 300 users): the
  orchestrator knows the Entra identity and injects per-user attribution +
  enforces the rate limit centrally. The sandbox egress then targets the
  orchestrator, not the gateway. Wire the real scheme in
  `orchestrator/app.py:auth_headers_for_gateway()`.

The code ships the orchestrator-proxy path with a clearly marked seam; confirm
the gateway's auth model and finalize.

## Other things to verify in a PoC

- That the **NSG egress rules actually bind** to the ephemeral session instances
  (granular egress is documented for Custom Container pools; verify on the
  cluster).
- **Region quota** for Dynamic Sessions in Germany West Central, and data
  residency requirements.
- Warm-pool size against your real concurrency curve.
