# The AI Champion Playbook: Knowledge Transfer That Actually Sticks (2026)

> A 2025 Gartner survey found that 67% of enterprise AI pilots fail to scale past the team that ran them — not because the technology was wrong, but because no structured mechanism existed to move the learning outward. The AI Champion role is that mechanism: a named individual or small cohort responsible for brown bags, communities of practice (CoPs), internal toolkits, and piloting new AI approaches before the rest of the organization has to absorb the risk. In 2026, the job is harder than it was 18 months ago because the landscape moves faster — Anthropic releases Fable 5 and major Sonnet/Haiku 4.x updates on a cadence measured in weeks, not quarters. A champion who cannot distinguish a meaningful capability shift from a changelog footnote will create noise instead of signal. The difference between a champion and an enthusiast is that the champion produces reusable artifacts: a decision aid that survives their absence, an eval harness that catches regressions, a structured session that transfers skill rather than enthusiasm.

**Type:** Learn
**Languages:** Python (stdlib — enablement-session planner and artifact prioritizer)
**Prerequisites:** Phase 13 · 22 (Skills and agent SDKs), Phase 19 · 27 (Eval harness and fixture tasks)
**Time:** ~45 minutes

## The Problem

Most AI Champions start strong and then stall. The first brown bag fills the room. The second one gets scheduled and cancelled twice. By month three, the champion is answering the same five questions in Slack DMs, the CoP Confluence page has not been touched since the kickoff, and the pilot project the champion ran six months ago has no successor because no one else understood it well enough to repeat it. This is not a motivation problem. It is a structure problem: the champion had no explicit model for what "knowledge transfer" actually produces and how to sequence the work.

The engineering question underneath the organizational one is sharper: how do you decide which AI artifact to build next — a prompt template, a skill file, an eval, a reference implementation, a recorded session — given finite time, a moving technology target, and colleagues at wildly different levels of AI literacy? The wrong answer is "whatever someone asks for." That path produces one-off demos that do not compose. The right answer requires a triage model: classify the audience by level and the knowledge by type, then match artifact format to that pair. A working consultant needs a one-page decision aid, not a Jupyter notebook. A platform engineer needs a parameterized skill file with tests, not a deck.

## The Concept

### The four outputs of an AI Champion

An effective champion produces exactly four kinds of artifact. Producing any fewer leaves gaps; producing more dilutes the repeatable ones.

| Artifact type | What it is | Who consumes it | Shelf life |
|---|---|---|---|
| **Session** | Brown bag, CoP meeting, or structured workshop | Anyone; synchronous | Short — must be recorded or distilled |
| **Decision aid** | One-page checklist or table that answers one choice (model, tool, pattern) | Individual contributor, consultant | Medium — update when a major capability shift lands |
| **Reference implementation** | Runnable code that makes one pattern explicit and testable | Engineer, tech lead | Medium-long — but must include an eval or it rots |
| **Eval harness** | Fixture tasks + scoring rubric that catches model-quality regressions | Platform, team lead | Long — the eval outlives the model that motivated it |

Sessions are the most visible artifact and the least reusable. In our experience, the majority of new champions over-index on sessions in their first six months because sessions generate enthusiasm immediately. The structural move is to treat every session as a factory: the session produces a decision aid and a reference implementation; those produce an eval harness. If a session produces only a recording, the champion has extracted no compounding value.

### Audience triage

Colleagues are not uniformly prepared. A single brown bag aimed at "everyone" serves no one well. Use a three-level triage before designing any session or artifact:

| Level | Characteristic | Right artifact | Common mistake |
|---|---|---|---|
| **L1 — Aware** | Knows AI exists; uses consumer tools (ChatGPT, Copilot autocomplete); no prompt engineering practice | Decision aid + demo | Technical reference implementation they cannot run |
| **L2 — Practitioner** | Has written prompts deliberately; uses Copilot Chat or an LLM API; understands tokens at a conceptual level | Reference implementation + annotated prompt library | Eval harness without the pattern it tests |
| **L3 — Builder** | Has shipped an LLM-powered feature or agent; reads changelogs; compares models empirically | Eval harness + skill files (Phase 13 · 22) | Repeat of L2 content they already internalized |

