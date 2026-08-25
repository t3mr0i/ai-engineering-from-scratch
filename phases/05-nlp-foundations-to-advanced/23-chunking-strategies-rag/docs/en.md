# Chunking Strategies for RAG

> Chunking configuration influences retrieval quality as much as the choice of embedding model (Vectara NAACL 2025). Get chunking wrong and no amount of reranking saves you.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 5 · 14 (Information Retrieval), Phase 5 · 22 (Embedding Models)
**Time:** ~60 minutes

## Learning Objectives

- Explain the core mechanism in Chunking Strategies for RAG and place it in an NLP pipeline
- Implement the central transformation behind Chunking Strategies for RAG from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Chunking Strategies for RAG

## The Problem

You put a 50-page contract into a RAG system. User asks: "What is the termination clause?" The retriever returns the cover page. Why? Because the model was trained on 512-token chunks and the termination clause sits 20 pages in, split across a page break, with no local keywords tying it to the query.

The fix is not "buy a better embedding model." The fix is chunking. How big? Overlap? Where to split? With surrounding context?

Feb 2026 benchmarks show surprising results:

- Published chunking comparisons disagree across corpora; treat chunk size, overlap, and semantic splitting as eval parameters rather than universal winners.
- SPLADE + Ministral-8B on Natural Questions: overlap provided zero measurable benefit.
- Context cliff: response quality drops sharply around 2,500 tokens of context.

The "obvious" answer (semantic chunking, 20% overlap, 1000 tokens) is often wrong. This lesson builds intuition for six strategies and tells you when to reach for which.

Every call below reuses this `lrn_llm` setup — run it once:

```python editable
import sys, json, types
lrn_llm = types.ModuleType("lrn_llm")
try:
    from pyodide.http import pyfetch as _pyfetch
    _IN_PYODIDE = True
except ImportError:
    import urllib.request as _urlreq
    _IN_PYODIDE = False
lrn_llm.API_BASE = "/api/llm"  # same-origin proxy; server injects the gateway key
lrn_llm.DEFAULT_MODEL = "azure/gpt-5.4-mini"
lrn_llm.API_KEY = ""  # optional; set in Step 0a

async def _lrn_call(messages, *, system=None, max_tokens=400, model=None):
    if system is not None:
        messages = [{"role": "system", "content": system}] + list(messages)
    payload = {"model": model or lrn_llm.DEFAULT_MODEL, "messages": messages,
               "max_completion_tokens": max_tokens}
    headers = {"content-type": "application/json"}
    _key = lrn_llm.API_KEY
    if _key:
        headers["Authorization"] = "Bearer " + _key
    url = lrn_llm.API_BASE.rstrip("/") + "/chat/completions"
    body = json.dumps(payload)
    if _IN_PYODIDE:
        r = await _pyfetch(url, method="POST", headers=headers, body=body)
        data = await r.json()
    else:
        req = _urlreq.Request(url, method="POST", headers=headers, data=body.encode("utf-8"))
        with _urlreq.urlopen(req, timeout=60) as r:
            data = json.loads(r.read())
    if "error" in data:
        raise RuntimeError("LLM error: " + str(data["error"]))
    return data

def _lrn_text(r):
    ch = (r or {}).get("choices") or []
    return (ch[0].get("message", {}) or {}).get("content", "") if ch else ""

async def _lrn_ping():
    r = await _lrn_call([{"role": "user", "content": "Reply with exactly: OK"}], max_tokens=5)
    return {"ok": _lrn_text(r).strip().upper().startswith("OK"), "model": r.get("model")}

lrn_llm.call = _lrn_call
lrn_llm.text = _lrn_text
lrn_llm.ping = _lrn_ping
print("✅ notebook ready · endpoint:", lrn_llm.API_BASE)
```

Generate a synthetic contract excerpt to chunk against for the rest of this lesson:

```python editable
# Generate a synthetic contract excerpt that mimics a real document
contract_prompt = """Generate a 2000-character professional employment contract excerpt with these sections:
1. Title and parties (100 chars)
2. Job description (300 chars)
3. Compensation (200 chars)
4. Term and termination (400 chars)
5. Severance clause (400 chars)
6. Confidentiality (300 chars)
7. IP assignment (300 chars)

Make it realistic legal text with proper formatting."""

r = await lrn_llm.call([{"role": "user", "content": contract_prompt}], max_tokens=500)
contract_text = lrn_llm.text(r)
print(f"Contract excerpt ({len(contract_text)} chars):\n")
print(contract_text[:1000] + "...\n[truncated for display]")
```

## The Concept

![Six chunking strategies visualized on one passage](../assets/chunking.svg)

**Fixed chunking.** Split every N characters or tokens. Simplest baseline. Breaks mid-sentence. Good compression, bad coherence.

```python editable
def chunk_fixed(text, size=512, overlap=0):
    """Split text into fixed-size chunks (character-based)."""
    step = size - overlap
    return [text[i:i + size] for i in range(0, len(text), step)]

# Apply fixed chunking
fixed_chunks = chunk_fixed(contract_text, size=512, overlap=0)
print(f"Fixed chunking (512 chars, no overlap): {len(fixed_chunks)} chunks")
print(f"\nFirst chunk preview:\n{fixed_chunks[0][:200]}...")
```

