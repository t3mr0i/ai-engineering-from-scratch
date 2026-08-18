import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const Search = require("./search.js");
const lrnSource = readFileSync(new URL("./lrn/lrn.js", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("./index.html", import.meta.url), "utf8");

function loadSiteI18n() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(new URL("./i18n.js", import.meta.url), "utf8"), sandbox);
  return sandbox.window.SITE_I18N;
}

function loadLrnI18n() {
  const start = lrnSource.indexOf("  function i18n(");
  const end = lrnSource.indexOf("\n\n  // Max courses", start);
  assert.ok(start >= 0 && end > start, "could not isolate lrn i18n helper");
  const sandbox = {
    window: {
      SITE_I18N: { known: { en: "Known", de: "Bekannt" } },
      SiteLang: { get: () => "de" }
    }
  };
  vm.createContext(sandbox);
  return vm.runInContext(`(${lrnSource.slice(start, end).trim()})`, sandbox);
}

function loadTopicHelpers() {
  const start = lrnSource.indexOf("  function topicLabel(");
  const end = lrnSource.indexOf("\n\n  function renderFilters", start);
  assert.ok(start >= 0 && end > start, "could not isolate topic helpers");
  const sandbox = {
    data: { interests: [{ id: "future", label: "Future topic", hint: "Future hint" }] },
    i18n: (key, fallback) => fallback == null ? key : fallback
  };
  vm.createContext(sandbox);
  return vm.runInContext(`(() => { ${lrnSource.slice(start, end)}; return { topicLabel, topicHint }; })()`, sandbox);
}

const siteI18n = loadSiteI18n();

const items = [
  {
    id: "privacy",
    title: "Responsible & Trustworthy AI / GDPR & AI",
    summary: "GDPR, ethics guardrails, IT security, bias, fairness, and responsible AI use.",
    topics: ["Governance", "Compliance"]
  },
  {
    id: "agents",
    title: "Agent Evaluation",
    summary: "Test autonomous systems, agent loops, and tool calls.",
    topics: ["QA", "Agents"]
  },
  {
    id: "rag",
    title: "Retrieval-Augmented Generation",
    summary: "Ground large language models with vector search and embeddings.",
    topics: ["RAG", "Knowledge"]
  },
  {
    id: "green",
    title: "Green Coding",
    summary: "Sustainable software engineering and efficient inference.",
    topics: ["Sustainability"]
  },
  {
    id: "prompt",
    title: "Hands-on Prompt Engineering Workshop",
    summary: "Iterative prompting and output critique.",
    topics: ["Productivity"]
  }
];

const options = { fields: { title: 9, topics: 5, summary: 4 } };

function loadLrnData() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(new URL("./lrn/data.js", import.meta.url), "utf8"), sandbox);
  return sandbox.window.LrnData;
}

const lrnData = loadLrnData();
const realCourses = lrnData.courses.map((course) => ({
  id: course.id,
  title: course.title,
  summary: course.summary,
  interests: course.interests || [],
  topics: [].concat(
    course.modules || [],
    course.interests || [],
    course.dimensions || [],
    course.levels || []
  ),
  meta: [course.id, course.format, course.status, course.source].join(" ")
}));

test("normalize folds German diacritics, ß, punctuation, and whitespace", () => {
  assert.equal(Search.normalize("  Künstliche  Intelligenz & Größe! "), "kunstliche intelligenz and grosse");
});

test("cockpit topic and interest groups expose distinct accessible scopes", () => {
  assert.match(indexHtml, /class="selector-card"[^>]*role="group"/);
  assert.match(indexHtml, /id="topicChips"[^>]*aria-labelledby="topicLabel"[^>]*aria-describedby="topicHint"/);
  assert.match(indexHtml, /id="topicHint"[^>]*data-i18n="topic_filter_hint"/);
  assert.match(indexHtml, /id="interestChips"[^>]*aria-labelledby="interestLabel"[^>]*aria-describedby="interestHint"/);
  assert.match(indexHtml, /id="interestHint"[^>]*data-i18n="interests_hint"/);
  assert.doesNotMatch(indexHtml, /id="interestLabel"[^>]*data-i18n-title="interests_hint"/);
  assert.match(siteI18n.topic_filter_hint.en, /one topic.*scope results/i);
  assert.match(siteI18n.interests_hint.en, /shape which courses are recommended/i);
  assert.match(siteI18n.lrn_topic_many.en, /matching courses/);
  assert.match(siteI18n.lrn_topic_empty_body.en, /interests/);
  assert.match(siteI18n.lrn_search_topic_empty_body.en, /search.*current filters/i);
});