A CoP meeting that works is a session designed for L2 with a take-home artifact at L1 (the decision aid) and a follow-up pointer for L3 (the eval or skill file from Phase 19 · 27). Running three audience-specific threads in parallel is expensive; running one undifferentiated thread is ineffective.

### Piloting new AI approaches: the three-gate model

The champion's second function — beyond knowledge transfer — is to absorb the risk of trying new AI approaches before the team does. This is a valuable service only if the pilot produces a verdict the team can act on. Use three explicit gates:

1. **Feasibility gate.** Does the approach work at all on a representative input? Scope: two days, one engineer. Output: a working prototype that can be demoed, with the failure cases documented. No eval required yet.
2. **Quality gate.** Does it work reliably enough to hand to a practitioner? Scope: one sprint. Output: an eval harness (Phase 19 · 27) that quantifies pass rate on fixture tasks. The champion does not proceed to step 3 until the harness exists.
3. **Transfer gate.** Can someone who was not on the pilot reproduce the result and improve it? Scope: one sprint. Output: a decision aid and reference implementation that a colleague not involved in the pilot can run and extend without the champion present.

A pilot that does not pass all three gates should not be scaled. The most common failure is a pilot that passes gate 1 and then gets deployed at gate 1 quality because there was social pressure to ship. The eval harness at gate 2 is the technical check on that pressure.

### Changelog literacy: separating signal from noise

Model capability announcements arrive weekly. An AI Champion who reacts to every announcement creates alert fatigue. A champion who ignores announcements misses a capability shift that should change a decision aid. The practical filter:

- **Ignore:** speed/pricing changes, minor safety tweaks, context window increments below 50%. These rarely change what a practitioner should do.
- **Update decision aids for:** new tool-use capabilities (especially MCP server support or computer use), a new output modality, a new primary model that outperforms the previous one on the eval the team cares about, a new permission or safety mode (Phase 15 · 10).
- **Run a new pilot for:** a new agent architecture, a substantially new reasoning capability (extended thinking, adaptive thinking), a new training approach that changes behavior in a class of tasks the team runs.

The Anthropic changelog and GitHub Copilot changelog (see Further Reading) are the two highest-value sources for a LHIND Technology Consulting champion. Model updates from Anthropic in 2026 follow a named series — Sonnet 4.x and Haiku 4.x for everyday work, Opus 4.x for reasoning-heavy tasks, Fable 5 for the latest multimodal and agentic frontier — and the champion's job is to track when a new named model crosses the team's quality bar on the evals that matter, not to announce every release.

### Running a community of practice that survives year two

Most CoPs die in month four. The three structural reasons:

1. **No recurring artifact.** The CoP meets but produces nothing that persists. Fix: every meeting must close with one updated artifact (a decision aid row, a new fixture task in the eval harness, a new entry in the prompt library).
2. **Single-threaded facilitation.** When the champion is unavailable, the CoP does not meet. Fix: rotate facilitation. The champion authors the session skeleton; a different practitioner runs it each time. This also tests whether the knowledge has transferred.
3. **No success metric.** Nobody knows whether the CoP is working. Fix: define one lagging indicator (time-to-first-working-LLM-feature for a new team member) and one leading indicator (decision-aid usage, measured by Confluence views or Slack link shares). Review quarterly.

The CoP's technical anchor should be the eval harness from Phase 19 · 27. Running the harness before and after a capability update is a meeting agenda that generates genuine signal rather than enthusiasm.

## Use It

`code/main.py` models the two core champion decisions in a deterministic, stdlib-only form:

1. An **artifact prioritizer** that takes a (audience level, knowledge type) pair and returns the recommended artifact format plus the next artifact to produce in the compounding chain.
2. A **pilot gate evaluator** that takes a pilot's current evidence and returns which gate it has passed, which it has not, and what the champion must produce before proceeding.

