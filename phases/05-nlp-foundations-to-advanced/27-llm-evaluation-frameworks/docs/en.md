# LLM Evaluation — RAGAS, DeepEval, G-Eval

> Exact-match and F1 miss semantic equivalence. Human review does not scale. LLM-as-judge is the production answer — with enough calibration to trust the number.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 14 (Information Retrieval)
**Time:** ~75 minutes

## The Problem

Your RAG system answers: "June 29th, 2007."
The gold reference is: "June 29, 2007."
Exact Match scores 0. F1 scores ~75%. A human would score 100%.

Now multiply by 10,000 test cases. Multiply again by every change to the retriever, chunking, prompt, or model. You need an evaluator that understands meaning, runs cheaply at scale, does not lie about regressions, and surfaces the right failure modes.

2026 has three frameworks that own this problem.

- **RAGAS.** Retrieval-Augmented Generation ASsessment. Four RAG metrics (faithfulness, answer-relevance, context-precision, context-recall) with NLI + LLM-judge backends. Research-backed, lightweight.
- **DeepEval.** Pytest for LLMs. G-Eval, task-completion, hallucination, bias metrics. CI/CD-native.
- **G-Eval.** A method (and a DeepEval metric): LLM-as-judge with chain-of-thought, custom criteria, 0-1 score.

All three lean on LLM-as-judge. This lesson builds intuition for the method and the trust layer around it.

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

Three test cases run through every metric below: a correct answer, a hallucinated date, and an off-topic answer.

```python editable
cases = [
    {
        "id": "correct",
        "question": "When was the first iPhone released?",
        "context": ["Apple released the first iPhone on June 29, 2007.", "Steve Jobs announced the iPhone at Macworld in January 2007."],
        "answer": "The first iPhone was released on June 29, 2007.",
        "expected": "June 29, 2007",
        "description": "Faithful, correct answer"
    },
    {
        "id": "hallucinated_date",
        "question": "When was the first iPhone released?",
        "context": ["Apple released the first iPhone on June 29, 2007.", "The moon landing was in 1969."],
        "answer": "The first iPhone launched on June 29, 2006, shortly after the moon landing.",
        "expected": "June 29, 2007",
        "description": "Hallucinated date (2006 instead of 2007)"
    },
    {
        "id": "off_topic",
        "question": "When was the first iPhone released?",
        "context": ["Apple released the first iPhone on June 29, 2007.", "Android launched in 2008."],
        "answer": "Apple is a technology company based in Cupertino.",
        "expected": "June 29, 2007",
        "description": "Off-topic answer"
    }
]

print("\n=== Test Cases ===")
for case in cases:
    print(f"\n{case['id']}: {case['description']}")
    print(f"  Q: {case['question']}")
    print(f"  A: {case['answer']}")
    print(f"  Expected: {case['expected']}")
```

## The Concept

![Four evaluation dimensions, LLM-as-judge architecture](../assets/llm-evaluation.svg)

**LLM-as-judge.** Replace a static metric with an LLM that scores outputs given a rubric. Given `(query, context, answer)`, prompt a judge LLM: "Score 0-1 on faithfulness." Return the score.

Why it works: LLMs approximate human judgment at a tiny fraction of the cost. GPT-4o-mini at ~$0.003 per scored case enables 1000-sample regression eval runs for under $5.

Why it fails silently:

1. **Judge bias.** Judges prefer longer answers, answers from their own model family, answers that match the prompt style.
2. **JSON parsing failures.** Bad JSON → NaN score → silently excluded from the aggregate. RAGAS users know this pain. Gate with try/except + explicit failure mode.
3. **Drift over model versions.** Upgrading the judge changes every metric. Freeze judge model + version.

**The RAG four.**

| Metric | Question | Backend |
|--------|----------|---------|
| Faithfulness | Does each claim in the answer come from the retrieved context? | NLI-based entailment |
| Answer relevance | Does the answer address the question? | Generate hypothetical questions from answer; compare to real question |
| Context precision | Of retrieved chunks, what fraction were relevant? | LLM-judge |
| Context recall | Did retrieval return everything needed? | LLM-judge against gold answer |

Faithfulness: decompose the answer into atomic claims, then verify each against the retrieved context.

