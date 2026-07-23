# Capstone 17 — Personal AI Tutor (Adaptive, Multimodal, with Memory)

> Khanmigo (Khan Academy), Duolingo Max, Google LearnLM / Gemini for Education, Quizlet Q-Chat, and Synthesis Tutor all shipped adaptive multimodal tutoring at scale in 2026. The common shape is a Socratic policy (never just dump the answer), a learner model that updates after every interaction (Bayesian knowledge tracing style), voice + text + photo-math input, curriculum graph retrieval, spaced-repetition scheduling, and hard safety filters for age-appropriate content. The capstone is to ship a subject-specific tutor (K-12 algebra or intro Python), run a two-week efficacy study with 10 learners, and pass a content-safety audit.

**Type:** Capstone
**Languages:** Python (backend, learner model), TypeScript (web app), SQL (curriculum graph via Postgres + Neo4j)
**Prerequisites:** Phase 5 (NLP), Phase 6 (speech), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 14 (agents), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 hours

## Problem

Adaptive tutoring used to be an ed-tech research niche. By 2026 it is a consumer product. Khanmigo is deployed across most US school districts. Duolingo Max hit tens of millions of MAUs. Google's LearnLM / Gemini for Education powers tutoring in Google Classroom. Quizlet Q-Chat sits alongside flashcards. Synthesis Tutor hit virality with tutor-for-curious-kids. The common elements: multimodal input (type, speak, photograph equations), Socratic pedagogy (ask first, explain later), a learner model that updates after each interaction, and strict age-appropriate safety.

You will build one of these for a specific cohort. The measurement bar is an actual efficacy study: pre-test and post-test scores over two weeks with 10 learners. The voice loop must feel natural (capstone 03 sub-stack). The memory must be privacy-respecting. The safety filter must pass COPPA-aware red-team for K-12.

## Concept

Four components. **Tutor policy** is a Socratic loop: when the learner asks for the answer, the policy asks a leading question; when they get it right, it moves to the next concept; when they are stuck, it offers a scaffolded hint. **Learner model** is Bayesian knowledge tracing (or a simple variant) that updates mastery probability per curriculum node after each interaction. **Curriculum graph** is a Neo4j of concepts with prerequisite edges; the policy walks the graph to pick the next concept. **Memory** is an episodic + semantic store (agentmemory-style) holding past interactions, mistakes, and preferences.

The UX is multimodal. Text input for typed answers. Voice input via LiveKit + Whisper (reuse capstone 03). Photo input for math problems via dots.ocr or PaliGemma 2. Voice output via Cartesia Sonic-2. Safety uses Llama Guard 4 plus an age-appropriate filter (blocks adult content, violence, self-harm) and a COPPA-aware memory retention policy.

The efficacy study is the deliverable. 10 learners, pre-test and post-test, two weeks. Report learning gain delta and confidence interval. Compare against a non-adaptive baseline (the same content delivered linearly without the tutor policy).

## Architecture

```
learner device
  |
  +-- text         -> web app
  +-- voice        -> LiveKit Agents (ASR + TTS)
  +-- photo math   -> dots.ocr / PaliGemma 2
       |
       v
  tutor policy (LangGraph)
       - Socratic decision head
       - next-concept chooser (curriculum graph walk)
       - hint scaffolder
       - mastery update
       |
       v
  learner model (BKT / item-response theory)
       - per-concept mastery probability
       - spaced-repetition scheduler (SM-2 or FSRS)
       |
       v
  memory (agentmemory-style)
       - episodic: every interaction
       - semantic: learned mistakes, preferences
       - retention policy: COPPA / GDPR aware
       |
       v
  curriculum graph (Neo4j)
       - prerequisite edges
       - OER content attached
       |
       v
  safety:
    Llama Guard 4 + age-appropriate filter
    memory access guarded by learner ID scope
```

## Stack

- Subject choice: K-12 algebra or intro Python (pick one for depth)
- Tutor policy: LangGraph over Claude Sonnet 4.7 (with prompt caching)
- Learner model: Bayesian knowledge tracing (classic) or FSRS for spacing
- Curriculum graph: Neo4j of concepts + prerequisite edges + OER content
- Memory: agentmemory-style persistent vector + episodic + semantic store
- Voice: LiveKit Agents 1.0 + Cartesia Sonic-2 (reuse capstone 03 sub-stack)
- Photo math: dots.ocr or PaliGemma 2 for equation recognition
- Safety: Llama Guard 4 + custom age-appropriate filter
- Eval: Bloom-level question generation, pre/post test harness, efficacy study tooling




## Further Reading

- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) — reference consumer K-12 tutor
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) — reference language-learning tutor
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) — hosted reference model
- [Quizlet Q-Chat](https://quizlet.com) — alternate reference
- [Synthesis Tutor](https://www.synthesis.com) — startup reference
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) — spaced-repetition scheduler
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) — learner-model classic
- [LiveKit Agents](https://github.com/livekit/agents) — voice stack
