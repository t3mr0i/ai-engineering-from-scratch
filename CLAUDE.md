# CLAUDE.md — Deploy & Infrastructure

The gated site now runs on OpenShift (`trainingcamp-prod` namespace, cluster
`ocp03`) — see §1b for the live deploy. §1 below is kept as historical
reference for the retired Azure deployment.

---

## 1. Gated site on Azure (decommissioned)

Formerly hosted as App Service `ase-site-gated` (plan `ase-site-plan`,
resource group `rg-ase-webpage`, subscription `338558e0-0b85-4d45-97f8-392312662da6`).
**Both the App Service and its plan have been deleted** (the plan went with
it automatically — it was the last app on that plan, `az webapp delete`
without `--keep-empty-plan` takes the plan too). `https://ase-site-gated.azurewebsites.net`
no longer resolves to anything. The `deploy_azure` job in `.gitlab-ci.yml`
was removed for the same reason — it would otherwise fail on every push to
`main` trying to deploy to a resource that no longer exists.

Other resources in `rg-ase-webpage` (`swa-ase-webpage`, `swa-flightdeck`,
`flightdeckdl`) are unrelated and were left untouched.

The hosting model (Node server in `server/`, zero npm deps, HMAC passcode
gate on every request) is unchanged — it just runs as a container on
OpenShift now instead of an App Service zip. See §1b for the current setup,
secrets, and deploy steps.

---

## 1b. Gated site on OpenShift (`trainingcamp-prod`, migration target)

Same app as §1 — same `server/` (zero npm deps) and `site/`, just packaged as
a container instead of an App Service zip. Manifests live in `openshift/`.

- **Cluster:** `ocp03` — console at
  `https://console-openshift-console.apps.ocp03.cloud.lhind.app.lufthansa.com`.
  Different cluster than the ArgoCD instance in `~/.claude/ARGOCD-MCP.md`
  (that's `ocp04`, unrelated to this app) — deploy here is plain `oc`, no
  ArgoCD MCP access configured for `ocp03`.
- **Namespace:** `trainingcamp-prod`
- **Quota:** `trainingcamp-prod-computeresources` (`NotTerminating` scope) —
  `limits.cpu 250m`, `limits.memory 2Gi`, `requests.cpu 250m`,
  `requests.memory 2Gi` for the whole namespace. Build pods (`oc new-build`)
  run with an active deadline and are NOT counted against this scope, so the
  full budget is available to the running Deployment. `openshift/deployment.yaml`
  requests `100m/128Mi`, limits `200m/256Mi` — leaves headroom, don't raise
  without checking the quota first. That headroom is *not* enough for a
  RollingUpdate, though: it briefly needs old + new pod side by side
  (400m limit) which exceeds the 250m quota and makes every rollout hang
  forever on `FailedCreate: exceeded quota`. `deployment.yaml` sets
  `strategy.type: Recreate` for this reason — confirmed necessary the first
  time a rollout was attempted here.
- **Manifests:** `openshift/Dockerfile`, `deployment.yaml`, `service.yaml`,
  `route.yaml`, `secret.example.yaml`. Dockerfile replicates the same build
  steps as `.gitlab-ci.yml`'s `deploy_azure` job (`node site/build.js` +
  rsync `phases/` → `site/phases/`) as a multi-stage build; final image is
  `registry.access.redhat.com/ubi9/nodejs-22-minimal` running
  `node server/server.js`. Base image is Red Hat's UBI Node.js image, not the
  Docker Hub `node:*` image — this cluster's registry policy rejects
  `docker.io` pulls (confirmed by a failed build). The build stage copies
  files into the image as root (`USER 0`) because plain `COPY` always sets
  `root:root` ownership regardless of the active `USER`, which otherwise
  EACCES's `node site/build.js` writing `site/data.js` under the non-root
  default user — the final runtime image never sets `USER 0`. The `phases/`
  → `site/phases/` staging step is a small inline `node -e` script rather
  than `rsync`, since the UBI Node.js image has no `rsync`/`microdnf` by
  default. `SITE_PASSCODE`/`GATE_SECRET` were generated fresh for this
  deployment rather than reused from Azure (the Azure passcode had been
  pasted in plaintext into a chat, so it was rotated instead of carried
  over) — existing Azure `ase_gate` cookies are **not** valid against this
  deployment. A Kyverno policy (`no-pods-default-sa`) rejects Pods running
  under the `default` ServiceAccount, so a dedicated `ase-site-gated`
  ServiceAccount is required and referenced via `spec.template.spec.serviceAccountName`
  in `deployment.yaml`.