**Recursive.** LangChain's `RecursiveCharacterTextSplitter`. Try splitting on `\n\n` first, then `\n`, then `.`, then space. Falls back cleanly. The 2026 default.

```python editable
def chunk_recursive(text, size=512, seps=("\n\n", "\n", ". ", " ")):
    """Recursively split on separators, preserving boundaries."""
    if len(text) <= size:
        return [text]
    for sep in seps:
        if sep not in text:
            continue
        parts = text.split(sep)
        chunks = []
        buf = ""
        for p in parts:
            if len(p) > size:
                if buf:
                    chunks.append(buf)
                    buf = ""
                chunks.extend(chunk_recursive(p, size=size, seps=seps[1:] or (" ",)))
                continue
            candidate = buf + sep + p if buf else p
            if len(candidate) <= size:
                buf = candidate
            else:
                if buf:
                    chunks.append(buf)
                buf = p
        if buf:
            chunks.append(buf)
        return [c for c in chunks if c.strip()]
    return chunk_fixed(text, size)

# Apply recursive chunking
recursive_chunks = chunk_recursive(contract_text, size=512)
print(f"Recursive chunking (512 chars): {len(recursive_chunks)} chunks")
print(f"\nFirst chunk preview:\n{recursive_chunks[0][:200]}...")
```

Score every chunk from both strategies against the query with simple keyword overlap, then compare the top-scoring chunk from each:

```python editable
# Score each chunk against the query using simple keyword overlap (no embeddings/LLM call needed)
query = "What is the severance clause?"
query_terms = [w.lower() for w in query.split() if len(w) > 3]  # ["what", "severance", "clause"]

def score_chunk(chunk, terms):
    """Relevance score: how many times the query's keywords appear in the chunk (case-insensitive)."""
    chunk_lower = chunk.lower()
    return sum(chunk_lower.count(term) for term in terms)

fixed_scores = [score_chunk(c, query_terms) for c in fixed_chunks]
recursive_scores = [score_chunk(c, query_terms) for c in recursive_chunks]

fixed_top_idx = max(range(len(fixed_chunks)), key=lambda i: fixed_scores[i])
recursive_top_idx = max(range(len(recursive_chunks)), key=lambda i: recursive_scores[i])

fixed_top_chunk = fixed_chunks[fixed_top_idx]
recursive_top_chunk = recursive_chunks[recursive_top_idx]

print(f"Fixed chunking: top chunk is #{fixed_top_idx} (score {fixed_scores[fixed_top_idx]})")
print(fixed_top_chunk[:300] + "...\n")
print(f"Recursive chunking: top chunk is #{recursive_top_idx} (score {recursive_scores[recursive_top_idx]})")
print(recursive_top_chunk[:300] + "...")
```

A high keyword score isn't enough on its own — the chunk also needs to contain the *complete* clause, not just a fragment cut off at a hard chunk boundary:

```python editable
# Ground truth: the paragraph in the source text that actually mentions "severance"
severance_para = next((p for p in contract_text.split("\n\n") if "severance" in p.lower()), "").strip()

fixed_has_full_clause = bool(severance_para) and severance_para in fixed_top_chunk
recursive_has_full_clause = bool(severance_para) and severance_para in recursive_top_chunk

print("Ground-truth severance clause paragraph:\n" + severance_para + "\n")
print(f"Fixed chunking top chunk contains the FULL clause: {fixed_has_full_clause}")
print(f"Recursive chunking top chunk contains the FULL clause: {recursive_has_full_clause}")

if recursive_has_full_clause and not fixed_has_full_clause:
    print("\n✅ Confirms the lesson's claim: recursive chunking preserved the clause boundary, fixed chunking split it.")
elif fixed_has_full_clause and not recursive_has_full_clause:
    print("\n⚠️ In this run, fixed chunking happened to keep the clause intact — chunk boundaries depend on the generated text, rerun to see the effect vary.")
else:
    print("\nBoth strategies produced the same result for this generated contract.")
```

**Semantic.** Embed each sentence. Compute cosine similarity between adjacent sentences. Split where similarity drops below a threshold. Preserves topic coherence. Slower; sometimes produces tiny 40-token fragments that hurt retrieval.

**Sentence.** Split on sentence boundaries. One sentence per chunk or a window of N sentences. Matches semantic chunking up to ~5k tokens at a fraction of the cost.

**Parent-document.** Store small child chunks for retrieval *and* the larger parent chunk for context. Retrieve by child; return parent. Degrades gracefully: bad child chunks still return reasonable parents.

**Late chunking (2024).** Embed the whole document at the token level first, then pool token embeddings into chunk embeddings. Preserves cross-chunk context. Works with long-context embedders (BGE-M3, Jina v3). Higher compute.

