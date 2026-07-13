# LLM Interactive Primer

An interactive, ~60-minute primer on large language models — 16 mini-games,
a real GPT tokenizer, an embeddings/meaning map, an attention heatmap, a RAG
walkthrough, a token-cost calculator, a 58-term glossary, an 18-question quiz
with a personal reflection profile, and an optional on-device language model.

It lives at **`/llm-primer/`** on the gated site and is linked from the LRN
cockpit home page and the lesson catalog.

## Origin & license

Created by **Kai Zimmermann** — original course at
**[github.com/nachtgold/llm-tutorial](https://github.com/nachtgold/llm-tutorial)**
(MIT © 2026 nachtgold). Ported into the LHIND AI Learning Catalog under the
same MIT license. The original ships as Vercel serverless functions with an
optional multiplayer "journey mode" (Vercel Blob + Edge Config + bcryptjs admin
console) and a temperature easter egg. Neither the journey/admin backend nor
the easter egg are needed here, so the primer runs **solo-only** on the gated
static site: progress is stored per-device in `localStorage`, exactly like the
upstream app without a database. All 16 mini-games, the glossary, the quiz and
the reflection run fully client-side. The cover links back to the original
repository and credits the author.

## How it was adapted

- **Static bootstrap.** The Vercel server-rendered shell (`render.ts`) is
  replaced by `index.html`, which reads the `lang` cookie (en/de, default en),
  fetches the matching content + UI JSON, sets `window.APP_DATA/I18N/LANG/URL`
  with `APP_SYNC = null`, then loads the vendored libs + `app.js` in order.
- **Solo-only — journey/admin/easter-egg removed.** The upstream multiplayer
  "journey mode" (join/lobby/polling), the admin console, and the temperature
  easter egg were removed entirely from `app.js`. `api()` is a no-op (no
  backend), the cover CTA is just the start button, and progress lives in
  `localStorage`. A credit link to the original course sits on the cover.
- **LHIND design.** `assets/llm-primer.css` is a dark, Lufthansa-Group-themed
  skin using the LHIND dark palette (deep Core-Blue surfaces, sky-blue accent)
  and the Lufthansa Head/Text webfonts (loaded from `/lrn/assets/fonts/`).
  The same class structure as the original is preserved, recolored via tokens.
- **Gated.** `index.html` includes `/gate-guard.js`, so the primer is behind
  the same HMAC passcode gate as every other page (the gate server serves
  `/llm-primer/*` like any static file under `site/`).

## Layout

```
site/llm-primer/
├── index.html                  # static shell + bootstrap (gate-guard, LHIND header)
├── assets/
│   ├── app.js                  # app logic (adapted, solo-only) — vanilla JS, no build
│   ├── llm-primer.css          # LHIND dark skin
│   ├── qrcode.min.js           # vendored QR generator (cover QR code)
│   └── gpt-tokenizer.cl100k.js # vendored real GPT BPE tokenizer (cl100k_base)
└── content/
    ├── content.en.json / content.de.json   # course dataset (glossary, chapters, quiz, …)
    └── ui.en.json      / ui.de.json        # UI string dictionary
```

## Editing content

Edit the JSON packs under `content/` directly. Available game types:
`predict`, `tokenizer`, `embedding`, `semanticsearch`, `pipeline`,
`attention`, `temperature`, `context`, `match`, `promptlab`, `rag`, `agent`,
`cost`, `classify`, `injection`, `ondevice`. UI chrome lives in `ui.*.json`;
interpolated strings use `{placeholder}` tokens filled by `fmt()` in `app.js`.
Bump the `?v=` cache-buster on the asset `<link>`/`<script>` tags in
`index.html` when you ship content or asset changes.

## Vendored third-party libraries

- `gpt-tokenizer.cl100k.js` — real GPT BPE tokenizer (cl100k_base), MIT.
- `qrcode.min.js` — QR code generator, MIT.
- The on-device model (chapter 16) loads `@huggingface/transformers`
  (transformers.js) from a CDN **only after explicit opt-in**; no server.
