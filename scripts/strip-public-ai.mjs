#!/usr/bin/env node
/**
 * Removes the LLM/chat-completion client surface from a site/ tree before it
 * is uploaded to the public Azure Static Web App (yellow mushroom) — the
 * api/llm proxy function no longer exists in the repo, and this cuts the two
 * remaining client hooks so the public host ships no AI code at all:
 *
 *   - deletes pan.js (Learning Navigator chat bundle)
 *   - empties the lrn_llm bootstrap in python-runtime.js so Pyodide sessions
 *     no longer expose an LLM client
 *
 * Only the Azure workflow calls this. The internal OpenShift deployment
 * builds from the same site/ sources and keeps its AI features, so this must
 * never run in that path.
 *
 * Usage: node scripts/strip-public-ai.mjs [site-root]
 */

import { readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.argv[2] || "site";

const chatFile = path.join(root, "pan.js");
rmSync(chatFile, { force: true });

const runtimeFile = path.join(root, "python-runtime.js");
const source = readFileSync(runtimeFile, "utf8");
const start = source.indexOf("var LRN_LLM_BOOTSTRAP = [");
const endMarker = '].join("\\n");';
const end = source.indexOf(endMarker, start);
if (start === -1 || end === -1) {
  throw new Error(`strip-public-ai: LRN_LLM_BOOTSTRAP anchors not found in ${runtimeFile}`);
}
const replacement = 'var LRN_LLM_BOOTSTRAP = [].join("\\n");';
writeFileSync(runtimeFile, source.slice(0, start) + replacement + source.slice(end + endMarker.length));

console.log(`strip-public-ai: removed ${chatFile}, emptied LRN_LLM_BOOTSTRAP in ${runtimeFile}`);
