# Tests

Two layers, both exercising the **real application code**.

## 1. Backend suite (vitest)

Exercises the full API logic (`apiDispatch` in [`../lib/api.ts`](../lib/api.ts))
against an **in-memory** store ([`../lib/memory-store.ts`](../lib/memory-store.ts)).
Fast, no cloud.

```bash
npm test            # from the repo root
npm run typecheck   # tsc --noEmit
```

Covers: player join/resume/late-join, heartbeat, position reporting, solo
tracking, admin auth + session, journey lifecycle (create/start/unlock/archive),
unlock clamping, the one-active-journey rule, cohort listing/switching (solo +
journeys), read-only vs. controllable cohorts, a full multi-role end-to-end
playthrough, plus unit tests for the store, session cookie, and sync helpers.

Add a test: drop a `tests/*.test.ts` file and use the `Client` harness in
[`helpers.ts`](helpers.ts) (`fresh()`, `call()`, `body()`, `seedAdmin()`,
`loginAdmin()`, `cookieSet()`, `resetRequest()`) — the vitest equivalent of the
old PHP `bootstrap.php`.

## 2. UI suite (Playwright)

Boots a local Node server ([`ui/server.ts`](ui/server.ts), run with tsx) that
mounts the same function handlers behind a **file-backed store** — no cloud
(Blob/Edge Config) needed — and drives a real browser through the playstyles,
roles and dashboards. The admin (`admin` / `secret`) is provided via env by the
Playwright config; journeys are created by the specs through the API.

```bash
cd tests/ui
npm install
npx playwright install chromium   # one-time browser download
npx playwright test               # or: --headed
```

Covers: solo play-through (start → lecture → minigame, glossary overlay), admin
login (success/failure) + dashboard, journey create/start/unlock/archive, player
join → lobby → automatic advance on start (background poll), and the dashboard
showing a joined player.

The file store lives in `tests/ui/.tmp/store/` and is recreated on each run
(`global-setup.js`).
