/**
 * Language resolution (port of i18n.php). The active language comes from the
 * `lang` cookie; English is the default. Pack loading lives in lang/index.ts.
 */
import { AVAILABLE, DEFAULT_LANG, normalizeLang, type Lang } from "../lang/index.js";

export const I18N_COOKIE = "lang";

export { AVAILABLE, DEFAULT_LANG, normalizeLang };
export type { Lang };

/** Resolve the active language from a raw `lang` cookie value. */
export function resolveLang(cookieValue: string | undefined | null): Lang {
  return normalizeLang(cookieValue);
}
