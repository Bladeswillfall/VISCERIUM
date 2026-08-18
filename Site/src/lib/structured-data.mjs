export function canonicalUrlForPath(pathname, siteUrl) {
  return new URL(pathname, siteUrl).href;
}

export function buildArticleStructuredData({
  title,
  description,
  canonicalUrl,
  publishedIso,
  updatedIso,
  image,
  keywords,
}) {
  if (!canonicalUrl) throw new TypeError('canonicalUrl is required');

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: String(title || 'VISCERIUM'),
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
  };

  if (description) data.description = String(description);
  if (publishedIso) data.datePublished = publishedIso;
  if (updatedIso) data.dateModified = updatedIso;
  if (image) data.image = image;
  if (Array.isArray(keywords) && keywords.length > 0) data.keywords = keywords.map(String);

  return data;
}
