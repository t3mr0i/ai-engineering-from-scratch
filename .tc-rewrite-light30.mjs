export const meta = {
  name: 'tc-light30-upcycle',
  description: 'Light upcycle of 30 TC lessons: add field-notes sidebar and one quantified claim',
  phases: [{ title: 'Upcycle', detail: 'one Sonnet agent per lesson appends a field-notes sidebar and sharpens one weightless claim with a number', model: 'sonnet' }],
}

const REPO = '/Users/U751725/AiSchooling/ai-engineering-from-scratch'
const LESSON_GOLD_STD_REF = `${REPO}/phases/11-llm-engineering/70-github-copilot-daily-workflow/docs/en.md`

const SPEC = (dir) => `You are LIGHT-UPCYCLING one lesson in an internal AI-engineering training catalog (LHIND). The lesson is already structurally complete and shipped. Your job is small, targeted, and additive — do NOT rewrite the lesson from scratch.

LESSON DIRECTORY (edit only docs/en.md): ${REPO}/${dir}

TWO ADDITIVE CHANGES:

1. APPEND a "## Consultant field notes" section at the end of docs/en.md (BEFORE "## Further Reading", after the existing "## Key Terms" table). 3-5 named patterns a senior consultant recognizes: project shapes, failure shapes, decision shortcuts. Use names like "the prompt that worked in the demo but failed in production", "the RAG that returned the right doc but the wrong paragraph", "the vendor pilot that never made it past the security review", "the use case everyone approved but nobody wanted", "the AI feature that hit a cost ceiling in month two". Each pattern is 1-2 sentences: the shape, the lesson. Punchy, memorable. Match the existing house tone.

2. SHARPEN ONE weightless claim. Find one sentence in the existing prose that says "expensive" / "fast" / "may be wrong" / "many" / "often" / "significant" / "considerable" without backing it up. Replace it with a quantified version. Honest approximations: "in our experience", "typically", "approximately" — never invent a precise number. If the lesson already has good numbers, sharpen a different weak claim. ONE claim only.

HARD RULES:
- Additive only. Do not rewrite existing sections. Do not change code/main.py. Do not change outputs/skill-*.md. Do not change the H1 title or frontmatter.
- Do not touch any file outside ${REPO}/${dir}/docs/en.md.
- 2026 currency. English. No emoji. Match the house tone.
- Field notes section must come BEFORE "## Further Reading" — do not add a heading after Further Reading.
- Total added length: ~15-30 lines. Less is fine. More is not the goal.

After editing, return your structured output.`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dir', 'fieldNotesCount', 'sharpened'],
  properties: {
    dir: { type: 'string' },
    fieldNotesCount: { type: 'integer', description: 'count of named patterns in the new field-notes sidebar (target 3-5)' },
    sharpened: { type: 'string', description: 'one-line summary of the claim you sharpened and what you changed' },
  },
}

let dirs = args
if (typeof dirs === 'string') dirs = JSON.parse(dirs)
if (!Array.isArray(dirs)) throw new Error('args is not an array, got: ' + typeof dirs)

phase('Upcycle')
log(`Light-upcycling ${dirs.length} lessons (Sonnet, one agent per lesson)`)

const results = await parallel(dirs.map((dir) => () =>
  agent(SPEC(dir), {
    label: `upcycle:${dir.split('/').pop()}`,
    phase: 'Upcycle',
    model: 'sonnet',
    schema: SCHEMA,
  }).then(r => r ? r : { dir, fieldNotesCount: 0, sharpened: '(failed)', failed: true })
))

const ok = results.filter(r => r && !r.failed)
const bad = results.filter(r => !r || r.failed)
log(`Done: ${ok.length} upcycled, ${bad.length} need attention`)

return {
  upcycled: ok,
  failed: bad,
}
