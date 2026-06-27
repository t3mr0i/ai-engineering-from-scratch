# AI Engineering Glossary

A working reference for **Technology Consultants (TCs)** shipping AI projects for
clients. Each term answers one question: **what does a TC need to know about
this to ship the project?**

Pure-math concepts and research-frontier theory are not here — when you need
them, ask a research collaborator.

Last reviewed: 2026-06-27. Vendor names and prices change quarterly; re-verify
before any procurement or contract.

---

## A

### Agent
- **What people say:** "An autonomous AI that thinks and acts on its own"
- **What it actually means:** A loop that calls an LLM, lets it pick a tool, executes that tool, feeds the result back, and repeats until done. The architecture under every "AI assistant" your client is buying. Cost and reliability are driven by loop length, tool-call count, and error handling between steps.
- **Ship it:** start every agent with a max-step limit (8-12 is normal) and a per-step budget. Without those, an agent can loop forever and blow the bill.
- **Watch out:** an agent's failure mode is silent drift — each step looks reasonable, the trajectory compounds into nonsense. Add a check on the final output, not just per-step.

### Attention
- **What people say:** "How the AI focuses on important parts"
- **What it actually means:** The mechanism that lets an LLM decide which prior tokens matter for the next one. Context window exists because attention's compute cost is quadratic in sequence length. Pricing, latency, and the cache-pricing math all derive from this.
- **Why it's called that:** by analogy to human selective attention — the 2017 paper "Attention Is All You Need" named it.

### Alignment
- **What people say:** "Making AI safe"
- **What it actually means:** How well the model's behavior matches the client's intent, including edge cases the prompt didn't anticipate. A client will say "the AI sounds rude" or "it gave a wrong answer" — that's an alignment problem, not a model-quality problem.
- **Ship it:** the eval harness must measure alignment to the specific client's tone, refusal policy, and domain constraints, not generic accuracy.

### Autoregressive
- **What people say:** "The AI generates one word at a time"
- **What it actually means:** The model generates output one token at a time, each conditioned on all previous tokens. This is why latency is dominated by output length — TTFT is fast, total time scales with tokens out. All current frontier chat models are autoregressive.

### AI Gateway
- **What people say:** "A proxy in front of LLMs"
- **What it actually means:** A proxy that sits between your app and one or more LLM providers. It centralizes auth, routing, retries, logging, cost attribution, and rate limiting. When the client asks "how do we govern model use across teams?" — the answer is a gateway.
- **Watch out:** a gateway adds latency (typically 5-30 ms) and is a single point of failure. Run it in HA from day one in any production engagement.

---

## C

### Context Window
- **What people say:** "How much the AI can remember"
- **What it actually means:** The max tokens (input + output) the model accepts in a single call. **This is not memory.** Each call starts fresh. Anything outside the window is invisible to the model.
- **Ship it:** pick a model whose context window covers your largest realistic input + output, with ~20% headroom. Don't pay for 1M-token contexts if your median prompt is 2K tokens.

### Chain of Thought (CoT)
- **What people say:** "Making the AI think step by step"
- **What it actually means:** Telling the model to "think step by step" before answering. It works because intermediate tokens condition the next-token prediction. Costs more (more output tokens) but buys accuracy on multi-step reasoning.
- **Ship it:** enable CoT on tasks with arithmetic, multi-hop retrieval, or chained logic. Skip it for simple lookups — the extra tokens add cost and latency for no gain.

### Chunking
- **What people say:** "Splitting documents into pieces"
- **What it actually means:** Splitting documents into pieces before embedding for RAG. Chunk size is the single biggest lever on retrieval quality.
- **Default:** 256-512 tokens, 10-20% overlap. Below 200, retrieval loses context. Above 1024, results dilute.
- **Ship it:** tune chunk size against a 100-200 question gold set, not vibes.

### Cosine Similarity
- **What people say:** "How similar two vectors are"
- **What it actually means:** The standard similarity metric between two embedding vectors. Range -1 to 1; in practice RAG results cluster between 0.5 and 0.95. The "how close is close enough?" threshold differs per embedding model — never borrow thresholds across models.
- **Why it matters:** it drives every similarity-search result the client sees. A wrong threshold = silently wrong answers.

### CUDA
- **What people say:** "GPU programming"
- **What it actually means:** NVIDIA's GPU compute platform. A TC rarely touches CUDA directly but pays for GPU hours on hosted inference (AWS, Azure, Modal, Replicate). Pricing models are GPU-hour based.

---

## E

