type VisceriumTranslations = typeof import('./content/i18n/en-GB.json');

declare global {
  namespace StarlightApp {
    interface I18n extends VisceriumTranslations {}
  }
}

export {};
