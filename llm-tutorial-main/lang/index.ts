/**
 * Tiny i18n pack loader. No framework, no build step of its own: the language
 * packs are plain JSON (generated once from the old lang/*.php arrays — see the
 * README for the regeneration one-liner) and are imported directly here, so
 * they live in memory with zero store reads. English is the default.
 */
import contentEn from "./content.en.json" with { type: "json" };
import contentDe from "./content.de.json" with { type: "json" };
import uiEn from "./ui.en.json" with { type: "json" };
import uiDe from "./ui.de.json" with { type: "json" };

export type Lang = "en" | "de";
export type Pack = Record<string, any>;

/** Languages that ship a full content + UI pack. First entry is the default. */
export const AVAILABLE: Lang[] = ["en", "de"];
export const DEFAULT_LANG: Lang = "en";

const CONTENT: Record<Lang, Pack> = { en: contentEn as Pack, de: contentDe as Pack };
const UI: Record<Lang, Pack> = { en: uiEn as Pack, de: uiDe as Pack };

/** Normalise an arbitrary string to a supported language (defends stray cookies). */
export function normalizeLang(lang: string | undefined | null): Lang {
  return AVAILABLE.includes(lang as Lang) ? (lang as Lang) : DEFAULT_LANG;
}

/** Load a language pack section ("content" | "ui") for the given language. */
export function pack(section: "content" | "ui", lang?: string): Pack {
  const l = normalizeLang(lang);
  return section === "content" ? CONTENT[l] : UI[l];
}

/**
 * Number of chapters in the content (language-independent — any pack yields the
 * same count). Used to bound the unlock. Mirrors sync_chapter_count().
 */
let _chapterCount: number | null = null;
export function chapterCount(): number {
  if (_chapterCount === null) {
    const chapters = (CONTENT[DEFAULT_LANG] as Pack).chapters;
    _chapterCount = Array.isArray(chapters) ? chapters.length : 0;
  }
  return _chapterCount;
}
