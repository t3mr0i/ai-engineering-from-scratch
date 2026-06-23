# CLAUDE.md — Deploy & Infrastructure

This project deploys to Azure in **two independent parts**. Know which one you're
touching before you push.

---

## 1. Static site (live today)

The lesson site + the in-browser Python playground (Pyodide). Pure static — **no
backend, no Entra, no gateway**.

- **Azure resource:** Static Web App `swa-ase-webpage`
- **Resource group:** `rg-ase-webpage`
- **Region:** West Europe
- **Subscription:** `BU Technologie Consulting E/TEI - ASE - Test - Y0100`
  (`338558e0-0b85-4d45-97f8-392312662da6`)
- **Live URL:** https://yellow-mushroom-0c0a45d03.7.azurestaticapps.net

### Push it

```bash
# 1. Deploy token (short-lived — do NOT commit or cache it)
TOKEN=$(az staticwebapp secrets list \
  --name swa-ase-webpage --resource-group rg-ase-webpage \
  --query "properties.apiKey" -o tsv)

# 2. Build, stage lesson content into the web root, deploy
node site/build.js
node scripts/test_runnable_blocks.mjs      # regenerate site/runnable-blocks.json if lessons changed
mkdir -p .swa-deploy && rsync -a site/ .swa-deploy/
mkdir -p .swa-deploy/phases
rsync -a --prune-empty-dirs --include='*/' \
  --include='docs/en.md' --include='quiz.json' --include='code/main.py' \
  --exclude='*' phases/ .swa-deploy/phases/
npx @azure/static-web-apps-cli deploy ./.swa-deploy \
  --deployment-token "$TOKEN" --env production --no-use-keychain
```

CI (`.gitlab-ci.yml`) does this automatically on push to `main` **once** the
GitLab CI/CD variable `AZURE_STATIC_WEB_APPS_API_TOKEN` (masked + protected) is
set to the token above.

`site/` is the web root: `/phases/*` is served alongside the app so lessons load
locally with no GitHub fetch.

### Manual deploy to Azure (skip Git)

For fast iteration when you want to ship UI changes without going through the
GitLab merge + CI pipeline (e.g. when the LHIND GitLab token is missing or you
want a tighter loop on design tweaks). Assumes you are logged into `az` with an
account that has `Contributor` on the SWA resource (run `az account show` —
should land in subscription `338558e0-0b85-4d45-97f8-392312662da6`).

```bash
# 1. Build + regenerate runnable-block catalog
node site/build.js
node scripts/test_runnable_blocks.mjs

# 2. Fetch deployment token (short-lived; do not commit it)
TOKEN=$(az staticwebapp secrets list \
  --name swa-ase-webpage --resource-group rg-ase-webpage \
  --query "properties.apiKey" -o tsv)

# 3. Stage site/ + phases/ into the deploy root
mkdir -p .swa-deploy
rsync -a site/ .swa-deploy/
mkdir -p .swa-deploy/phases
rsync -a --prune-empty-dirs --include='*/' \
  --include='docs/en.md' --include='quiz.json' --include='code/main.py' \
  --exclude='*' phases/ .swa-deploy/phases/

# 4. Deploy
npx --yes @azure/static-web-apps-cli@latest deploy ./.swa-deploy \
  --deployment-token "$TOKEN" --env production --no-use-keychain
```

Notes:

- The `missing property "jobs.build_and_deploy_job"` warning from the SWA CLI
  is harmless — the workflow file referenced is only used by GitHub Actions,
  which this manual path bypasses.
- Token is fetched fresh each run, never written to disk. Safe to inline
  directly in the deploy command if you prefer not to use a shell var.
- Use this path for UI/asset changes only. Schema or curriculum changes should
  still go through `git commit` + GitLab CI so the README stats sync runs.

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