```python editable
async def faithfulness_judge(answer, context, case_id):
    """Score faithfulness: fraction of answer claims supported by context."""
    # Step 1: LLM breaks answer into atomic claims
    claims_response = await lrn_llm.call(
        [{"role": "user", "content": f"Break this answer into simple factual claims (one per line, no numbering):\n{answer}"}],
        system="You are a fact analyzer. Decompose text into simple, atomic claims.",
        max_tokens=200
    )
    claims_text = lrn_llm.text(claims_response).strip()
    claims = [c.strip() for c in claims_text.split('\n') if c.strip()]
    
    if not claims:
        return 0.0, f"No claims extracted"
    
    # Step 2: Check each claim against context with LLM judge
    context_text = " ".join(context) if isinstance(context, list) else context
    supported = 0
    reasons = []
    
    for claim in claims:
        score_response = await lrn_llm.call(
            [{"role": "user", "content": f"Context: {context_text}\n\nClaim: {claim}\n\nIs this claim supported by the context? Answer 'yes' or 'no'."}],
            system="You are a fact verification system. Answer only 'yes' or 'no'.",
            max_tokens=5
        )
        answer_text = lrn_llm.text(score_response).strip().lower()
        is_supported = answer_text.startswith('yes')
        if is_supported:
            supported += 1
        reasons.append(f"  - '{claim}': {'✓' if is_supported else '✗'}")
    
    score = supported / len(claims) if claims else 0.0
    reason_str = "\n".join(reasons[:3])  # Show first 3 for brevity
    return score, f"{supported}/{len(claims)} claims supported\n{reason_str}"

# Evaluate faithfulness for first case (correct answer)
faith_score, faith_reason = await faithfulness_judge(cases[0]["answer"], cases[0]["context"], cases[0]["id"])
print(f"Case: {cases[0]['id']}")
print(f"Faithfulness: {faith_score:.2f}")
print(faith_reason)
```

Judges have a well-known length bias — check whether it actually shows up on a live call by scoring the same fact stated short and stated long:

```python editable
async def demo_judge_bias():
    """Check for judge length bias: does the longer (but unsupported-opinion-padded) answer score higher?"""
    question = "When was the first iPhone released?"
    context = "The first iPhone was released on June 29, 2007."

    short_answer = "June 29, 2007."
    long_answer = "The first iPhone was released by Apple on June 29, 2007. This date marks a pivotal moment in mobile computing history."

    print("Testing judge bias with the same fact in two answer lengths:\n")

    short_faith, _ = await faithfulness_judge(short_answer, context, "short")
    long_faith, _ = await faithfulness_judge(long_answer, context, "long")

    print(f"Short answer: 'June 29, 2007.' → Faithfulness = {short_faith:.2f}")
    print(f"Long answer: '{long_answer}' → Faithfulness = {long_faith:.2f}")
    print(f"\nDifference: {abs(long_faith - short_faith):.2f}")
    if long_faith > short_faith:
        print("In this run, the longer answer scored higher — consistent with the known length-bias pattern (its extra, unsupported clause didn't hurt it).")
    elif short_faith > long_faith:
        print("In this run, the shorter answer scored higher — length bias didn't show up here; the judge penalized the long answer's unsupported extra clause.")
    else:
        print("In this run, both answers scored the same — no length bias observed here.")

await demo_judge_bias()
```

Answer relevance: have the judge generate questions the answer could address, then check overlap with the real question.

```python editable
async def answer_relevance_judge(question, answer, case_id):
    """Score answer relevance: does answer address the question?"""
    # LLM generates 3 questions the answer could be the answer to
    gen_response = await lrn_llm.call(
        [{"role": "user", "content": f"Write 3 questions this answer could be the answer to (one per line):\n{answer}"}],
        system="You are a question generation system. Generate plausible questions.",
        max_tokens=150
    )
    generated_qs = [q.strip() for q in lrn_llm.text(gen_response).split('\n') if q.strip()][:3]
    
    if not generated_qs:
        return 0.0, "No questions generated"
    
    # Check if original question matches generated ones (simple lexical check)
    # In production, use embeddings; here we check word overlap for transparency
    orig_words = set(question.lower().split())
    matches = 0
    
    for gq in generated_qs:
        gen_words = set(gq.lower().split())
        overlap = len(orig_words & gen_words) / len(orig_words | gen_words) if (orig_words | gen_words) else 0
        if overlap > 0.3:  # threshold
            matches += 1
    
    score = matches / len(generated_qs) if generated_qs else 0.0
    reason = f"Generated questions: {'; '.join(generated_qs[:2])}\n{matches}/{len(generated_qs)} matched original"
    return score, reason

# Evaluate relevance for second case (hallucinated date)
rel_score, rel_reason = await answer_relevance_judge(cases[1]["question"], cases[1]["answer"], cases[1]["id"])
print(f"Case: {cases[1]['id']}")
print(f"Answer Relevance: {rel_score:.2f}")
print(rel_reason)
```

