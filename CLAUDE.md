# CLAUDE.md — Deploy & Infrastructure

This project deploys to Azure in **two independent parts**. Know which one you're
touching before you push.

**Migration in progress:** the gated site is moving from Azure App Service to
OpenShift (`trainingcamp-prod` namespace, cluster `ocp04`) — see §1b. Azure
(`ase-site-gated`) stays live and is the source of truth until the OpenShift
deployment is verified; it will be decommissioned once that's confirmed
working.

---

## 1. Gated site (live today, being replaced by §1b)

The lesson site + the in-browser Python playground (Pyodide). Served by a small
Node server that runs the HMAC passcode gate on every request — **no byte
is reachable without a valid signed cookie**, including the 752 KB `data.js`,
all of `/phases/*`, the JupyterLite assets, and the Pyodide WASM. No Entra,
no gateway, no identity provider — just a shared passcode.

- **Azure resource:** App Service `ase-site-gated` (Linux, Node 22, plan B1)
- **App Service plan:** `ase-site-plan`
- **Resource group:** `rg-ase-webpage`
- **Region:** Germany West Central (LHIND data residency)
- **Subscription:** `BU Technologie Consulting E/TEI - ASE - Test - Y0100`
  (`338558e0-0b85-4d45-97f8-392312662da6`)
- **Live URL:** https://ase-site-gated.azurewebsites.net
- **Hosting model:** Node server in `server/` (zero npm dependencies — pure
  `http` + `crypto`) serves `site/` statically and runs the per-request gate.
  Only `gate.html` and `POST /api/gate` are publicly reachable; everything else
  requires a valid `ase_gate` cookie.

### Secrets

Two values, set as App Service application settings (Configuration → Application
settings, or `az webapp config appsettings set`). They must match what any
existing cookies were signed with — changing `GATE_SECRET` invalidates every
outstanding cookie.

| Setting | What | Purpose |
|---|---|---|
| `SITE_PASSCODE` | the shared passcode | compared timing-safely on `POST /api/gate` |
| `GATE_SECRET`    | random hex string   | HMAC-SHA256 key signing the `ase_gate` cookie |
| `WEBSITE_RUN_FROM_PACKAGE` | unset / `0` | server reads site from disk, no package-mount |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` | server has no npm deps; skip build step |

`SITE_PASSCODE` and `GATE_SECRET` never live in source.

### Push it

CI (`.gitlab-ci.yml`) does this automatically on push to `main` **once** the
GitLab CI/CD variables `AZURE_APP_SERVICE_SP_CLIENT_ID`,
`AZURE_APP_SERVICE_SP_CLIENT_SECRET`, and `AZURE_APP_SERVICE_SP_TENANT_ID`
(masked + protected) are set. The SP needs the role `Website Contributor`
scoped to `/subscriptions/<sub>/resourceGroups/rg-ase-webpage/providers/Microsoft.Web/sites/ase-site-gated`.

### Manual deploy to Azure (skip Git)

For fast iteration when you want to ship UI changes without going through the
GitLab merge + CI pipeline. Assumes you are logged into `az` and land in
subscription `338558e0-0b85-4d45-97f8-392312662da6`.

```bash
# 1. Build + regenerate runnable-block catalog
node site/build.js
node scripts/test_runnable_blocks.mjs

# 2. Stage site/ + phases/ as on CI
mkdir -p site/phases
rsync -a --prune-empty-dirs --include='*/' \
  --include='docs/en.md' --include='quiz.json' --include='code/main.py' \
  --exclude='*' phases/ site/phases/

# 3. Assemble deploy package (server + site + package.json)
rm -rf .appservice-deploy deploy.zip
mkdir -p .appservice-deploy
cp server/server.js server/gate-core.js server/package.json .appservice-deploy/server/
cp -R site .appservice-deploy/site
cat > .appservice-deploy/package.json <<'JSON'
{ "name": "ase-site-gated", "version": "1.0.0", "private": true,
  "scripts": { "start": "node server/server.js" },
  "engines": { "node": ">=18" } }
JSON
(cd .appservice-deploy && zip -r -q ../deploy.zip .)
rm -rf .appservice-deploy

# 4. Deploy (secrets already configured on the App Service)
az webapp deploy -n ase-site-gated -g rg-ase-webpage \
  --src-path deploy.zip --type zip

# 5. Clean up
rm -f deploy.zip
```

Notes:

- The `site/jupyterlite/`, `site/phases/` and `.appservice-deploy/`
  directories are build / deploy artefacts — never commit them.
- The deploy zip is fully self-contained: no `npm install` runs on the App
  Service (the server uses only Node built-ins). Deploy is fast (~25 MB zip).
- To verify after deploy: `curl -I https://ase-site-gated.azurewebsites.net/`
  should return `302` (HTML nav) or `401` (asset); with a valid cookie fetched
  via `POST /api/gate` every path returns `200`.
- **Domain migration** (for taking the custom domain over from the old SWA
  URL): DNS changes + App Service custom-domain binding + TLS cert. Not done
  here — see runbook in `docs/runbook-domain-cutover.md` (when written).
- **SWA retirement** (`swa-ase-webpage`) — leave it running until the custom
  domain has propagated and old cookies have expired (TTL 7 days). Then stop
  / delete.

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
  without checking the quota first.
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

### First deploy (manual, no CI wired up yet)

```bash
oc login <ocp03 api url> --token=... # or --web
oc project trainingcamp-prod

# 1. Secret + ServiceAccount
oc create secret generic ase-site-gated-secrets \
  --from-literal=SITE_PASSCODE='<new passcode>' \
  --from-literal=GATE_SECRET="$(openssl rand -hex 32)"
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

Verify: the route should serve `/gate.html` unauthenticated and everything
else 302→gate / 401 without a valid cookie, same behavior as
`ase-site-gated.azurewebsites.net` today.

### Public hostname: `trainingcamp.lhind.ai`

`openshift/route.yaml` sets `spec.host: trainingcamp.lhind.ai` directly — the
OCP03 router terminates that hostname itself, so no reverse-proxy Host-header
rewrite is needed. This means:

- DNS for `trainingcamp.lhind.ai` must point at the OCP03 router (the same
  router that serves `*.apps.ocp03.cloud.lhind.app.lufthansa.com`), not at a
  separate reverse proxy doing header rewriting.
- The OCP wildcard cert only covers `*.apps.ocp03.cloud.lhind.app.lufthansa.com`
  — it does **not** cover `trainingcamp.lhind.ai`. A cert for that custom
  domain must be supplied in `route.yaml`'s `spec.tls` block
  (`certificate`/`key`/`caCertificate`), or termination switched to
  `reencrypt`/`passthrough` if TLS for that domain is handled upstream instead.
- If a proxy layer for ORBIT.IO is also fronting this app, it should point
  straight at `trainingcamp.lhind.ai` (or the OCP03 router's IP with SNI for
  that host) — not at the generated `apps.ocp03...` route hostname, and no
  Host-header rewrite should be applied for this app.

### Redeploy after a code change

```bash
oc start-build ase-site-gated --from-dir=. --follow   # rebuilds image
oc rollout restart deployment/ase-site-gated          # picks up :latest
```

### After OpenShift is verified working

Azure teardown (`ase-site-gated` App Service, plan `ase-site-plan`, resource
group `rg-ase-webpage`) happens only after this is confirmed live and
correct — not automatically. Don't delete the Azure resources as part of
setting up OpenShift.

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
