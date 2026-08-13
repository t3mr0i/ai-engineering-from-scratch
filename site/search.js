/**
 * CurriculumSearch — small, dependency-free hybrid search for the static site.
 *
 * Combines literal phrase/token matching, lightweight English/German stemming,
 * typo tolerance, ordered-word proximity, and a bilingual AI concept map. The
 * concept layer is deliberately weaker than literal matches, so relevance stays
 * explainable while queries such as "Datenschutz" still find GDPR material.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CurriculumSearch = api;
}(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var STOP_WORDS = {
    a: true, an: true, and: true, are: true, for: true, in: true, of: true,
    on: true, or: true, the: true, to: true, with: true,
    der: true, die: true, das: true, ein: true, eine: true, einer: true,
    fur: true, im: true, in: true, mit: true, oder: true, und: true, von: true,
    zu: true, zur: true
  };

  // Curated domain vocabulary, not a claim of embedding-based similarity.
  // German and English aliases share one concept and therefore cross-match.
  var CONCEPTS = [
    ["artificial-intelligence", ["ai", "ki", "artificial intelligence", "kunstliche intelligenz"]],
    ["generative-ai", ["generative ai", "gen ai", "genai", "generative ki", "gen ki"]],
    ["language-models", ["llm", "llms", "large language model", "large language models", "language model", "sprachmodell", "sprachmodelle"]],
    ["prompting", ["prompt", "prompts", "prompting", "prompt engineering", "prompt design", "prompten", "prompts schreiben"]],
    ["agents", ["agent", "agents", "agentic", "agent loop", "multi agent", "multi-agent", "autonomous system", "agenten", "agentisch", "autonomes system"]],
    ["retrieval", ["rag", "retrieval augmented generation", "retrieval", "grounding", "vector search", "embedding search", "wissenssuche", "dokumentensuche"]],
    ["privacy", ["gdpr", "dsgvo", "privacy", "data protection", "datenschutz"]],
    ["governance", ["governance", "compliance", "responsible ai", "trustworthy ai", "responsible ki", "verantwortungsvolle ki", "ethics", "ethik", "guardrail", "guardrails"]],
    ["security", ["security", "sicherheit", "cybersecurity", "prompt injection", "jailbreak", "red teaming", "adversarial"]],
    ["evaluation", ["test", "tests", "testing", "qa", "evaluation", "evaluations", "eval", "evals", "quality assurance", "verification", "testen", "prufen", "uberprufung", "verifikation", "qualitatssicherung"]],
    ["software", ["code", "coding", "software engineering", "software development", "programming", "programmierung", "entwickeln", "copilot"]],
    ["automation", ["automation", "automatisierung", "workflow", "workflows", "process automation", "prozessautomatisierung"]],
    ["productivity", ["productivity", "produktivitat", "personal assistant", "office", "summarizing", "zusammenfassen", "ideation"]],
    ["business-value", ["use case", "use cases", "anwendungsfall", "anwendungsfalle", "business value", "geschaftswert", "roi", "prioritization", "priorisierung"]],
    ["data", ["data", "daten", "dataset", "datasets", "datenqualitat", "database", "datenbank"]],
    ["change", ["change management", "transformation", "stakeholder", "workforce", "fuhrung", "leadership", "veranderungsmanagement"]],
    ["sustainability", ["sustainability", "sustainable", "green ai", "green coding", "nachhaltigkeit", "nachhaltig"]],
    ["architecture", ["architecture", "system design", "distributed systems", "architektur", "systementwurf"]],
    ["tool-protocols", ["mcp", "model context protocol", "tool use", "function calling", "werkzeugnutzung"]],
    ["neural-networks", ["neural network", "neural networks", "deep learning", "neuronales netz", "neuronale netze", "backpropagation"]]
  ];

  var _conceptIndex = null;

  function normalize(value) {
    var text = String(value == null ? "" : value).toLowerCase();
    if (text.normalize) text = text.normalize("NFKD");
    return text
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9+#.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function words(value) {
    var clean = normalize(value);
    return clean ? clean.split(" ").filter(Boolean) : [];
  }

  function stem(token) {
    var value = normalize(token);
    if (value.length < 4) return value;

    // Common English possessive/inflection endings.
    value = value.replace(/(?:'s|s')$/, "");
    if (value.length > 6 && /ing$/.test(value)) value = value.slice(0, -3);
    else if (value.length > 5 && /ied$/.test(value)) value = value.slice(0, -3) + "y";
    else if (value.length > 5 && /ed$/.test(value)) value = value.slice(0, -2);
    else if (value.length > 5 && /es$/.test(value)) value = value.slice(0, -2);
    else if (value.length > 4 && /s$/.test(value) && !/ss$/.test(value)) value = value.slice(0, -1);

    // Conservative German suffix stripping. The length guards avoid turning
    // short technical tokens such as "rag" or "eval" into noise.
    if (value.length > 7 && /(?:ern|est)$/.test(value)) value = value.slice(0, -3);
    else if (value.length > 6 && /(?:em|en|er|es)$/.test(value)) value = value.slice(0, -2);
    else if (value.length > 5 && /(?:e|n)$/.test(value)) value = value.slice(0, -1);
    return value;
  }

  function editDistance(a, b, limit) {
    if (a === b) return 0;
    if (!a || !b) return Math.max(a.length, b.length);
    if (Math.abs(a.length - b.length) > limit) return limit + 1;

    var previous = [];
    var current = [];
    for (var j = 0; j <= b.length; j += 1) previous[j] = j;

    for (var i = 1; i <= a.length; i += 1) {
      current[0] = i;
      var rowMin = current[0];
      for (j = 1; j <= b.length; j += 1) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + cost
        );
        if (current[j] < rowMin) rowMin = current[j];
      }
      if (rowMin > limit) return limit + 1;
      var swap = previous;
      previous = current;
      current = swap;
    }
    return previous[b.length];
  }

  function conceptIndex() {
    if (_conceptIndex) return _conceptIndex;
    var aliases = [];
    var byId = {};
    CONCEPTS.forEach(function (entry) {
      var id = entry[0];
      var normalizedAliases = entry[1].map(normalize).filter(Boolean);
      byId[id] = normalizedAliases;
      normalizedAliases.forEach(function (alias) {
        aliases.push({ id: id, alias: alias });
      });
    });
    // Prefer the more specific phrase when aliases overlap ("generative ai"
    // before "ai", "prompt injection" before "prompt").
    aliases.sort(function (a, b) { return b.alias.length - a.alias.length; });
    _conceptIndex = { aliases: aliases, byId: byId };
    return _conceptIndex;
  }

  function conceptsFor(value) {
    var clean = normalize(value);
    if (!clean) return [];
    var padded = " " + clean + " ";
    var found = {};
    conceptIndex().aliases.forEach(function (entry) {
      var exact = clean === entry.alias;
      var phrase = padded.indexOf(" " + entry.alias + " ") !== -1;
      // Compound fallback helps German terms such as "Agentensicherheit".
      var compound = entry.alias.length >= 5 && clean.indexOf(entry.alias) !== -1;
      if (exact || phrase || compound) found[entry.id] = true;
    });
    return Object.keys(found);
  }

  function parseQuery(query) {
    var clauses = [];
    var source = String(query == null ? "" : query);
    var re = /(-?)"([^"]+)"|(-?)([^\s"]+)/g;
    var match;

    while ((match = re.exec(source))) {
      var excluded = (match[1] || match[3]) === "-";
      var quoted = match[2] != null;
      var value = normalize(quoted ? match[2] : match[4]);
      if (!value) continue;

      if (quoted) {
        clauses.push({ value: value, phrase: true, excluded: excluded, concepts: conceptsFor(value) });
        continue;
      }

      var tokens = words(value).filter(function (token) {
        return !STOP_WORDS[token];
      });
      // A stop-word-only query should still behave literally instead of
      // returning every item.
      if (!tokens.length) tokens = words(value);
      tokens.forEach(function (token) {
        clauses.push({ value: token, phrase: false, excluded: excluded, concepts: conceptsFor(token) });
      });
    }

    return {
      raw: source.trim(),
      normalized: normalize(source.replace(/^-|\s-/g, " ").replace(/"/g, "")),
      positive: clauses.filter(function (clause) { return !clause.excluded; }),
      negative: clauses.filter(function (clause) { return clause.excluded; })
    };
  }

  function fieldEntries(item, fields) {
    var spec = fields || { name: 8, summary: 3, keywords: 4 };
    return Object.keys(spec).map(function (key) {
      var raw = item && item[key] != null
        ? (Array.isArray(item[key]) ? item[key].join(" ") : String(item[key]))
        : "";
      var normalized = normalize(raw);
      var tokens = words(normalized);
      var tokenSet = {};
      var stemSet = {};
      tokens.forEach(function (token) {
        tokenSet[token] = true;
        stemSet[stem(token)] = true;
      });
      return {
        key: key,
        weight: Number(spec[key]) || 1,
        raw: raw,
        normalized: normalized,
        tokens: tokens,
        tokenSet: tokenSet,
        stemSet: stemSet,
        concepts: conceptsFor(normalized)
      };
    }).filter(function (field) { return field.normalized; });
  }

  function conceptOverlap(left, right) {
    for (var i = 0; i < left.length; i += 1) {
      if (right.indexOf(left[i]) !== -1) return left[i];
    }
    return "";
  }

  function literalMatch(field, clause) {
    var value = clause.value;
    var padded = " " + field.normalized + " ";
    if (field.normalized === value) return { base: 30, kind: "exact", term: value };
    if (padded.indexOf(" " + value + " ") !== -1) {
      return { base: clause.phrase ? 22 : 18, kind: clause.phrase ? "phrase" : "token", term: value };
    }
    if (clause.phrase && field.normalized.indexOf(value) !== -1) {
      return { base: 18, kind: "phrase", term: value };
    }

    if (!clause.phrase && value.length >= 2) {
      for (var i = 0; i < field.tokens.length; i += 1) {
        var token = field.tokens[i];
        var queryStartsToken = token.length >= 4 && value.indexOf(token) === 0;
        if (token.indexOf(value) === 0 || queryStartsToken) {
          return { base: 11, kind: "prefix", term: token };
        }
      }
    }

    var wantedStem = stem(value);
    if (!clause.phrase && wantedStem.length >= 4 && field.stemSet[wantedStem]) {
      return { base: 10, kind: "stem", term: value };
    }

    if (!clause.phrase && value.length >= 4) {
      var limit = value.length >= 8 ? 2 : 1;
      for (i = 0; i < field.tokens.length; i += 1) {
        token = field.tokens[i];
        if (token.length < 4 || Math.abs(token.length - value.length) > limit) continue;
        if (editDistance(value, token, limit) <= limit) {
          return { base: 7, kind: "fuzzy", term: token };
        }
      }
    }
    return null;
  }

  function clauseMatch(fields, clause) {
    var best = null;
    fields.forEach(function (field) {
      var literal = literalMatch(field, clause);
      var candidate = literal ? {
        score: literal.base * field.weight,
        kind: literal.kind,
        field: field.key,
        term: literal.term,
        concept: ""
      } : null;

      // Quotation marks are an explicit syntax contract: quoted clauses only
      // match the literal phrase and never broaden through the concept map.
      var semanticConcept = clause.phrase ? "" : conceptOverlap(clause.concepts, field.concepts);
      if (semanticConcept) {
        var semantic = {
          score: 5 * field.weight,
          kind: "semantic",
          field: field.key,
          term: clause.value,
          concept: semanticConcept
        };
        if (!candidate || semantic.score > candidate.score) candidate = semantic;
      }

      if (!best || (candidate && candidate.score > best.score)) best = candidate;
    });
    return best;
  }

  function hasNegativeMatch(fields, clause) {
    return fields.some(function (field) {
      if (literalMatch(field, clause)) return true;
      return Boolean(conceptOverlap(clause.concepts, field.concepts));
    });
  }

  function sequenceBonus(fields, positiveClauses) {
    if (positiveClauses.length < 2) return 0;
    var values = positiveClauses.map(function (clause) { return stem(clause.value); });
    var best = 0;

    fields.forEach(function (field) {
      var positions = [];
      var cursor = -1;
      for (var i = 0; i < values.length; i += 1) {
        var found = -1;
        for (var j = cursor + 1; j < field.tokens.length; j += 1) {
          if (stem(field.tokens[j]) === values[i]) { found = j; break; }
        }
        if (found === -1) return;
        positions.push(found);
        cursor = found;
      }
      var spread = positions[positions.length - 1] - positions[0] + 1;
      var compactness = values.length / Math.max(values.length, spread);
      best = Math.max(best, Math.round(8 * field.weight * compactness));
    });
    return best;
  }

  function score(item, query, options) {
    var parsed = typeof query === "string" ? parseQuery(query) : query;
    if (!parsed.positive.length) return null;
    var fields = fieldEntries(item, options && options.fields);
    if (!fields.length) return null;

    if (parsed.negative.some(function (clause) { return hasNegativeMatch(fields, clause); })) {
      return null;
    }

    var matches = [];
    parsed.positive.forEach(function (clause) {
      var match = clauseMatch(fields, clause);
      if (match) matches.push(match);
    });
    if (!matches.length) return null;

    var coverage = matches.length / parsed.positive.length;
    var minimumCoverage = parsed.positive.length <= 2 ? 0.5 : 0.6;
    if (coverage < minimumCoverage) return null;

    var total = matches.reduce(function (sum, match) { return sum + match.score; }, 0);
    if (coverage === 1) total += 24 + sequenceBonus(fields, parsed.positive);
    else total *= 0.45 + (coverage * 0.45);

    if (parsed.normalized) {
      fields.forEach(function (field) {
        if (field.normalized === parsed.normalized) total += 40 * field.weight;
        else if (field.normalized.indexOf(parsed.normalized) !== -1) total += 14 * field.weight;
      });
    }

    var kinds = {};
    var matchedFields = {};
    var matchedTerms = {};
    var matchedConcepts = {};
    matches.forEach(function (match) {
      kinds[match.kind] = true;
      matchedFields[match.field] = true;
      matchedTerms[match.term] = true;
      if (match.concept) matchedConcepts[match.concept] = true;
    });

    return {
      score: Math.round(total * 100) / 100,
      coverage: coverage,
      kinds: Object.keys(kinds),
      fields: Object.keys(matchedFields),
      terms: Object.keys(matchedTerms),
      concepts: Object.keys(matchedConcepts)
    };
  }

  function rank(items, query, options) {
    var parsed = parseQuery(query);
    if (!parsed.positive.length) return [];
    var limit = options && Number(options.limit);
    var ranked = [];

    (items || []).forEach(function (item, index) {
      var match = score(item, parsed, options || {});
      if (!match) return;
      ranked.push({ item: item, score: match.score, match: match, index: index });
    });

    // Multi-term queries behave like an AND when at least one complete match
    // exists. Partial matches remain a useful fallback only when the corpus has
    // no item covering the full intent.
    if (parsed.positive.length > 1) {
      var complete = ranked.filter(function (result) { return result.match.coverage === 1; });
      if (complete.length) ranked = complete;
    }

    ranked.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });
    return limit > 0 ? ranked.slice(0, limit) : ranked;
  }

  // Keep explicit topic scoping separate from full-text relevance. A topic is
  // a structured course field (usually an LrnData interest id), so matching it
  // must stay exact after normalization; semantic search can then rank only the
  // already-scoped corpus. An empty topic is the intentional "all topics"
  // state and returns a copy so callers can safely reset without mutating data.
  function filterByTopic(items, topic, options) {
    var wanted = normalize(topic);
    var field = options && options.field ? options.field : "interests";
    return (items || []).filter(function (item) {
      if (!wanted) return true;
      var values = item && item[field];
      if (!Array.isArray(values)) values = values == null ? [] : [values];
      return values.some(function (value) {
        return normalize(value) === wanted;
      });
    });
  }

  function topicCounts(items, options) {
    var field = options && options.field ? options.field : "interests";
    return (items || []).reduce(function (counts, item) {
      var values = item && item[field];
      if (!Array.isArray(values)) values = values == null ? [] : [values];
      values.forEach(function (value) {
        var key = normalize(value);
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    }, {});
  }

  function suggest(items, query, options) {
    var parsed = parseQuery(query);
    var wanted = parsed.positive.length ? parsed.positive[0].value : normalize(query);
    if (!wanted || wanted.length < 3) return [];
    var vocabulary = {};
    var fields = options && options.fields ? options.fields : { name: 1, title: 1, keywords: 1 };

    (items || []).forEach(function (item) {
      fieldEntries(item, fields).forEach(function (field) {
        field.tokens.forEach(function (token) {
          if (token.length >= 3 && !STOP_WORDS[token]) vocabulary[token] = (vocabulary[token] || 0) + 1;
        });
      });
    });

    var maxDistance = wanted.length >= 8 ? 3 : 2;
    return Object.keys(vocabulary).map(function (token) {
      return { value: token, distance: editDistance(wanted, token, maxDistance), frequency: vocabulary[token] };
    }).filter(function (entry) {
      return entry.distance <= maxDistance && entry.value !== wanted;
    }).sort(function (a, b) {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      return a.value.localeCompare(b.value);
    }).slice(0, (options && options.suggestionLimit) || 3).map(function (entry) {
      return entry.value;
    });
  }

  return {
    normalize: normalize,
    stem: stem,
    parseQuery: parseQuery,
    editDistance: editDistance,
    score: score,
    rank: rank,
    filterByTopic: filterByTopic,
    topicCounts: topicCounts,
    suggest: suggest
  };
}));
