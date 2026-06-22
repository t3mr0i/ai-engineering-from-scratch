export const meta = {
  name: 'tc-top12-rewrite',
  description: 'Deep rewrite of 12 highest-traffic TC lessons: failure stories, numbers, field notes, code 2.0',
  phases: [{ title: 'Rewrite', detail: 'one Sonnet agent per lesson rewrites docs/en.md + code/main.py with failure shapes, quantified claims, and a field-notes sidebar', model: 'sonnet' }],
}

const REPO = '/Users/U751725/AiSchooling/ai-engineering-from-scratch'
const LESSON_GOLD_STD_REF = `${REPO}/phases/11-llm-engineering/70-github-copilot-daily-workflow/docs/en.md`
const LESSON_GOLD_STD_CODE = `${REPO}/phases/11-llm-engineering/70-github-copilot-daily-workflow/code/main.py`

const SPEC = (c) => `You are DEEP-REWRITING one flagship lesson in an internal AI-engineering training catalog (LHIND). The current draft is structurally correct but reads like a reference, not a practitioner's after-action report. Your job is to take it to the next level: failure stories, numbers, field notes, and code that demonstrates the lesson's core insight by showing the model/system being wrong in interesting ways.

WORKING DIRECTORY: ${REPO}
LESSON DIRECTORY (overwrite the 3 files in place): ${c.dir}
FOCUS THEME: ${c.focus}

WHAT "NEXT LEVEL" MEANS — apply ALL FOUR:

1. FAILURE STORIES. At least one concrete, named failure shape — realistic composite, NOT real-client PII. Pattern: "[Name] did X, the system did Y, the consequence was Z, the lesson is W." Names like "the contract reviewer at an insurer", "the CRM RAG at a logistics firm", "the prompt workshop at a public-sector team". Failure shapes > abstract failure modes.

2. NUMBERS & TRADEOFFS. Replace weightless claims with quantified ones where honest. Cost per 1K tokens (closed vs open-weight), latency ranges, context windows, model size vs cost sweet spots, error rates on common tasks. Use "approximately" / "in our experience" for estimates; never invent precise numbers.

3. FIELD NOTES SIDEBAR. Final section "## Consultant field notes" with 4-6 named patterns a senior consultant recognizes by name. 1-2 sentences each. Punchy, memorable.

4. CODE 2.0. The current code/main.py is correct but flat. Make it demonstrate the lesson's core insight BY SHOWING THE SYSTEM BEING WRONG. Add a final demonstration block that shows the failure shape, not just the happy path. The HEADLINE summary must call out the specific failure the code just demonstrated.

HARD RULES:
- 2026 currency: current models are Fable 5 and Opus/Sonnet/Haiku 4.x. Reference current practice. Never write 2024-era framing as the present.
- English only. No emoji. No "Co-Authored-By". Measured house tone (see gold standard).
- Do NOT touch any file outside your lesson directory.
- docs/en.md: 180-260 lines. More than the current ~150 is expected; not a 500-line essay.
- code/main.py: stdlib-only, runs clean with no args, ends with a HEADLINE summary naming the demonstrated failure shape.
- outputs/skill-*.md: lightly tighten only; same filename.

STUDY FIRST (use Read, absolute paths):
  - ${LESSON_GOLD_STD_REF}  (house style)
  - ${LESSON_GOLD_STD_CODE}  (house code)
  - ${REPO}/${c.dir}/docs/en.md  (current draft — improve, do not copy weak patterns)

VERIFY: run \`python3 ${REPO}/${c.dir}/code/main.py\` with Bash; fix if it errors. Then return structured output.`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'dir', 'codeRuns', 'failureShapesAdded', 'fieldNotesCount', 'quantifiedClaimsCount'],
  properties: {
    id: { type: 'string' },
    dir: { type: 'string' },
    codeRuns: { type: 'boolean' },
    failureShapesAdded: { type: 'integer', description: 'count of named failure shapes in the new doc (target 1+)' },
    fieldNotesCount: { type: 'integer', description: 'count of patterns in the new field-notes sidebar (target 4-6)' },
    quantifiedClaimsCount: { type: 'integer', description: 'count of quantified claims in the new doc (target 4+)' },
    note: { type: 'string' },
  },
}

let courses = args
if (typeof courses === 'string') courses = JSON.parse(courses)
if (!Array.isArray(courses)) throw new Error('args is not an array, got: ' + typeof courses)

phase('Rewrite')
log(`Deep-rewriting ${courses.length} lessons (Sonnet, one agent per lesson)`)

const results = await parallel(courses.map((c) => () =>
  agent(SPEC(c), {
    label: `rewrite:${c.id}`,
    phase: 'Rewrite',
    model: 'sonnet',
    schema: SCHEMA,
  }).then(r => r ? { ...r, _course: c } : { id: c.id, dir: c.dir, codeRuns: false, failed: true, _course: c })
))

const ok = results.filter(r => r && !r.failed && r.codeRuns)
const bad = results.filter(r => !r || r.failed || !r.codeRuns)
log(`Done: ${ok.length} rewritten, ${bad.length} need attention`)

return {
  rewritten: ok.map(r => ({ id: r.id, dir: r.dir, codeRuns: r.codeRuns, failureShapes: r.failureShapesAdded, fieldNotes: r.fieldNotesCount, quantified: r.quantifiedClaimsCount })),
  failed: bad.map(r => ({ id: r.id, dir: r.dir })),
}