- **Passcode gate is disabled here** (`GATE_DISABLED=true` in
  `deployment.yaml`, checked in `server/server.js`) — this route is only
  reachable through an internal, VPN-restricted reverse proxy, so the
  passcode was judged redundant on top of that network restriction. The
  `SITE_PASSCODE`/`GATE_SECRET` secret is still created and wired up (harmless,
  unused) so re-enabling the gate later is a one-line env change, not a
  redeploy-from-scratch.
- **LLM gateway proxy**: `POST /api/llm/chat/completions` in `server/server.js`
  proxies notebook LLM calls to `https://gateway.lhind.ai/v1/chat/completions`,
  injecting the `LLM_GATEWAY_KEY` secret server-side — no key reaches the
  browser. Replaces the old client-side model where each learner pasted their
  own key into a site dialog (`site/settings.js`, removed) that was
  postMessaged into the JupyterLite iframe (`lrn-key-bridge.js`, removed) and
  sent as `Authorization: Bearer <key>` directly from the browser to
  `gateway.lhind.ai`. `ide/jupyterlite/lrn_llm.py`'s `API_BASE` now defaults
  to the same-origin `/api/llm` path — propagate any change to it into every
  `phases/**/code/lrn_llm.py` copy (`scripts/generate_notebooks.py` does this
  automatically when specs are available; otherwise copy by hand, see git
  history for the one-off script used here).
  - **Allowed models**: only the GPT-5.4 family (`azure/gpt-5.4`,
    `azure/gpt-5.4-mini`, `azure/gpt-5.4-nano`) — the gateway's virtual-key
    policy 403s (`model_blocked`) on anything else, including `gpt-4o`, which
    was the old default. `DEFAULT_MODEL` is now `azure/gpt-5.4` everywhere
    (canonical `lrn_llm.py` + all propagated/inlined copies).
  - **Rate limiting**: a simple in-memory per-IP cap (`LLM_RATE_LIMIT_PER_MIN`,
    currently 20/min) protects the shared gateway budget (5000€ one-time,
    25€/h cap) since there's no per-user key anymore. IP is read from
    `X-Forwarded-For` (first hop) — verified working via `oc port-forward`
    (21st request in a minute → `429`), but **not confirmed accurate over the
    public route**: depends on whether the upstream reverse proxy forwards a
    consistent client IP. If it doesn't, the limit still applies, just
    possibly bucketed coarser than intended (e.g. shared across users behind
    the same hop) — not a broken proxy, just an unconfirmed granularity.
  - Budget/limits (RPM, TPM, cost-per-hour, total budget) live on the gateway
    side, not in this repo — see whoever issued `LLM_GATEWAY_KEY` for current
    values or to request changes.

### First deploy (manual, no CI wired up yet)

```bash
oc login <ocp03 api url> --token=... # or --web
oc project trainingcamp-prod

# 1. Secret + ServiceAccount
oc create secret generic ase-site-gated-secrets \
  --from-literal=SITE_PASSCODE='<new passcode>' \
  --from-literal=GATE_SECRET="$(openssl rand -hex 32)" \
  --from-literal=LLM_GATEWAY_KEY='<Bifrost gateway key>'
oc create serviceaccount ase-site-gated   # required by the no-pods-default-sa Kyverno policy

# 2. Build the image in-cluster. Build context is the repo root (the
#    Dockerfile COPYs README.md, ROADMAP.md, glossary/, site/, phases/), but
#    the Dockerfile itself lives in openshift/ — point the BuildConfig at it.
oc new-build --strategy=docker --binary --name=ase-site-gated
oc patch bc/ase-site-gated --type=merge \
  -p '{"spec":{"strategy":{"dockerStrategy":{"dockerfilePath":"openshift/Dockerfile"}}}}'
oc start-build ase-site-gated --from-dir=. --follow   # respects .dockerignore

# 3. Deploy + expose
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml
oc get route ase-site-gated -o jsonpath='{.spec.host}'
```

