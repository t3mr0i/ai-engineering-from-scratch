# Understanding LLMs — interactive learning app

A small, mobile-first web app that teaches **anyone** (no prior AI knowledge
needed) the most important concepts around large language models (LLMs) in
**~60 minutes** — through short **mini-games**, data-driven **visualizations**,
a **real GPT tokenizer**, an optional **on-device language model**, and a
**closing quiz** with personal reflection tips.

The app runs on **Vercel** as TypeScript serverless functions. It works fully
**solo** with no backend (progress in `localStorage`); an optional synchronized
**journey mode** (a host runs a live session and unlocks chapters as the group
goes) is backed by **Vercel Blob** + **Vercel Edge Config** (see
[Storage](#storage-journey-mode)).

The app ships in **English (default) and German**, switchable with a language
picker on the start page (see [Internationalization](#internationalization)).

Designed for use over screen sharing: the start page shows a **QR code** that
participants scan with their phone to open the app directly in the browser. The
layout targets **iPhone 15–17** (and similar smartphones).

## Demo

https://llm-interactive-tutorial.vercel.app/

## Content

- **58 terms** in a filterable glossary (tokens, prompt, embedding, similarity,
  attention, context window, RAG, chunking, agent, MCP, hallucination, prompt
  injection, quantization, on-device, …)
- **16 interactive chapters / mini-games** with a rising learning curve, incl.:
  1. *What is an LLM?* — predict the next word (probabilities)
  2. *From text to tokens* — **real GPT tokenizer** (gpt-tokenizer/cl100k) live
  3. *Embeddings* — words as numbers on a meaning map (D3)
  4. *Semantic search* — find the nearest neighbors to a question (D3)
  5. *Pipeline*, 6. *Attention* (heatmap, D3), 7. *Temperature*, 8. *Context & memory*
  9. *Better prompting*, 10. *Prompt lab* (building blocks → quality meter)
  11. *RAG* — search → enrich → answer (D3), 12. *Agents*, 13. *Token cost calculator*
  14. *Limits & risks*, 15. *Prompt injection* (find the dangerous line)
  16. *Live: AI on your device* — optional **text magician** on an on-device model
- **Quiz (18 questions)** → results with a category profile and **reflection
  cards** (one "aha" + one discussion question each) that target the weak topics —
  ideal as a bridge into the shared reflection round.

Solo progress is stored locally per device (`localStorage`).

## Run locally

Requirements: Node 18+ (project developed on Node 22).

```bash
npm install
```

**Option A — no cloud (recommended for local dev + the UI tests).** A tiny local
server (`tests/ui/server.ts`) mounts the same function handlers and uses a
file-backed store, so journey mode works end-to-end without Blob/Edge Config:

```bash
LOCAL_STORE_DIR=.local-store \
  ADMIN_USERNAME=admin \
  ADMIN_PASSWORD_HASH="$(node -e "console.log(require('bcryptjs').hashSync('secret',10))")" \
  SESSION_SECRET=dev-secret \
  PORT=8799 npx tsx tests/ui/server.ts
```

Then open `http://localhost:8799`.

**Option B — `vercel dev`.** Mirrors production routing. Needs a linked Vercel
project and the environment variables from [Storage](#storage-journey-mode)
(copy `.env.sample` → `.env.local`):

```bash
npx vercel dev
```

The QR code automatically points to the URL the app is served from (reverse-proxy
aware via `X-Forwarded-Proto`).

## Architecture

Pure TypeScript on Vercel — two serverless functions plus static assets, no
framework and no build step of your own (Vercel bundles the functions):

```
api/render.ts        – server-renders the HTML shell, embeds content as JSON, builds the QR URL
api/index.ts         – JSON API (/api?action=…) — thin HTTP wrapper
lib/api.ts           – apiDispatch(): all journey/admin actions (returns {code, body})
lib/sync.ts          – journey logic (client state, presence, identities, timing)
lib/store.ts         – storage facade → Blob (source of truth) + Edge Config (projection)
lib/file-store.ts    – local/offline file-backed store (LOCAL_STORE_DIR)
lib/session.ts       – stateless admin session (HMAC-signed cookie)
lib/i18n.ts          – language resolver (lang cookie → pack; English default)
lang/*.json          – course content + UI strings per language (see below)
public/assets/       – app.js, style.css, gpt-tokenizer, qrcode (served statically)
vercel.json          – routes "/" → render, "/api" → api
```

Routing (`vercel.json`): `"/"` rewrites to `api/render`; `"/api"` rewrites to
`api/index`, which `assets/app.js` calls via `fetch("api?action=…")`.

## Storage (journey mode)

Solo mode needs no storage. Journey mode uses a **hybrid** so each store plays to
its strength:

- **Edge Config** holds the active journey's control state (`{id, status,
  unlocked_chapter, name}`) — the tiny, read-hot value every player polls. Reads
  are ~5ms; a chapter unlock propagates to players in ≤~10s.
- **Vercel Blob** is the source of truth for the full journey history and the
  per-player records (one private blob per player: position, heartbeat, name).

`lib/store.ts` writes Blob first, then updates the Edge Config projection. If a
store is unavailable, the app simply falls back to solo mode.

Set up in the Vercel dashboard: create a **Blob** store and an **Edge Config**,
connect both to the project, then set the environment variables in `.env.sample`
(`BLOB_READ_WRITE_TOKEN`, `EDGE_CONFIG`, plus `EDGE_CONFIG_ID` + `VERCEL_API_TOKEN`
for Edge Config writes, and `SESSION_SECRET`). Deploy via Vercel's Git
integration or `vercel --prod`.

## Admin accounts

The journey mode has an admin console (open it from the start page via 🛠️ Admin).
There is no sign-up — admins come from **environment variables** (no database):

1. Generate a **bcrypt** hash for the password:

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```

2. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (the hash from step 1) in the
   Vercel project's Environment Variables (or `.env.local`). For more than one
   admin, set `ADMINS` to a JSON array instead:
   `[{"username":"a","password_hash":"$2a$10$…"}, …]`.

Also set `SESSION_SECRET` (any long random string) — it signs the admin session
cookie. Never put the plaintext password into env or the repo — only the hash.

## Internationalization

- **English is the default.** The active language is remembered in a `lang`
  cookie; a picker on the start page switches it (sets the cookie and reloads —
  no `?lang` query parameter).
- Content lives in plain **JSON** packs under `lang/` — loaded in memory by
  `lang/index.ts` (zero store reads):
  - `lang/content.en.json`, `lang/content.de.json` — the course dataset (glossary,
    chapters/games, quiz, reflection, outro) plus glossary cross-reference aliases.
  - `lang/ui.en.json`, `lang/ui.de.json` — the UI string dictionary consumed by
    `public/assets/app.js`.
- To add a language: add `lang/content.<code>.json` + `lang/ui.<code>.json` and
  register the code in `lang/index.ts` (`AVAILABLE`), then add a button in the
  picker (`langPicker()` in `public/assets/app.js`).

## Editing content

Edit the JSON packs under **`lang/`** directly (`content.en.json`,
`content.de.json`). New terms, chapters or questions can be added without
touching JavaScript — edit each language you support. Available game types:
`predict`, `tokenizer`, `embedding`, `semanticsearch`, `pipeline`, `attention`,
`temperature`, `context`, `match`, `promptlab`, `rag`, `agent`, `cost`,
`classify`, `injection`, `ondevice`. UI chrome (buttons, feedback, hints) lives
in `lang/ui.*.json`; interpolated strings use `{placeholder}` tokens filled by
`fmt()` in `public/assets/app.js`.

## Tests

```bash
npm test          # vitest: API/journey logic against an in-memory store
npm run typecheck # tsc --noEmit
```

UI tests (Playwright) live in `tests/ui/` and run against the local server:

```bash
cd tests/ui && npm install && npx playwright test
```

### Vendored libraries & on-device model

- `public/assets/gpt-tokenizer.cl100k.js` — real GPT BPE tokenizer (global `GPTTokenizer_cl100k_base`).
- The **on-device model** (chapter 16, "text magician") is **strictly opt-in**:
  only after consent is `@huggingface/transformers` (transformers.js) loaded via
  `import()` from the CDN and a small English model (~250 MB, cached in the
  browser) run — entirely on the device, without a server. Small models are far
  stronger in English than German, so this demo runs in English; the German
  chapter explains why. Without consent the chapter shows a static example; an
  easter egg is hidden in the temperature game.

## License

[MIT](LICENSE) © 2026 nachtgold

Vendored third-party libraries and runtime-loaded components (transformers.js,
the on-device model) are listed with their licenses in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

