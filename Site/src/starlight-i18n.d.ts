type VisceriumTranslations = typeof import('./content/i18n/en-GB.json');

declare global {
  namespace StarlightApp {
    interface I18n extends VisceriumTranslations {}
  }
}

export {};

declare module 'virtual:starlight/components/SiteTitle' {
  const SiteTitle: typeof import('@astrojs/starlight/components/SiteTitle.astro').default;
  export default SiteTitle;
}

declare module 'virtual:starlight/components/ThemeSelect' {
  const ThemeSelect: typeof import('@astrojs/starlight/components/ThemeSelect.astro').default;
  export default ThemeSelect;
}

declare module 'virtual:starlight/components/MobileTableOfContents' {
  const MobileTableOfContents: typeof import('@astrojs/starlight/components/MobileTableOfContents.astro').default;
  export default MobileTableOfContents;
}

declare module 'virtual:starlight/components/TableOfContents' {
  const TableOfContents: typeof import('@astrojs/starlight/components/TableOfContents.astro').default;
  export default TableOfContents;
}
