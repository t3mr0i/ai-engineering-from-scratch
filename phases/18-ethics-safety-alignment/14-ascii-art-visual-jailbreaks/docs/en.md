# ASCII Art and Visual Jailbreaks

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753). Mask the safety-relevant tokens in a harmful request, replace them with ASCII-art renderings of the same letters, and send the cloaked prompt. GPT-3.5, GPT-4, Gemini, Claude, Llama-2 all fail to robustly recognize ASCII-art tokens. The attack bypasses PPL (perplexity filters), Paraphrase defenses, and Retokenization. Related: the ViTC benchmark measures recognition of non-semantic visual prompts; StructuralSleight generalizes to Uncommon Text-Encoded Structures (trees, graphs, nested JSON) as a family of encoding attacks.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 18 · 12 (PAIR), Phase 18 · 13 (MSJ)
**Time:** ~60 minutes

## Learning Objectives

- Describe the ArtPrompt attack: word-identification step, ASCII-art substitution, final cloaked prompt.
- Explain why standard defenses (PPL, Paraphrase, Retokenization) fail on ArtPrompt.
- Define ViTC and describe what it measures.
- Describe StructuralSleight as a generalization to arbitrary Uncommon Text-Encoded Structures.

## The Problem

Attacks via paraphrase and roleplay (Lesson 12) and via long context (Lesson 13) operate on the text-level pattern. ArtPrompt operates at the recognition level: the model does not parse the forbidden token. It parses an image rendered in characters. The safety filter sees harmless punctuation. The model sees a word.

## The Concept

### ArtPrompt, two steps

Step 1. Word Identification. Given a harmful request, the attacker uses an LLM to identify the safety-relevant words (e.g., "bomb" in "how to make a bomb"). 

Step 2. Cloaked Prompt Generation. Replace each identified word with its ASCII-art rendering (a 7x5 or 7x7 block of characters forming the letter shape). The model receives a grid of punctuation and spaces that a sufficiently capable model can recognize as the word; a safety filter sees only the grid.

Result: GPT-4, Gemini, Claude, Llama-2, GPT-3.5 all fail. Attack success rate above 75% on their benchmark subset.

### Why the standard defenses fail

- **PPL (perplexity filter).** ASCII art has high perplexity — but so does all novel input. Threshold choices that block ArtPrompt also block legitimate structured input.
- **Paraphrase.** Paraphrasing the prompt destroys the ASCII art. In practice, paraphrase LLMs often preserve or reconstruct the art.
- **Retokenization.** Splitting tokens differently does not change that the model's vision is recognizing letter shapes.

The underlying issue is that safety filters are token- or semantic-level; ArtPrompt operates at the visual recognition level.

### ViTC benchmark

Recognition of non-semantic visual prompts. Measures the model's ability to read ASCII-art, wingdings, and other non-text-semantic visual content. ArtPrompt's effectiveness correlates with ViTC accuracy: the better the model reads visual text, the better ArtPrompt works on it. This is a capability-safety tradeoff.

### StructuralSleight

Generalizes ArtPrompt: Uncommon Text-Encoded Structures (UTES). Trees, graphs, nested JSON, CSV-in-JSON, diff-style code blocks. If a structure is rare in training safety data but parseable by the model, it can hide harmful content.

The defense implication: safety must generalize across the structured representations the model can parse. The set is large and growing.

### Image-modality analog

Visual LLMs (GPT-5.2, Gemini 3 Pro, Claude Opus 4.5, Grok 4.1) extend the attack surface. ArtPrompt-style attacks with actual images are stronger than ASCII-art analogs because image encoders produce richer signal.

### Where this fits in Phase 18

Lessons 12-14 describe three orthogonal attack vectors: iterative refinement (PAIR), context length (MSJ), and encoding (ArtPrompt/StructuralSleight). Lesson 15 shifts from model-centric attacks to system-boundary attacks (indirect prompt injection). Lesson 16 describes the defensive tooling response.



## Build It

Reconstruct **ASCII Art and Visual Jailbreaks** by following `render_word` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `render_word` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-encoding-audit.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) — the ASCII-art jailbreak paper
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) — UTES generalization
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — complementary iterative attack
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) — complementary length attack

## Exercises

Keep two runs side by side for **ASCII Art and Visual Jailbreaks**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `render_word`, `cloak_prompt`, `keyword_filter`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Describe the ArtPrompt attack: word-identification step, ASCII-art substitution, final cloaked prompt.**.
2. **Run a two-value comparison.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Explain why standard defenses (PPL, Paraphrase, Retokenization) fail on ArtPrompt.** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Define ViTC and describe what it measures.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-encoding-audit.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Describe StructuralSleight as a generalization to arbitrary Uncommon Text-Encoded Structures.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **ASCII Art and Visual Jailbreaks** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `render_word`, `cloak_prompt`, `keyword_filter` traced to the value or shape that supports **Describe the ArtPrompt attack: word-identification step, ASCII-art substitution, final cloaked prompt.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Explain why standard defenses (PPL, Paraphrase, Retokenization) fail on ArtPrompt.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Define ViTC and describe what it measures.**; and
- an updated `outputs/skill-encoding-audit.md` example with a concrete input, expected output field, and acceptance check tied to **Describe StructuralSleight as a generalization to arbitrary Uncommon Text-Encoded Structures.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
