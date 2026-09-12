import defaultTranslations from '../content/i18n/en-GB.json' with { type: 'json' };

const interfaceKeys = Object.keys(defaultTranslations)
  .filter((key) => key.startsWith('viscerium.'));

export const I18N_ROADMAP = Object.freeze({
  published: Object.freeze([
    { locale: 'en-GB', label: 'English', status: 'published' },
  ]),
  placeholders: Object.freeze([
    { locale: 'fr-FR', label: 'French', status: 'placeholder', published: false },
    { locale: 'de-DE', label: 'German', status: 'placeholder', published: false },
  ]),
  nextPriorities: Object.freeze([
    { locale: 'es', label: 'Spanish', status: 'planned' },
    { locale: 'zh', label: 'Chinese', status: 'planned' },
    { locale: 'ru', label: 'Russian', status: 'planned' },
  ]),
});

export const I18N_PLACEHOLDERS = Object.freeze(Object.fromEntries(
  I18N_ROADMAP.placeholders.map(({ locale }) => [
    locale,
    Object.freeze(Object.fromEntries(interfaceKeys.map((key) => [key, null]))),
  ]),
));
