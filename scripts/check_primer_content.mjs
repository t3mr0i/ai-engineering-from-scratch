/**
 * Content guard for the Interactive LLM Primer (site/llm-primer/content/).
 *
 * The primer ships the same course twice — content.en.json and content.de.json
 * — and a review pass found every failure mode below at least once in
 * production: a German label left in the English pack, an HTML entity printed
 * verbatim in a takeaway, an emoji example without emojis, quote marks doubled
 * by a template that wrapped already-quoted strings, and a rewrite demo
 * offering five styles but shipping three example outputs. None of those
 * surface as an error at runtime; they just look broken to learners.
 *
 * Run: node scripts/check_primer_content.mjs
 * Exits non-zero (with a list) as soon as any check fails.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DIR = path.join(REPO, "site", "llm-primer", "content");
const load = (f) => JSON.parse(readFileSync(path.join(DIR, f), "utf8"));

const de = load("content.de.json");
const en = load("content.en.json");

const problems = [];
const fail = (check, msg) => problems.push(`[${check}] ${msg}`);

/** Walk every string in a tree, yielding [dottedPath, value]. */
function* strings(node, prefix = "") {
  if (typeof node === "string") { yield [prefix, node]; return; }
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) yield* strings(node[k], prefix ? `${prefix}.${k}` : k);
  }
}

/** Key shape of a tree, ignoring the values. Arrays keep their length. */
function shape(node) {
  if (Array.isArray(node)) return node.map(shape);
  if (node && typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node).sort()) out[k] = shape(node[k]);
    return out;
  }
  return 0;
}

// (a) Identical key structure DE <-> EN. The attention chapter is the one
//     deliberate exception: German needs a comma the English sentence doesn't,
//     so its token arrays differ in length (14 vs 13) on purpose.
{
  const strip = (doc) => {
    const copy = JSON.parse(JSON.stringify(doc));
    const attn = (copy.chapters || []).find((c) => c.id === "attention");
    if (attn) delete attn.gameData;
    return copy;
  };
  const a = JSON.stringify(shape(strip(de)));
  const b = JSON.stringify(shape(strip(en)));
  if (a !== b) fail("a/structure", "content.de.json and content.en.json no longer have the same key structure");
}

// (b) Same correct-answer index in both quizzes — a mismatch means one
//     language marks the wrong option right.
{
  const nde = (de.quiz || []).length, nen = (en.quiz || []).length;
  if (nde !== nen) fail("b/quiz", `quiz length differs: de=${nde} en=${nen}`);
  for (let i = 0; i < Math.min(nde, nen); i++) {
    if (de.quiz[i].correct !== en.quiz[i].correct) {
      fail("b/quiz", `quiz[${i}].correct differs: de=${de.quiz[i].correct} en=${en.quiz[i].correct}`);
    }
  }
}

// (c) No German left in the English pack. Umlauts/ß are the reliable tell;
//     the word list catches the label-shaped leftovers that have neither.
{
  const GERMAN_WORD = /\b(förmlich|Pirat|lässig|kürzer|und|nicht|Wort|Kapitel|Beispiel)\b/;
  for (const [p, v] of strings(en)) {
    if (/[äöüßÄÖÜ]/.test(v)) fail("c/lang", `EN string contains German characters at ${p}: ${v.slice(0, 80)}`);
    else if (GERMAN_WORD.test(v)) fail("c/lang", `EN string looks German at ${p}: ${v.slice(0, 80)}`);
  }
}

// (d) Match-game prompts carry their own quote marks. The card template must
//     not add a second pair — check the authored strings are quoted exactly
//     once, consistently, so the template can stay quote-free.
{
  const OPEN = /^\s*[„“"']/;
  const DOUBLED = /^\s*(„„|““|""|"")|((""|““|""|„„)\s*$)/;
  for (const doc of [["de", de], ["en", en]]) {
    const [langName, d] = doc;
    for (const ch of d.chapters || []) {
      for (const pair of (ch.gameData && ch.gameData.pairs) || []) {
        if (DOUBLED.test(pair.right)) {
          fail("d/quotes", `${langName} ${ch.id}: match prompt has doubled quote marks: ${pair.right.slice(0, 60)}`);
        }
      }
      const quoted = ((ch.gameData && ch.gameData.pairs) || []).filter((p) => OPEN.test(p.right));
      const pairs = (ch.gameData && ch.gameData.pairs) || [];
      if (quoted.length && quoted.length !== pairs.length) {
        fail("d/quotes", `${langName} ${ch.id}: match prompts are only partly quoted (${quoted.length}/${pairs.length})`);
      }
    }
  }
}

// (e) HTML entities render as text everywhere except the `lecture` field —
//     that one is the only string injected as HTML.
{
  const ENTITY = /&[a-zA-Z]+;|&#\d+;/;
  for (const [langName, d] of [["de", de], ["en", en]]) {
    for (const [p, v] of strings(d)) {
      if (p.endsWith(".lecture") || p === "lecture") continue;
      if (ENTITY.test(v)) fail("e/entities", `${langName} ${p} contains an HTML entity: ${v.slice(0, 80)}`);
    }
  }
}

// (f) The rewrite demo's emoji example has to actually contain emojis.
{
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  for (const [langName, d] of [["de", de], ["en", en]]) {
    const ch = (d.chapters || []).find((c) => c.id === "ondevice");
    const out = (ch && ch.gameData && ch.gameData.example && ch.gameData.example.out) || [];
    const emojiRow = out.find((o) => /emoji/i.test(o.label));
    if (!emojiRow) fail("f/emoji", `${langName}: ondevice example has no "emoji" row`);
    else if (!EMOJI.test(emojiRow.text)) fail("f/emoji", `${langName}: the emoji example contains no emoji: ${emojiRow.text}`);
  }
}

// (g) Probability arrays are distributions — a rounding slip shows up in the
//     game as bars that don't fill the row.
{
  for (const [langName, d] of [["de", de], ["en", en]]) {
    for (const ch of d.chapters || []) {
      for (const round of (ch.gameData && ch.gameData.rounds) || []) {
        if (!Array.isArray(round.options) || typeof round.options[0]?.p !== "number") continue;
        const sum = round.options.reduce((a, o) => a + o.p, 0);
        if (Math.abs(sum - 1) > 0.005) {
          fail("g/probabilities", `${langName} ${ch.id}: option probabilities sum to ${sum.toFixed(3)}, not 1.0`);
        }
      }
    }
  }
}

// (h) One example output per defined rewrite style.
{
  for (const [langName, d] of [["de", de], ["en", en]]) {
    const ch = (d.chapters || []).find((c) => c.id === "ondevice");
    const presets = (ch && ch.gameData && ch.gameData.presets) || [];
    const out = (ch && ch.gameData && ch.gameData.example && ch.gameData.example.out) || [];
    if (presets.length !== out.length) {
      fail("h/examples", `${langName}: ondevice defines ${presets.length} styles but ships ${out.length} example outputs`);
    }
  }
}

if (problems.length) {
  console.error(`${problems.length} problem(s) in site/llm-primer/content/:\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log("llm-primer content OK (8 checks, both languages)");