### Embedding
- **What people say:** "Some AI magic that turns words into numbers"
- **What it actually means:** A vector representation of text (or images, audio, etc.) such that similar meaning → nearby vectors. This is what powers semantic search, RAG retrieval, recommendations, and clustering.
- **Ship it:** use a hosted embedder (`text-embedding-3-small`, `voyage-4`, `cohere-embed-v3`, or your gateway's default). Never roll your own.
- **Watch out:** different embedding models produce incompatible vector spaces. Switching models means re-embedding the entire corpus.

### Eval Harness
- **What people say:** "Tests for AI outputs"
- **What it actually means:** The test rig you build to grade model outputs. It is the document you hand a steering committee the morning the trade-off is questioned. Without one, every deployment is a hope.
- **Components:** a gold set (100+ labeled cases), a judge model or rubric, pass/fail thresholds tied to the SLO.
- **Watch out:** a single judge model is biased by its own training. Pairwise comparison reduces single-judge bias.

---

## F

### Few-Shot
- **What people say:** "Give the AI some examples first"
- **What it actually means:** Putting 3-5 examples in the prompt to show the model the format and behavior you want. Cheaper than fine-tuning, re-deployable in seconds.
- **Ship it:** use few-shot for output-format control (JSON shape, tone, edge-case handling). Skip it for tasks where zero-shot already works — the tokens cost money.

### Fine-Tuning
- **What people say:** "Training the AI on your data"
- **What it actually means:** Continuing training of a pre-trained model on your smaller, task-specific dataset. It changes model weights, not just prompts. Costs GPU hours + labeling time.
- **When to use:** when few-shot prompts get too long (you've pasted 50 examples) or when the model consistently fails on a domain-specific pattern.
- **Watch out:** fine-tuned models drift from base-model behavior. Plan re-tuning when the base model upgrades.

### Function Calling (Tool Use)
- **What people say:** "AI that can use tools"
- **What it actually means:** A structured protocol where the LLM outputs a JSON object naming a tool and its arguments; your code executes the tool; the result returns to the model. This is the **mechanism**; agents are the **loop**.
- **Ship it:** define tools with strict JSON Schema. Make every side effect explicit. Log every call for cost attribution and audit.

---

## G

### Guardrails
- **What people say:** "Safety filters for AI"
- **What it actually means:** Input/output filters around the LLM that detect prompt injection, PII leakage, off-topic responses, or unsafe outputs. A TC's job is to ship an LLM app into a regulated tenant without being the person who gets fired when something goes wrong.
- **Ship it:** defense-in-depth (input check → model → output check → audit log) catches ~95% of attacks at <50 ms latency overhead. A single layer catches ~70%.

### GPT
- **What people say:** "ChatGPT" or "The AI"
- **What it actually means:** OpenAI's family of decoder-only transformer models. Specific model names change quarterly — verify on the provider's pricing page before any client deliverable.

### Generative AI
- **What people say:** "AI that creates things"
- **What it actually means:** AI that produces novel outputs (text, images, code, audio) rather than classifying or scoring. Every client engagement you're on is in this bucket.

---

## H

### Hallucination
- **What people say:** "The AI is lying" or "making things up"
- **What it actually means:** The model produces plausible text that isn't grounded in the input or its training data. It is **not a bug to fix** — it is a property of how LLMs work. The job is to **bound** it: retrieval-grounded prompts, output validators, attribution display.
- **Ship it:** never deploy an LLM feature without (a) telling the user when output is uncertain, and (b) a path for the user to verify.

---

## I

### Inference
- **What people say:** "Running the AI"
- **What it actually means:** Running a trained model on new data. No weight updates. This is what you pay the provider for: input tokens + output tokens.
- **Cost levers:** model choice, prompt size, output size, caching, batching, region.

---

## L

### LLM (Large Language Model)
- **What people say:** "AI" or "the brain"
- **What it actually means:** A transformer-based model trained to predict the next token, on billions of parameters, on internet-scale text. The default building block of every AI engagement you'll see in 2026.
- **Vendor classes (re-verify quarterly):** frontier (Opus / GPT-class / Gemini-class), mini (smaller, cheaper, faster), and open-weight (Llama, Mistral, Qwen).

### Latency
- **What people say:** "How fast the AI responds"
- **What it actually means:** Two numbers that matter: **TTFT** (time to first token — perceived "snappiness") and **end-to-end** (last token out — total response time).
- **Ship it targets (2026 practice):** TTFT P50 < 500 ms, TTFT P99 < 2 s, end-to-end P99 < 8 s. Above these, support load spikes.

---

## M

### MCP (Model Context Protocol)
- **What people say:** "A way for AI to use tools"
- **What it actually means:** An open standard (JSON-RPC) for connecting LLMs to external tools and data sources. Anthropic released it November 2024; adopted across most major agent frameworks since.
- **Why a TC cares:** vendor-neutral. One MCP server works with any MCP-speaking host. The "USB-C for AI tools" framing is accurate.

### Multi-Modal
- **What people say:** "AI that handles images and audio"
- **What it actually means:** Models that accept or produce more than text (images, audio, video). Adds cost (vision tokens are expensive) and changes prompt shape. Always verify the model's modality matrix before scoping — "it accepts images" varies wildly (size limits, resolution limits, format support).

---

## O

### Output Tokens
- **What people say:** "What the model writes"
- **What it actually means:** What the model generates. **This is where the bill lives.** Output tokens cost 3-5x more than input tokens across major providers.
- **Ship it:** cap output length explicitly. Set max_tokens in every call. Streaming buys perceived latency but doesn't reduce token cost.

---

## P

### Prompt Engineering
- **What people say:** "Talking to AI the right way"
- **What it actually means:** Designing the input text — system prompt, few-shot examples, format instructions — to produce desired outputs reliably. The cheapest performance lever you have.
- **Ship it:** version-control prompts like code. A/B test against your eval harness. Treat prompt changes as deploys, not edits.

### Prompt Injection
- **What people say:** "Hacking the AI with words"
- **What it actually means:** A user (or a document the user supplies) overrides the system prompt via malicious input. The LLM equivalent of SQL injection. No complete solution exists.
- **Defense:** input validation + output filtering + privilege separation + retrieval grounding. The eval harness is your regression suite against new attack patterns.

### Perplexity
- **What people say:** "How confused the model is"
- **What it actually means:** A training/eval metric (exp of cross-entropy loss). Not directly actionable in delivery unless you're choosing between base models on a private benchmark.

---

## Q

### Quantization
- **What people say:** "Making the model smaller"
- **What it actually means:** Reducing the precision of model weights (float32 → int8 or int4) to shrink memory and speed inference. Trades a small accuracy loss for 4-8x size reduction.
- **When a TC sees this:** on hosted inference (provider picks the quantization) and when running open-weight models on smaller GPUs.

---

## R

### RAG (Retrieval-Augmented Generation)
- **What people say:** "AI that can search"
- **What it actually means:** Retrieve relevant documents from a knowledge base → stuff them into the prompt → let the LLM answer with that context. **The default pattern for any "ask the docs" client engagement.**
- **Ship it:** the eval harness must test retrieval quality separately from answer quality. A wrong chunk lookup surfaces as "the AI made something up" even when the LLM did its job.
- **Why it's called that:** Retrieval (find documents) + Augmented (add to prompt) + Generation (LLM writes the answer).

### RLHF (Reinforcement Learning from Human Feedback)
- **What people say:** "How they make AI helpful"
- **What it actually means:** The training pipeline that turns a base model into a chat model. Done by the vendor, not by you. The output is a model that's "helpful" in the vendor's definition of helpful.

### Reasoning Model
- **What people say:** "AI that thinks harder"
- **What it actually means:** Models that emit extended chain-of-thought before answering (o-series, Claude with extended thinking, Gemini Thinking). Higher cost and latency, higher accuracy on math/code/multi-step.
- **Ship it:** route only the hard queries to a reasoning model. Default to a fast model for lookups.

---

## S

### Semantic Search
- **What people say:** "Smart search that understands meaning"
- **What it actually means:** Finding documents by meaning, not keywords. Embed the query and all documents, return the closest. This is the retrieval half of RAG.
- **Watch out:** "payment failed" matches "transaction declined" — but also matches "the failure was non-payment." Embeddings don't understand negation.

### Streaming
- **What people say:** "Seeing the response appear word by word"
- **What it actually means:** The provider sends tokens as the model generates them (SSE or WebSocket), instead of waiting for the full response. Reduces perceived latency from seconds to milliseconds for the first token.
- **Ship it:** every chat UI should stream. Every batch job should not.

### System Prompt
- **What people say:** "The AI's instructions"
- **What it actually means:** The hidden instruction block at the start of the conversation that sets the model's persona, tone, and constraints. The TC's primary lever for shaping model behavior.
- **Watch out:** the system prompt is **not security**. A user prompt can override it via prompt injection. Treat the system prompt as UX copy, not a firewall.

### SFT (Supervised Fine-Tuning)
- **What people say:** "Teaching the model to follow instructions"
- **What it actually means:** Fine-tuning on (instruction, response) pairs. The standard way to teach a model a new task shape. Higher cost than few-shot; lower cost than RLHF.

---

## T

### Token
- **What people say:** "A word"
- **What it actually means:** The unit the model reads and writes. Not a word — a subword chunk (typically 3-4 characters in English). A sentence might be 20-40 tokens. **Pricing, context window, and latency all count in tokens, not words.**
- **Ship it:** count tokens before shipping. Use the provider's tokenizer for cost estimates, not your own.

### Temperature
- **What people say:** "Creativity setting"
- **What it actually means:** A knob on the sampling distribution. 0 = deterministic (always pick top token). 1 = default. Higher = more random.
- **Default for client work:** 0 for classification/extraction/JSON output. 0.7 for creative writing. Avoid >1 — quality drops fast.

### Transformer
- **What people say:** "The architecture behind modern AI"
- **What it actually means:** The architecture behind every modern LLM. You don't need to derive it. You need to know that **input cost scales with sequence length squared-ish (attention is quadratic)** — which is why long-context pricing is steeper than short-context.

---

## V

### Vector Database
- **What people say:** "A special database for AI"
- **What it actually means:** A database optimized for storing vectors and finding approximate nearest neighbors. Required infrastructure for any RAG system above ~10K documents.
- **Ship it:** pick a managed one (Pinecone, Weaviate, Qdrant Cloud, pgvector on Postgres). Self-host only when data residency demands it.

---

## Z

### Zero-Shot
- **What people say:** "No training needed"
- **What it actually means:** Asking the model to perform a task with no examples. Works because pre-training covered the pattern. Cheapest mode — use it first, escalate to few-shot only when zero-shot fails.