Verify: `/gate.html`, `/`, and `/data.js` should all return `200` without any
cookie — the gate is intentionally disabled here (`GATE_DISABLED=true`, see
above). This differs from the old Azure deployment (see §1), which required
a valid `ase_gate` cookie on everything but `/gate.html`.

### Public hostname: default OCP03 domain, not `trainingcamp.lhind.ai`

`trainingcamp.lhind.ai` was the original plan but got dropped: `lhind.ai`
isn't a resolvable internal DNS zone (confirmed via `nslookup` → NXDOMAIN;
it only exists for external AI services in eLDP). Standing up a real zone
via Kyndryl was one option, but the team picked the fast path instead —
**no custom host at all**. `openshift/route.yaml` has no `spec.host`, so
OpenShift generates one under the cluster's own wildcard domain:

```
ase-site-gated-trainingcamp-prod.apps.ocp03.cloud.lhind.app.lufthansa.com
```

(re-derive with `oc get route ase-site-gated -o jsonpath='{.spec.host}'` —
it's deterministic from route name + namespace, but don't hardcode it
elsewhere in case the route is ever recreated with different metadata.)

Implications:

- No new DNS record and no new certificate needed — this hostname resolves
  under the cluster's existing wildcard domain and is covered by the OCP
  wildcard TLS cert already terminating `*.apps.ocp03.cloud.lhind.app.lufthansa.com`.
- Any reverse proxy (internal or ORBIT.IO) fronting this app **must rewrite
  the Host header** to the generated hostname above before forwarding —
  this is the generic-domain case, where OpenShift's router relies on the
  Host header to resolve Route → Service → Pod. (Contrast with a route that
  sets a custom `spec.host` directly, where no rewrite is needed — that was
  the `trainingcamp.lhind.ai` plan, abandoned for the DNS-zone reason above.)
- If a friendlier public name is wanted later, revisit the DNS-zone options
  discussed with the network team (new Kyndryl-managed zone + cert, or a
  hostname under the existing `lhind.app.lufthansa.com` zone) — out of
  scope for the initial deploy.

### Redeploy after a code change

```bash
oc start-build ase-site-gated --from-dir=. --follow   # rebuilds image
oc rollout restart deployment/ase-site-gated          # picks up :latest
```

### Azure teardown

Done — see §1. Torn down before external (VPN/reverse-proxy) reachability of
the OpenShift deployment was confirmed, at explicit user request accepting
that risk; only internal verification (`oc port-forward` + curl) had passed
at that point.

---

## 2. Browser IDE backend (`ide/`, not yet deployed)

Real Python execution with LLM libraries, one Hyper-V-isolated sandbox per user,
Entra-authenticated, on **Azure Container Apps Dynamic Sessions**. This is what
needs the gateway/CIDR/Entra parameters. Full design in `ide/README.md`.

Flow: Static Web App (Monaco editor) → Orchestrator (ACA app, Entra EasyAuth) →
Dynamic Session Pool (sandbox per user) → internal LLM gateway + package mirror.

### Deploy parameters

Copy `ide/infra/main.parameters.example.json` to
`ide/infra/main.parameters.json` and fill these. Values marked ✅ are confirmed;
**TODO** must be supplied (LHIND-internal — get from the platform/network team).

| Parameter | Value |
|---|---|
| `location` | `germanywestcentral` (LHIND data residency) |
| `namePrefix` | `lhindide` |
| `entraTenantId` | ✅ `d9f5cb22-01c9-4956-b859-4f876f6a5c83` |
| `entraClientId` | **TODO** — register an Entra app for the orchestrator EasyAuth (redirect URI `https://<orchestrator-fqdn>/.auth/login/aad/callback`), use its client id. No `lhindide` app exists yet. |
| `llmGatewayUrl` | **TODO** — internal OpenAI-compatible gateway base URL, e.g. `https://<gateway>.lhind.internal/v1` |
| `llmGatewayCidr` | **TODO** — IP/CIDR of the LLM gateway for the egress allowlist, e.g. `10.50.1.10/32` |
| `packageMirrorCidr` | **TODO** — IP/CIDR of the internal PyPI mirror, e.g. `10.50.2.0/24` |
| `maxConcurrentSessions` | `320` |
| `readySessionInstances` | `20` (warm pool — tune to real concurrency) |
| `sessionCooldownSeconds` | `600` |