Context precision: for each retrieved chunk, ask whether it's actually relevant.

```python editable
async def context_precision_judge(context_chunks, question, case_id):
    """Score context precision: fraction of chunks that are relevant to the question."""
    relevant_count = 0
    reasons = []
    
    for i, chunk in enumerate(context_chunks):
        judge_response = await lrn_llm.call(
            [{"role": "user", "content": f"Question: {question}\n\nChunk: {chunk}\n\nIs this chunk relevant to answering the question? Answer 'yes' or 'no'."}],
            system="You are a relevance judge. Answer only 'yes' or 'no'.",
            max_tokens=5
        )
        is_relevant = lrn_llm.text(judge_response).strip().lower().startswith('yes')
        if is_relevant:
            relevant_count += 1
        reasons.append(f"  [{i+1}] {'✓' if is_relevant else '✗'} {chunk[:60]}...")
    
    score = relevant_count / len(context_chunks) if context_chunks else 0.0
    return score, "\n".join(reasons)

# Evaluate context precision for third case
cp_score, cp_reason = await context_precision_judge(cases[2]["context"], cases[2]["question"], cases[2]["id"])
print(f"Case: {cases[2]['id']}")
print(f"Context Precision: {cp_score:.2f}")
print(cp_reason)
```

Context recall: the reverse direction — decompose the ground-truth answer into claims, then check each is backed by the retrieved context.

```python editable
async def context_recall_judge(context_chunks, expected_output, case_id):
    """Score context recall: fraction of ground-truth claims that are backed by the retrieved context."""
    # Step 1: LLM breaks the expected (ground-truth) output into atomic claims
    claims_response = await lrn_llm.call(
        [{"role": "user", "content": f"Break this ground-truth answer into simple factual claims (one per line, no numbering):\n{expected_output}"}],
        system="You are a fact analyzer. Decompose text into simple, atomic claims.",
        max_tokens=200
    )
    claims_text = lrn_llm.text(claims_response).strip()
    claims = [c.strip() for c in claims_text.split('\n') if c.strip()]

    if not claims:
        return 0.0, "No claims extracted"

    # Step 2: Check each ground-truth claim against the retrieved context with LLM judge
    context_text = " ".join(context_chunks) if isinstance(context_chunks, list) else context_chunks
    supported = 0
    reasons = []

    for claim in claims:
        judge_response = await lrn_llm.call(
            [{"role": "user", "content": f"Context: {context_text}\n\nGround-truth claim: {claim}\n\nIs this claim backed by the context? Answer 'yes' or 'no'."}],
            system="You are a fact verification system. Answer only 'yes' or 'no'.",
            max_tokens=5
        )
        is_supported = lrn_llm.text(judge_response).strip().lower().startswith('yes')
        if is_supported:
            supported += 1
        reasons.append(f"  - '{claim}': {'✓' if is_supported else '✗'}")

    score = supported / len(claims) if claims else 0.0
    reason_str = "\n".join(reasons[:3])  # Show first 3 for brevity
    return score, f"{supported}/{len(claims)} ground-truth claims backed by context\n{reason_str}"

# Evaluate context recall for the correct case (ground truth should be fully covered)
cr_score, cr_reason = await context_recall_judge(cases[0]["context"], cases[0]["expected"], cases[0]["id"])
print(f"Case: {cases[0]['id']}")
print(f"Context Recall: {cr_score:.2f}")
print(cr_reason)
```

**G-Eval.** Define a custom criterion: "Did the answer cite the correct source?" The framework auto-expands into chain-of-thought evaluation steps, then scores 0-1. Good for domain-specific quality dimensions RAGAS does not cover.