**Contextual retrieval (Anthropic, 2024).** Prepend each chunk with an LLM-generated summary of its position in the document ("This chunk is section 3.2 of the termination clauses..."). 35-50% retrieval improvement in Anthropic's own benchmark. Expensive to index.

```python editable
# Take the first recursive chunk and generate contextual metadata for it
chunk_to_contextualize = recursive_chunks[0][:300]  # First 300 chars

context_prompt = f"""<document>This is an employment contract.</document>
Here is a chunk: <chunk>{chunk_to_contextualize}</chunk>

Write 20-30 words placing this chunk in the document's context (e.g., \"This chunk appears in the employment section, covering job title and reporting structure\")."""

r = await lrn_llm.call([{"role": "user", "content": context_prompt}], max_tokens=60)
context_summary = lrn_llm.text(r)
contextualized_chunk = f"[Context: {context_summary}]\n\n{chunk_to_contextualize}"
print("Contextualized Chunk:\n")
print(contextualized_chunk)
```

### The rule that beats every default

Match the chunk size to the query type:

| Query type | Chunk size |
|------------|-----------|
| Factoid ("what is the CEO's name?") | 256-512 tokens |
| Analytical / multi-hop | 512-1024 tokens |
| Whole-section comprehension | 1024-2048 tokens |

NVIDIA's 2026 benchmark. The chunk should be big enough to contain the answer plus local context, small enough that the retriever's top-K returns focus on the answer rather than context noise.

Apply the rule to the severance query from earlier:

```python editable
# Query classification and chunk size recommendation
query = "What is the severance clause?"

classification_prompt = f"""Classify this query and recommend a chunk size:

Query: \"{query}\"

Query type: Is this factoid (single fact), analytical (multi-hop), or comprehension (whole section)?
Recommended chunk size: 256-512 (factoid), 512-1024 (analytical), or 1024-2048 (comprehension)?

Respond in 2 sentences."""

r = await lrn_llm.call([{"role": "user", "content": classification_prompt}], max_tokens=100)
response = lrn_llm.text(r)
print("Query Type & Chunk Size Recommendation:\n")
print(response)
```

And put it all together: for a corpus of contracts, what does the full production stack look like?

```python editable
# Recommend a full chunking strategy for a contract corpus
strategy_prompt = """You are a RAG engineer. You have a corpus of 50 employment contracts.
Queries will be: "What is the [clause name]?" (e.g., severance, termination, confidentiality).

Recommend:
1. Chunking strategy (recursive, semantic, parent-document, or contextual retrieval)
2. Chunk size in tokens
3. Overlap percentage
4. Why this choice for contracts?

Respond in 4 lines, one per point."""

r = await lrn_llm.call([{"role": "user", "content": strategy_prompt}], max_tokens=200)
response = lrn_llm.text(r)
print("Recommended RAG Chunking Strategy for Contracts:\n")
print(response)
```

Now try it yourself — pick a different document domain (medical records, research papers, code documentation) and design a chunking strategy for it:

```python editable
# TODO: Change this to your own domain and query type
YOUR_DOMAIN = "research papers"  # Change to medical records, code docs, legal filings, etc.
YOUR_QUERY_TYPE = "analytical"  # factoid, analytical, or comprehension
YOUR_SAMPLE_QUERY = "What methods did the authors use and why?"

# Generate a design for your domain
design_prompt = f"""Design a chunking strategy for {YOUR_DOMAIN}.
Query type: {YOUR_QUERY_TYPE}
Example query: \"{YOUR_SAMPLE_QUERY}\"

Recommend:
1. Chunk size (tokens)
2. Strategy (recursive, semantic, parent-document, or contextual)
3. Overlap percentage
4. One reason why this beats the alternatives

Respond in 4 lines."""

r = await lrn_llm.call([{"role": "user", "content": design_prompt}], max_tokens=150)
response = lrn_llm.text(r)
print(f"\n✅ Chunking Design for {YOUR_DOMAIN}:\n")
print(response)
```

## Build It

Reconstruct **Chunking Strategies for RAG** by following `call` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `call` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-chunker.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Yepes et al. / LangChain — Recursive Character Splitting docs](https://python.langchain.com/docs/how_to/recursive_text_splitter/) — the default in production.
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) — chunking matters as much as embedding choice.
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/) — the late chunking paper.
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — 35-50% retrieval improvement with LLM-generated context prefixes.
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) — chunk size by query type.

## Exercises

Keep two runs side by side for **Chunking Strategies for RAG**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the text "red fox". Follow `call`, `text`, `usage`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Chunking Strategies for RAG and place it in an NLP pipeline**.
2. **Run a two-value comparison.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Chunking Strategies for RAG from first principles** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-chunker.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Chunking Strategies for RAG**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Chunking Strategies for RAG** should contain:

- the `python3 main.py` output for the text "red fox", with `call`, `text`, `usage` traced to the value or shape that supports **Explain the core mechanism in Chunking Strategies for RAG and place it in an NLP pipeline**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Implement the central transformation behind Chunking Strategies for RAG from first principles**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/skill-chunker.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Chunking Strategies for RAG**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