Subscription for this deploy: same as above
(`338558e0-0b85-4d45-97f8-392312662da6`). Provider `Microsoft.App` must be
registered (`az provider register -n Microsoft.App`).

### Push it

```bash
# 1. Build & push images to the ACR created by Bicep (or any ACR)
az acr build -r <acr> -t lesson-runner:latest        ide/runner
az acr build -r <acr> -t lesson-orchestrator:latest  ide/orchestrator

# 2. Register the orchestrator Entra app (-> entraClientId), fill params, then:
az deployment group create -g <rg> \
  -f ide/infra/main.bicep -p @ide/infra/main.parameters.json

# 3. Point the site at the backend (else it falls back to Pyodide):
#    <script>window.LESSON_IDE_BACKEND_URL = 'https://<orchestrator-fqdn>';</script>
```

### Open question before production

How does the internal LLM gateway authenticate the **end user**? No per-user
secret may live in a sandbox (the user can read session env/files). The shipped
path routes sandbox → orchestrator `/llm/*` → gateway so the orchestrator injects
per-user attribution; confirm the gateway's auth model and finalize
`orchestrator/app.py:auth_headers_for_gateway()`. See `ide/README.md`.

---

## 3. LRN course taxonomy and numbering

The LRN cockpit is a role/level learning product. Do not expose raw curriculum
phase labels such as `P11` or lesson labels such as `L02` in LRN UI. Those
phase/lesson numbers are only source links into `phases/...`.

Use this hierarchy everywhere in `site/lrn/*` and in LRN mode of
`site/lesson.html`:

```text
Profile -> External level -> Learning path -> Course -> Unit -> Activity
Rxx     -> LVx            -> LPxx          -> Cxx    -> Uxx  -> Axx
```

Stable codes:

- Profiles: `R01-BSC`, `R02-PVS`, `R03-TC`, `R04-AM`, `R05-PMA`,
  `R06-CF`, `R07-LEAD`.
- External assessment levels: `LV1` through `LV5`. These are the numbers the
  external self-assessment passes in; do not render self-assessment questions.
- Learning paths: `LP01` Core AI Foundation Path, `LP02` Consulting & Value
  Creation Path, `LP03` Technology & Engineering Delivery Path, `LP04`
  Leadership & Transformation Path, `LP05` Corporate Functions Enablement Path.
- Course display codes: `C01`, `C02`, ... derived from the order in
  `window.LrnData.courses`. Keep the original course id (`AI-04`,
  `PROMPT-01`, etc.) next to the display code because those ids map to real LRN
  course inventory.
- Units are local to a course and must be numbered `U01`, `U02`, ...
  according to the order in `window.LrnCurriculumMap.courseMaps[courseId]`.
- Activities are local to a unit in the cockpit (`U02 · A03`) and sequential
  across the course in the lesson shell (`A05/12`).

When adding or remapping content:

- Add or reorder courses in `site/lrn/data.js`; add or reorder unit/activity
  mappings in `site/lrn/curriculum-map.js`.
- Keep lesson `path` values as raw curriculum paths, but show LRN labels in the
  UI.
- A complete context key should read like
  `R03-TC / LV4 / LP03 / C08`, optionally followed by `U02 / A03`.
- Use "Learning Path", "Course", "Unit", and "Activity" in LRN UI. Avoid
  "Phase", "Lesson number", "Subcourse", and raw `Pxx/Lxx` labels in LRN UI.

---

## Git

- Canonical remote: `lhind` →
  `https://git02.lhind.app.lufthansa.com/lhind/pace/agentic-software-engineering/ai-training.git`, branch `main`.
- Local identity: `DETMERS, KAI <kai.detmers@lhind.dlh.de>` (`git config --local`).
- ⚠️ Multiple `claude --dangerously-skip-permissions` sessions run in this repo
  concurrently and have corrupted `.git` mid-operation. Don't run parallel
  skip-permission agents in the same working tree — use git worktrees or
  separate clones.
