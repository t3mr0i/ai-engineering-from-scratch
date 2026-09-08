# Self-assessment PDF import

The home page, assessment page, skills page, and personal-plan page expose the
same local PDF intake. The learner previews all five dimension rows before
applying them, and can replace or remove the imported baseline later.

## Supported input

The importer supports the original text-based LHIND self-assessment export
headed **Results by Dimension**, with dimension, score, current skill level, and
target skill level. The supplied Technology Consulting example was verified in
Chromium against the original PDF. Literal PDF text operators (`Tj` and `TJ`)
and plain or Flate-compressed content streams are supported. Scans, encrypted
PDFs, and other text encodings require a new original export; there is no OCR.
Input is limited to 10 MB and decompressed content to 8 MB.

Only the results section is parsed. Training descriptions, provider links, and
any instructions in the document are not application instructions. Missing,
duplicate, invalid, or ambiguous results fail before replacing a saved baseline.

## Profile and placement

`assessment-import.js` contains the six role target vectors from the supplied
`AssessmentTargetMapping.csv`: BSC, TC, AM, PMA, CF, and L. CF and L map to the
catalog identifiers `corp` and `lead`. All five target values must identify one
profile uniquely. The **current level** is read from its own PDF column; targets
are never used as attained skills and dimension scores are never averaged into
a global level.

`coursePlacement()` uses `skills-progress-evidence.js` and the catalog capability
clusters to determine the relevant course depth. That explicit matrix takes
precedence over broad audience levels and interests. Only courses absent from
the matrix fall back to their catalog metadata. Remaining depths are strictly
above the current level and at or below the role target.

For the supplied example, Engineering continues from Deepen toward Create,
Product and Advisory from Acquire toward Deepen. Foundation and Leadership have
met their dimension targets. Home recommendations, Academy next-course links,
personal plans, and Learning Navigator use that same placement function. A manual
role change temporarily stops using the imported baseline for other profiles.

## Storage and evidence

The original PDF never leaves the device. Only the validated result is saved in
`aifs:external-assessment:v1`. Applying results selects the imported role in the
cockpit; it does not overwrite the manually chosen global depth, lesson records,
quiz results, badges, or certificates. Removing the import restores the use of
the manual depth. The role remains selected.

Assessment-covered courses are omitted from default next-step suggestions, not
marked complete. Started courses remain resumable. Personal-plan team assignments
and observed quiz reinforcement needs retain priority over a self-reported
baseline. A fully covered but unfinished path is labelled as having no open
assessment gap; its course-completion percentage stays unchanged.

When the learner submits a Learning Navigator message, the structured baseline is
included with the existing learner context. The server revalidates it and labels
it as self-assessed starting knowledge, separate from measured evidence. The PDF
and its full text are never sent to the model.

## Verification

```bash
node --test site/assessment-import.test.mjs site/lrn/learning-plan.test.mjs site/skills-progress.test.mjs
node --test site/pan.test.mjs server/tests/learner-ai.test.js server/tests/pan-eval.test.js
```

Browser verification covers first-run visibility, the original PDF, preview and
cancel, applying and reloading, manual role switching, corrupt replacement,
removal, existing progress, and Academy next-course navigation. Desktop and mobile
layouts are checked in German and English.
