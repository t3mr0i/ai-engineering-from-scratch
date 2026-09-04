# Java reader's track — how CBP developers use this curriculum

Most lesson code in this curriculum is Python (some TypeScript). CBP services are Java. This page tells you how to work through the material without becoming a Python developer first.

## The short version

- **Read every Concept.** The ideas (prompting, retrieval, evals, gateways, auth) are language-independent.
- **Run the Phase 0 demos.** They verify your machine: Git, Python for demos, Azure CLI, container tooling.
- **Skim Python Build-It sections for the idea, not the syntax.** You do not need to port NumPy code to Java. Understand what goes in, what comes out, and what is measured.
- **Do the Use-It parts against Azure from Java.** That is the actual CBP skill: calling a model endpoint, validating the response, handling failures.

## What to do per phase

| Phase | How to work it as a Java developer |
|---|---|
| 0 (Setup & Tooling) | Do fully. Python here only runs the demos; your services stay on Maven/Gradle. |
| 1–10 (Math, ML, LLMs from scratch) | Read for intuition. Run a demo when a mechanism is unclear. Port nothing to production. |
| 11 (LLM Engineering) | The core phase for CBP work. Apply every lesson through the Azure OpenAI endpoint from Java (see pattern below). |
| 13–14 (Tools, Agents) | Apply via Spring AI and the Azure gateway; run the Python demos to understand the protocols (MCP, tool loops). |
| 17 (Infrastructure) | Read as the operator's view of the platform LCAG runs for you: gateways, Key Vault, observability, FinOps. |

## The Java call pattern

One shape covers most of Phase 11 from Java: POST a JSON request to the Azure OpenAI endpoint, parse the JSON response, validate it. Keys come from the environment or Key Vault, never from source:

```text
endpoint = System.getenv("AZURE_OPENAI_ENDPOINT")   # no key in code
request  = { model, messages[], temperature, response_format }
response = http.post(endpoint + "/openai/deployments/<name>/chat/completions?api-version=...", request)
answer   = parse(response).choices[0].message.content
validate(answer)  // schema check (Jackson + Bean Validation) before use
```

Keep prompts as versioned resources (properties files or templates), not string literals. Keep a JUnit test set of input/output pairs per prompt — that is the evaluation lesson applied.

## Tooling map

| Curriculum assumes | CBP equivalent |
|---|---|
| `python3 -m venv`, `pip install` | Maven/Gradle build; Python env only for demos |
| `.env` file with API key | Environment variable locally, Key Vault on the platform |
| `gh` CLI, GitHub Actions | `az` CLI, Azure DevOps Repos, Boards, Pipelines |
| Local GPU / container daemon | LCAG-provided compute, Azure Container Registry |
| Pytest-style Python tests | JUnit 5 for service behavior, including prompt eval sets |

## What not to do

- Do not rewrite course demos in Java to "keep up". The demos are throwaway illustrations of the concept.
- Do not add course Python packages to a service build.
- Do not skip Phase 11 evaluations and guardrails because "the demo looked fine". The demo is not the acceptance test.