The driver runs a synthetic set of champion scenarios and prints a recommendation for each, ending in a HEADLINE that states the core structural finding.

## Ship It

`outputs/skill-ai-champion-triage.md` is a one-page decision aid for a working champion: given an incoming request (brown bag, pilot, Slack question, CoP agenda), the table tells you which artifact to produce, for which audience level, and what the next compounding artifact is. Paste it into your team wiki and update the model column when a major capability shift lands.


## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| AI Champion | "Our AI person" | A named role responsible for structured knowledge transfer, CoP facilitation, and piloting new AI approaches with a defined artifact chain |
| Community of Practice (CoP) | "Our AI group chat / meeting" | A recurring structured forum that produces persistent artifacts; dies without a recurring output and a success metric |
| Decision aid | "A cheat sheet" | A one-page, paste-and-use table or checklist that answers one specific choice; designed for L1/L2 audiences and updated on major capability shifts |
| Eval harness | "The tests for the AI" | Fixture tasks with a scoring rubric that catches model-quality regressions; the technical anchor for gate 2 of a pilot and for a long-lived CoP |
| Pilot gate | "We're testing it" | One of three explicit checkpoints (feasibility, quality, transfer) before a new AI approach is scaled to the team |
| Changelog literacy | "Keeping up with AI news" | A triage discipline: distinguishing capability shifts that change a decision aid from noise that does not warrant a team response |
| Audience level | "Where people are" | L1 (aware), L2 (practitioner), L3 (builder) — the primary variable in artifact format selection |
| Compounding chain | "Building on what we have" | Session → decision aid → reference implementation → eval harness; each artifact enables the next |

## Consultant field notes

- **The prompt that worked in the demo but failed in production.** A single staged example with a friendly audience hides variance; production traffic surfaces the long tail of malformed inputs and adversarial contexts. Lesson: if a prompt only has anecdotal validation, it is not a deliverable — it is a prototype that needs the eval harness before anyone else depends on it.
- **The RAG that returned the right doc but the wrong paragraph.** Embedding recall can be high while chunking strategy makes the cited passage irrelevant to the question. Lesson: an eval harness that scores retrieval at the passage level, not the document level, catches what document-level metrics miss.
- **The vendor pilot that never made it past the security review.** A promising tool enters a six-week evaluation; legal and infosec receive it on week five and the architecture must be redesigned. Lesson: route vendor and tooling pilots through security and architecture intake before the feasibility gate, not after.
- **The use case everyone approved but nobody wanted.** A steering committee greenlights a use case because the slides are clean; field users keep doing it the old way because the AI workflow does not fit their actual job. Lesson: the champion must run a transfer-gate dry run with a real user who was not in the requirements session before declaring a use case adopted.
- **The AI feature that hit a cost ceiling in month two.** A feature is priced on a per-call basis, launched at modest volume, and the bill compounds faster than the usage curve. Lesson: cost is a capability and must be evaluated at the quality gate with a representative traffic mix, not deferred to a post-launch FinOps review.

## Further Reading

- [Anthropic — Model changelog and release notes](https://www.anthropic.com/news) — the primary source for model capability updates; scan for new tool-use modes, reasoning capabilities, and named model series.
- [GitHub Changelog — Copilot label](https://github.blog/changelog/label/copilot/) — the reliable currency source for Copilot surface changes; Copilot's capability ladder (Phase 11 · 70) changes monthly.
- [Community of Practice: A Brief Introduction — Wenger-Trayner](https://wenger-trayner.com/introduction-to-communities-of-practice/) — the original structural framing; short and directly applicable.
- [DORA Research — Accelerate: The Science of Lean Software and DevOps](https://dora.dev/research/) — the quantitative playbook for measuring whether an enablement intervention actually moves team velocity; the methods transfer directly to AI Champion success metrics.
- [Anthropic — Responsible scaling policy](https://www.anthropic.com/rsp) — the framework Anthropic uses to gate its own capability releases; useful as a reference model when designing the three-gate pilot process.
