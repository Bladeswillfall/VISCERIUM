const imageExtension = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;

function cleanSegment(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function routePartsForAsset(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const withoutSuffix = raw.split(/[?#]/, 1)[0];
  if (withoutSuffix.startsWith('/assets/images/')) {
    const relative = withoutSuffix.slice('/assets/images/'.length);
    return ['images', ...relative.split('/').filter(Boolean).map(cleanSegment)];
  }
  if (withoutSuffix.startsWith('/assets/maps/')) {
    const relative = withoutSuffix.slice('/assets/maps/'.length);
    return ['maps', ...relative.split('/').filter(Boolean).map(cleanSegment)];
  }
  if (/^https?:\/\//i.test(withoutSuffix)) {
    try {
      const url = new URL(withoutSuffix);
      const filename = url.pathname.split('/').filter(Boolean).at(-1);
      if (!filename || !imageExtension.test(filename)) return null;
      return ['external', cleanSegment(url.hostname), cleanSegment(filename)];
    } catch {
      return null;
    }
  }
  if (!withoutSuffix.includes('/') && imageExtension.test(withoutSuffix)) {
    return ['images', cleanSegment(withoutSuffix)];
  }
  return null;
}

export function attributionSlugForAsset(value) {
  const parts = routePartsForAsset(value);
  return parts?.every(Boolean) ? ['attribution', ...parts].join('/') : undefined;
}

export function attributionRouteForAsset(value) {
  const slug = attributionSlugForAsset(value);
  return slug ? `/${slug}/` : undefined;
}
