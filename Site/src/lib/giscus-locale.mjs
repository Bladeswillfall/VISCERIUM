const GISCUS_LANGUAGES = new Set([
  'ar', 'be', 'bg', 'ca', 'cs', 'da', 'de', 'en', 'eo', 'es', 'eu', 'fa', 'fr', 'gr',
  'hbs', 'he', 'hu', 'id', 'it', 'ja', 'kh', 'ko', 'nl', 'pl', 'pt', 'ro', 'ru', 'th',
  'tr', 'uk', 'uz', 'vi', 'zh-CN', 'zh-HK', 'zh-TW',
]);

/**
 * Translate a BCP-47 site locale to a locale route supported by giscus.app.
 * Giscus uses generic language routes for most languages (for example `en`),
 * while Starlight may expose a regional site language such as `en-GB`.
 */
export function toGiscusLanguage(locale) {
  const input = String(locale ?? '').trim();
  if (!input) return 'en';

  let normalized;
  try {
    [normalized] = Intl.getCanonicalLocales(input);
  } catch {
    return 'en';
  }

  if (GISCUS_LANGUAGES.has(normalized)) return normalized;

  const baseLanguage = normalized.split('-')[0];
  return GISCUS_LANGUAGES.has(baseLanguage) ? baseLanguage : 'en';
}