```python editable
async def g_eval_correctness(actual_output, expected_output, case_id):
    """G-Eval: custom metric for factual correctness via chain-of-thought."""
    criteria = "The answer should be factually accurate and match the expected output."
    
    # Chain-of-thought evaluation steps
    evaluation_prompt = f"""You are a fact checker. Evaluate this answer step-by-step:

Criteria: {criteria}
Expected output: {expected_output}
Actual output: {actual_output}

1. Extract the key factual claim from actual output.
2. Compare to expected output.
3. Is it accurate? (yes/no)
4. Assign a score 0-1.

Respond with just the score (0 or 1)."""
    
    response = await lrn_llm.call(
        [{"role": "user", "content": evaluation_prompt}],
        system="You are an LLM evaluation judge. Respond with only a score: 0 or 1.",
        max_tokens=10
    )
    score_text = lrn_llm.text(response).strip()
    try:
        score = float(score_text) if score_text in ['0', '1', '0.0', '1.0'] else 0.5
    except:
        score = 0.5
    
    return score, f"Expected: '{expected_output}'\nActual: '{actual_output[:80]}'\nScore: {score}"

# Evaluate all three cases with G-Eval
print("=== G-Eval Correctness ===")
for case in cases:
    g_score, g_reason = await g_eval_correctness(case["answer"], case["expected"], case["id"])
    print(f"\n{case['id']}: {g_reason}")
```

Put all five metrics together across all three cases, and each catches a different failure mode:

```python editable
print("\n=== Evaluation Summary ===")
print("\nComputing all metrics for all cases...\n")

results = []
for case in cases:
    print(f"Evaluating {case['id']}...")
    faith, _ = await faithfulness_judge(case["answer"], case["context"], case["id"])
    rel, _ = await answer_relevance_judge(case["question"], case["answer"], case["id"])
    cp, _ = await context_precision_judge(case["context"], case["question"], case["id"])
    cr, _ = await context_recall_judge(case["context"], case["expected"], case["id"])
    g, _ = await g_eval_correctness(case["answer"], case["expected"], case["id"])
    results.append({"id": case["id"], "faith": faith, "rel": rel, "cp": cp, "cr": cr, "g": g})

print("\n" + "="*80)
print(f"{'Case':<20} {'Faithfulness':<15} {'Relevance':<15} {'Ctx Precision':<15} {'Ctx Recall':<12} {'G-Eval':<10}")
print("="*80)
for r in results:
    print(f"{r['id']:<20} {r['faith']:.2f}            {r['rel']:.2f}            {r['cp']:.2f}             {r['cr']:.2f}         {r['g']:.2f}")
print("\nInterpretation:")
print("  - 'correct': all metrics high (faithful answer, relevant, correct chunks)")
print("  - 'hallucinated_date': G-Eval & faithfulness drop (wrong date)")
print("  - 'off_topic': relevance & G-Eval collapse (doesn't answer the question)")
```

**Calibration.** Never trust the raw judge score until you have a correlation against human labels. Run 100 hand-labeled examples. Plot judge vs human. Compute Spearman rho. If rho < 0.7, your judge rubric needs work.

Now try it yourself — define your own RAG case and evaluate it with all five metrics:

```python editable
# TODO: Edit this case to test evaluation on your own RAG output
custom_case = {
    "question": "What year did Steve Jobs announce the iPhone?",
    "context": [
        "Steve Jobs announced the first iPhone at Macworld on January 9, 2007.",
        "The iPhone was released to the public on June 29, 2007."
    ],
    "answer": "Steve Jobs announced the iPhone in 2007 at Macworld.",
    "expected": "2007"
}

print("Custom RAG Evaluation")
print(f"Question: {custom_case['question']}")
print(f"Answer: {custom_case['answer']}")
print(f"\nRunning all metrics...\n")

faith, faith_r = await faithfulness_judge(custom_case["answer"], custom_case["context"], "custom")
rel, rel_r = await answer_relevance_judge(custom_case["question"], custom_case["answer"], "custom")
cp, cp_r = await context_precision_judge(custom_case["context"], custom_case["question"], "custom")
cr, cr_r = await context_recall_judge(custom_case["context"], custom_case["expected"], "custom")
g, g_r = await g_eval_correctness(custom_case["answer"], custom_case["expected"], "custom")

print(f"Faithfulness: {faith:.2f}")
print(f"Answer Relevance: {rel:.2f}")
print(f"Context Precision: {cp:.2f}")
print(f"Context Recall: {cr:.2f}")
print(f"G-Eval Correctness: {g:.2f}")
print(f"\nAverage: {(faith + rel + cp + cr + g) / 5:.2f}")
```

## Further Reading

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) — the RAGAS paper.
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) — the G-Eval paper.
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) — open production stack.
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) — biases, calibration, limits.
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) — unifying framework that integrates RAGAS, DeepEval, Phoenix.