test("lrn i18n uses a supplied fallback for future data-driven labels", () => {
  const i18n = loadLrnI18n();
  assert.equal(i18n("known"), "Bekannt");
  assert.equal(i18n("topic_future", "Future topic"), "Future topic");
  assert.equal(i18n("topic_future_hint", "Future hint"), "Future hint");
});

test("topic helpers fall back to future LrnData labels and hints", () => {
  const { topicLabel, topicHint } = loadTopicHelpers();
  assert.equal(topicLabel("future"), "Future topic");
  assert.equal(topicHint("future"), "Future hint");
});

test("control render path rebuilds each chip group once", () => {
  const controls = lrnSource.match(/function renderControls\(\) \{[\s\S]*?\n  \}/)?.[0] || "";
  const render = lrnSource.match(/function render\(\) \{[\s\S]*?\n  \}/)?.[0] || "";
  assert.equal((controls.match(/renderInterestChips\(\)/g) || []).length, 1);
  assert.equal((controls.match(/renderTopicChips\(\)/g) || []).length, 1);
  assert.doesNotMatch(render, /renderInterestChips\(\)|renderTopicChips\(\)/);
});

test("topic selection keeps chip nodes stable and restores focus on clear", () => {
  const renderStart = lrnSource.indexOf("  function renderTopicChips(");
  const renderEnd = lrnSource.indexOf("\n\n  function topicLabel", renderStart);
  assert.ok(renderStart >= 0 && renderEnd > renderStart, "could not isolate topic chip renderer");
  const topicRender = lrnSource.slice(renderStart, renderEnd);
  const handlerStart = topicRender.indexOf('btn.addEventListener("click"');
  const handlerEnd = topicRender.indexOf("\n      return btn;", handlerStart);
  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart, "could not isolate topic click handler");
  assert.match(topicRender, /setAttribute\("data-topic", topic\.id \|\| ""\)/);
  assert.doesNotMatch(topicRender.slice(handlerStart, handlerEnd), /renderTopicChips\(\)/);
  assert.match(lrnSource, /function syncTopicChipState\(\)[\s\S]*?querySelectorAll\("\[data-topic\]"\)/);
  assert.match(lrnSource, /function focusAllTopicChip\(\)/);
  assert.match(lrnSource, /topicClearBtn\.addEventListener\("click", function \(\) \{\s*clearTopic\(true\);/);
  assert.match(lrnSource, /clearTopicButton\.addEventListener\("click", function \(\) \{\s*clearTopic\(true\);/);
});

test("parseQuery preserves quoted phrases and negative clauses", () => {
  const parsed = Search.parseQuery('"prompt engineering" -security');
  assert.deepEqual(parsed.positive.map((part) => [part.value, part.phrase]), [["prompt engineering", true]]);
  assert.deepEqual(parsed.negative.map((part) => part.value), ["security"]);
});

test("an exact title match outranks a summary-only match", () => {
  const ranked = Search.rank([
    { title: "Agent Evaluation", summary: "" },
    { title: "Evaluation Overview", summary: "Agent Evaluation" }
  ], "agent evaluation", { fields: { title: 9, summary: 3 } });
  assert.equal(ranked[0].item.title, "Agent Evaluation");
  assert.ok(ranked[0].score > ranked[1].score);
});

test("German Datenschutz semantically finds English GDPR content", () => {
  const ranked = Search.rank(items, "Datenschutz", options);
  assert.equal(ranked[0].item.id, "privacy");
  assert.ok(ranked[0].match.kinds.includes("semantic"));
  assert.ok(ranked[0].match.concepts.includes("privacy"));
});

test("German inflections and concepts handle a multi-term agent query", () => {
  const ranked = Search.rank(items, "Agenten testen", options);
  assert.equal(ranked[0].item.id, "agents");
  assert.equal(ranked[0].match.coverage, 1);
});

test("a common typo still finds the intended technical term", () => {
  const ranked = Search.rank(items, "retrival", options);
  assert.equal(ranked[0].item.id, "rag");
  assert.ok(ranked[0].match.kinds.includes("fuzzy"));
});

test("quoted phrases stay literal instead of expanding semantically", () => {
  const ranked = Search.rank([
    { title: "Prompt Engineering" },
    { title: "Prompt Design for Engineers" }
  ], '"prompt engineering"', { fields: { title: 9 } });
  assert.deepEqual(ranked.map((result) => result.item.title), ["Prompt Engineering"]);
});

test("negative syntax excludes an otherwise relevant result", () => {
  const ranked = Search.rank(items, "agent -security", options);
  assert.equal(ranked[0].item.id, "agents");
  assert.ok(!ranked.some((result) => result.item.id === "privacy"));
});

test("complete multi-term coverage ranks above a partial match", () => {
  const ranked = Search.rank([
    { title: "Agent Security", summary: "Test agent systems securely." },
    { title: "Agent Architecture", summary: "Build agent loops." }
  ], "agent security", { fields: { title: 9, summary: 3 } });
  assert.equal(ranked[0].item.title, "Agent Security");
  assert.equal(ranked[0].match.coverage, 1);
  assert.equal(ranked.length, 1);
});

test("short document tokens cannot create reverse-prefix false positives", () => {
  const ranked = Search.rank([
    { title: "A practical architecture" },
    { title: "Agent Architecture" }
  ], "Agenten", { fields: { title: 9 } });
  assert.deepEqual(ranked.map((result) => result.item.title), ["Agent Architecture"]);
});

test("literal relevance remains stronger than a semantic-only relation", () => {
  const ranked = Search.rank([
    { title: "Privacy Engineering", summary: "Data protection controls." },
    { title: "Responsible AI", summary: "GDPR and compliance." }
  ], "privacy", { fields: { title: 9, summary: 4 } });
  assert.equal(ranked[0].item.title, "Privacy Engineering");
});

test("array-valued fields are searchable", () => {
  const ranked = Search.rank(items, "knowledge", options);
  assert.equal(ranked[0].item.id, "rag");
});

test("topic filtering is exact, resettable, and returns an empty state for unknown topics", () => {
  const engineering = Search.filterByTopic(realCourses, "engineering");
  assert.ok(engineering.length > 0);
  assert.ok(engineering.every((course) => course.interests.includes("engineering")));
  assert.equal(Search.filterByTopic(engineering, null).length, engineering.length);
  assert.equal(Search.filterByTopic(realCourses, "not-a-real-topic").length, 0);
});

test("real LrnData keeps semantic free-text results inside the chosen topic", () => {
  const scoped = Search.filterByTopic(realCourses, "engineering");
  const ranked = Search.rank(scoped, "Agenten testen", {
    fields: { title: 9, topics: 5, summary: 4, meta: 2 }
  });
  assert.ok(ranked.length > 0);
  assert.ok(ranked.every((result) => result.item.interests.includes("engineering")));
  assert.equal(ranked[0].item.id, "LRN-26");
});

test("real LrnData topic alone can browse governance courses without a keyword", () => {
  const scoped = Search.filterByTopic(realCourses, "governance");
  assert.ok(scoped.length > 0);
  assert.ok(scoped.some((course) => course.title.includes("Responsible")));
  assert.ok(scoped.every((course) => course.interests.includes("governance")));
});

test("the six LrnData interests are all browseable topic scopes", () => {
  const topicIds = lrnData.interests.map((interest) => interest.id);
  assert.equal(topicIds.join(","), "foundation,productivity,consulting,engineering,governance,leadership");
  topicIds.forEach((topicId) => {
    const scoped = Search.filterByTopic(realCourses, topicId);
    assert.ok(scoped.length > 0, `${topicId} should contain at least one course`);
    assert.ok(scoped.every((course) => course.interests.includes(topicId)));
  });
});

test("clearing a topic restores the full corpus", () => {
  const scoped = Search.filterByTopic(realCourses, "engineering");
  assert.ok(scoped.length < realCourses.length);
  assert.deepEqual(Search.filterByTopic(realCourses, ""), realCourses);
  assert.deepEqual(Search.filterByTopic(realCourses, null), realCourses);
});

test("a topic plus an unmatched query stays empty instead of widening scope", () => {
  const scoped = Search.filterByTopic(realCourses, "governance");
  const ranked = Search.rank(scoped, "unicorn", options);
  assert.deepEqual(ranked, []);
  assert.ok(Search.filterByTopic(realCourses, "governance").every((course) => course.interests.includes("governance")));
});

test("ties keep the source order stable", () => {
  const ranked = Search.rank([
    { id: "first", title: "AI Basics" },
    { id: "second", title: "AI Basics" }
  ], "AI Basics", { fields: { title: 9 } });
  assert.deepEqual(ranked.map((result) => result.item.id), ["first", "second"]);
});

test("suggest proposes nearby vocabulary for a misspelling", () => {
  const suggestions = Search.suggest(items, "promt", { fields: { title: 1 }, suggestionLimit: 3 });
  assert.ok(suggestions.includes("prompt"));
});

test("the real course catalog resolves a bilingual intent to the right course", () => {
  const ranked = Search.rank(realCourses, "Agenten testen", {
    fields: { title: 9, topics: 5, summary: 4, meta: 2 }
  });
  assert.ok(["LRN-24", "LRN-26"].includes(ranked[0].item.id));
});
