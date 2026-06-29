# CLAUDE.md — Deploy & Infrastructure

This project deploys to Azure in **two independent parts**. Know which one you're
touching before you push.

---

## 1. Gated site (live today)

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
