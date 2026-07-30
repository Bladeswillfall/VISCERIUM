const STRUCTURAL_TYPES = new Set(['category', 'continuity', 'era', 'calendar', 'timeline']);
const ERA_HOMEPAGE_PATTERN = /^eras\/(citadel|smog|nearsight|entropy)$/i;

export function normalisePageSlug(value) {
  return String(value ?? '')
    .replace(/\.(md|mdx)$/i, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/index$/i, '')
    .replace(/^index$/i, '');
}

export function classifyCodexPage(entry = {}, fallbackId = '') {
  const slug = normalisePageSlug(entry.slug ?? fallbackId);
  const type = String(entry.type ?? '').trim().toLowerCase();
  const template = String(entry.template ?? '').trim().toLowerCase();
  const isHomepage = template === 'splash' || slug === '';
  const isEraHomepage = type === 'era' || ERA_HOMEPAGE_PATTERN.test(slug);
  const isStructural = isHomepage
    || isEraHomepage
    || STRUCTURAL_TYPES.has(type)
    || entry.explorationPage === true
    || entry.timelinePage === true
    || slug === 'start-here';

  return {
    slug,
    isHomepage,
    isEraHomepage,
    isStructural,
    isStandardArticle: !isStructural,
  };
}
