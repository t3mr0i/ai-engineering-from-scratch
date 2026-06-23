# Prompt Pattern Picker — Decision Aid

One page. For any task, scan down to the right pattern, build the prompt using
the layer checklist, attach the right output contract, run the probe set.

---

## 1. Pick your pattern

| Task type | Pattern | Minimum prompt layers |
|---|---|---|
| Single, unambiguous output (classify, extract, transform) | Zero-shot instruction | Role + task + output contract |
| Quality defined by style or domain judgment | Few-shot with contract | Role + task + 2–3 examples + contract |
| Multi-step reasoning, arithmetic, logic proofs | Chain-of-thought | Task + "think step by step" + scratchpad field + final answer field |
| Regulated or domain-locked output (legal, GDPR, financial) | Persona + constraint | Tight role with credential scope + explicit exclusion list + contract |
| Task too broad for one prompt (> 3 distinct sub-goals) | Decompose and route | Break into sub-tasks; one prompt per sub-task; merge results in final call |
| High-stakes output, verification of prior LLM call | Critic-then-revise | Generator prompt + separate critic prompt with named rubric + revise prompt |

---

## 2. Build the five-layer prompt

Check off each layer as you write it. Omitting a layer is a deliberate decision — name the risk you are accepting.

- [ ] **Role / persona** — one sentence. "You are a [credential]. Your scope is [domain]."
- [ ] **Task statement** — one declarative sentence. Starts with a verb. Describes the output, not the process.
- [ ] **Scope constraints** — what to include, what to exclude, word/item count limits.
- [ ] **Output contract** — exact fields, types, and value constraints (see section 3 below).
- [ ] **Worked example** — one complete input → output pair that demonstrates the contract in action.

---

## 3. Choose an output contract format

| Complexity | Format | Example |
|---|---|---|
| 1–3 fields | Labelled template in prompt | `ANSWER: <text>`<br>`CONFIDENCE: low | medium | high` |
| 4–10 fields, some optional | JSON Schema in system prompt | `{"required": ["answer", "confidence"], "properties": {...}}` |
| Structured document | Section headers with required headings | `## Executive Summary\n## Risk\n## Next Steps` |
| Streamed or tool-use output | Function schema (OpenAI) / tool schema (Anthropic) | See model API docs |

**Value constraint rule:** if a field has a finite set of valid values, always enumerate them in the prompt and validate programmatically. Do not rely on the model to infer the constraint.

---

## 4. Build the probe set (minimum 3 inputs)

Run these before freezing the prompt and after every edit:

| Probe type | What to check |
|---|---|
| Typical case | All required contract fields present? Values in range? |
| Edge case (short, ambiguous, or missing input) | Does the model hallucinate or gracefully return a low-confidence signal? |
| Adversarial case (input designed to break the contract) | Does the output format survive? Any scope creep? |

---

## 5. Version-control checklist

Before committing a prompt to a shared system or repo:

- [ ] Prompt text stored in a named file, not embedded in application code.
- [ ] Probe set stored alongside the prompt (3 inputs + expected outputs).
- [ ] Output contract documented as a separate artifact (not only inline in the prompt).
- [ ] Any model-specific syntax (XML tags, JSON Schema enforcement) noted in a comment.
- [ ] "Last tested on model version: ___" recorded. Re-test after each model upgrade.

---

## 6. Common failure modes and fixes

| Symptom | Likely missing layer | Fix |
|---|---|---|
| Output format changes across runs | Output contract | Add a labelled-template or JSON Schema to the prompt |
| Model answers a different question | Task statement too vague | Rewrite as a single declarative sentence starting with a verb |
| Output too long / off-topic | Scope constraints | Add explicit word limit and an exclusion list |
| Reasoning looks right but answer is wrong | Chain-of-thought | Add a scratchpad field before the final answer field |
| One developer's prompts work; another's don't | No shared probe set | Create and commit the probe set; make it a team artifact |
| Output passes on test input, fails in production | Adversarial probe missing | Add at least one adversarial probe before freezing |

---

## 7. Model-portability notes (2026)

- **Claude Opus 4 / Sonnet 4 / Haiku 4:** use `<context>`, `<task>`, `<output>` XML tags for long prompts; they improve parsing accuracy per Anthropic docs.
- **Fable 5:** accepts JSON Schema directly in the system prompt for constrained output decoding.
- **GPT-4.1:** responds to markdown section headers as structural cues; less XML-sensitive.
- **Cross-model rule:** write the output contract in model-agnostic form first (labelled template or JSON Schema). Add model-specific syntax only where the model's docs say it helps.
