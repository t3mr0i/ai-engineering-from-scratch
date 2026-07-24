# Merkzettel: Freitext-Snippets per Markierung

Status: implemented and committed (8407e345).

## Problem

"Save to My Merkzettel" today only saves a lesson's entire Key Terms table
(`site/lesson.html:3211`, button `#keyTermsSaveBtn`), one all-or-nothing
action per lesson. There is no way to save an arbitrary highlighted passage
from the lesson prose. A right-click handler already exists on that button
(`site/lesson.html:3832-3853`) but it is unrelated dead-end code: it opens a
"bookmarklet" menu that dumps the whole page's outerHTML into localStorage
under an ad-hoc key (`aifs_saved_page_<ts>`) that nothing else reads or
renders. It does not respond to text selection at all. This is the
"kann man immer nur eine einzige Sache abspeichern" problem the user
described, and the confusing half-built contextmenu is likely why a
right-click felt like the right mental model already.

## Scope

1. Select any text inside a lesson's article body (`.lesson-article`) →
   a small floating button appears near the selection → click saves the
   selected text as a snippet, tied to the current lesson.
2. Saved snippets show up on `notes.html` in a new chronological list,
   separate from (not merged into) the existing per-lesson Key Terms
   sections.
3. The existing Markdown export gets a snippets section.
4. Remove the dead bookmarklet contextmenu code.
5. Best-effort protection against the browser evicting localStorage under
   storage pressure. Explicitly **not** in scope: protecting against the
   user (or browser) explicitly clearing site data — that's a browser
   sandbox guarantee no web app can override. The UI must not imply
   otherwise; the only real mitigation is "export your backup."

Out of scope: cross-device sync, accounts/login, editing a snippet's text
after saving, tagging/search over snippets.

## Data model (`site/progress.js`)

Current state shape (`STORAGE_KEY`, one JSON blob) is `{ lessons: {...},
streak: {...}, updatedAt }`, with `lessons[path]` already carrying
`keyTerms`/`keyTermsSavedAt`. Snippets are naturally a flat, cross-lesson,
chronological list (that's how they'll be displayed), so they get their own
top-level array rather than being nested under each lesson:

```js
state.snippets = [
  { id: "snip_<timestamp>_<rand>", path: "phases/P03/L02", text: "...", savedAt: 1732000000000 }
]
```

New `AIFSProgress` methods, following the existing `saveKeyTerms` /
`removeKeyTerms` / `getAllSavedKeyTerms` pattern exactly:

- `saveSnippet(path, text)` — no-ops on empty path/text (mirrors the
  `saveKeyTerms` guard clause), generates `id`, appends, calls
  `touchActivity(state)` + `write(state)`.
- `removeSnippet(id)` — filters it out, writes.
- `getAllSnippets()` — returns `state.snippets` sorted newest-first (same
  sort as `getAllSavedKeyTerms`).

No migration needed — `state.snippets` simply doesn't exist in older
persisted state, and `read()`'s existing shape checks already tolerate
missing optional fields (same as `keyTerms` today).

## Selection popup (`site/lesson.html`)

Lives next to `initKeyTermsSave()` (same file, same section) since it's
lesson-page-only behavior, not a general utility.

- Listen for `mouseup` inside `.lesson-article` (mouseup, not
  `selectionchange`, so it fires once per selection gesture instead of
  continuously while dragging).
- On mouseup, read `window.getSelection()`. If the selection is empty,
  collapsed, or outside `.lesson-article`, remove any existing popup and
  do nothing.
- Otherwise position a small floating button (`+ Merkzettel`, styled like
  the existing `.key-terms-save-btn`) near the end of the selection range
  (`getBoundingClientRect()` of the last range), fixed-positioned like the
  current contextmenu code already does.
- Click on the button: `AIFSProgress.saveSnippet(lessonPath,
  selection.toString())`. Button label flips to `Gespeichert ✓` for
  ~1s, then the popup is removed. No toast, no page navigation.
- Clicking elsewhere, scrolling, or starting a new selection dismisses the
  popup (reuse the existing outside-click-dismiss pattern from the
  contextmenu code being removed).
- The popup only ever appears inside `.lesson-article` — Key Terms table
  cells are inside that container too, so highlighting a term there also
  offers "+ Merkzettel" and produces a plain-text snippet. That's fine and
  expected (it does not touch the separate `saveKeyTerms` flow).

## Removal: dead bookmarklet code

Delete `site/lesson.html:3831-3853` (the `contextmenu` listener on
`#keyTermsSaveBtn`, its inline menu HTML, and the `javascript:` bookmarklet
link). Nothing else references `aifs_saved_page_*` keys — confirm with a
repo-wide grep before deleting and remove any orphaned CSS for that inline
menu if grep finds none.

## Display (`site/notes.html` / `site/notes.js`)

New section, e.g. "Notizen", rendered before or after the existing
per-lesson Key Terms list (visually distinct heading) — the two sections
are shown together on the same page, never merged into one list:

- One row per snippet: snippet text (escaped, same `escapeHtml` helper),
  a link back to the source lesson (`lesson.html?path=<path>`, resolved
  through the existing `lessonIndex()` helper for the lesson title),
  relative/short timestamp, and a "Entfernen" button
  (`AIFSProgress.removeSnippet(id)` + re-render), mirroring the existing
  `.notes-lesson__remove` pattern.
- Empty state: only show the section (and its empty-state copy) once at
  least one snippet exists — if there are zero snippets, section is
  omitted entirely (don't clutter the page for users who never use this).
- `updateNotesNavCount()` (both in `notes.js` and duplicated in
  `lesson.html`) starts counting `getAllSnippets().length +
  getAllSavedKeyTerms().length` instead of just key terms, so the nav
  badge reflects all saved items.

## Export

Extend `exportMarkdown()` in `notes.js` with a `## Notizen` section listing
each snippet as a blockquote plus a link to its source lesson, appended
after the existing per-lesson key-terms sections. One combined
`meine-merkzettel.md` download, not a second export button.

## Persistence hardening

On page load (in `progress.js`, once, guarded so it doesn't run more than
once per session), call `navigator.storage.persist()` if available,
best-effort, swallow rejection/absence silently — this is the standard
"ask the browser not to auto-evict this origin's storage under disk
pressure" API and requires no permission prompt in most browsers for
already-visited, bookmarked-ish origins (some browsers may prompt or
silently ignore; either is fine, no behavior depends on the result).

This does **not** protect against the user (or the browser) explicitly
clearing site data / cookies — no web API can prevent that. Don't add any
copy that implies otherwise. The only real safety net already exists:
`exportMarkdown()`. No new reminder banner or nag UI is in scope here — if
data loss from manual clearing turns out to be a real recurring problem,
that's a separate follow-up (e.g. a periodic export nudge), not part of
this change.

## Testing / verification

No test framework in this repo for `site/` (static JS, no build step
beyond `node site/build.js`). Verify manually:

1. Open a lesson, select prose text → popup appears → click → label flips
   to "Gespeichert ✓" → popup disappears.
2. Reload the page, open `notes.html` → the snippet appears under
   "Notizen" with a working link back to the lesson.
3. Click "Entfernen" on a snippet → it disappears from the list and from
   a subsequent `AIFSProgress.getAllSnippets()` call.
4. Export → downloaded `.md` contains both the Key Terms section (if any)
   and the new Notizen section.
5. Confirm the removed contextmenu code left no dead CSS and that
   right-clicking `#keyTermsSaveBtn` now shows the normal browser context
   menu.
6. Nav badge count on all pages reflects snippets + key terms combined.
