import { isIP } from 'node:net';
import { unprocessable } from './errors.mjs';

const shortenerHosts = new Set([
  'bit.ly',
  'buff.ly',
  'cutt.ly',
  'goo.gl',
  'is.gd',
  'ow.ly',
  'rb.gy',
  'rebrand.ly',
  'shorturl.at',
  't.co',
  'tinyurl.com',
]);

const affiliateHosts = new Set([
  'amzn.to',
  'geni.us',
  'rstyle.me',
  'redirectingat.com',
  'go.redirectingat.com',
]);

const trackingParameters = new Set([
  'dclid',
  'fbclid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'mkt_tok',
  'msclkid',
  's_cid',
  'twclid',
  'vero_conv',
  'vero_id',
  'wickedid',
  'yclid',
]);

const mediaMarkdown = /!\[[^\]]*\]\s*\(/u;
const mediaHtml = /<\s*(?:img|picture|source|video|audio|iframe|embed|object)\b/iu;
const markdownDestination = /\]\(\s*([^\s)]+)[^)]*\)/gu;
const webUrl = /\bhttps?:\/\/[^\s<>"']+/giu;

function fail(code, message) {
  throw unprocessable(code, message);
}

function stripTrailingPunctuation(raw) {
  let end = raw.length;
  while (end > 0 && /[.,;:!?\]}]/u.test(raw[end - 1])) end -= 1;
  // A final ')' often closes Markdown rather than belonging to the URL. Keep
  // balanced URL parentheses, but peel surplus closers.
  while (end > 0 && raw[end - 1] === ')') {
    const sample = raw.slice(0, end);
    const opens = (sample.match(/\(/g) || []).length;
    const closes = (sample.match(/\)/g) || []).length;
    if (closes <= opens) break;
    end -= 1;
  }
  return { value: raw.slice(0, end), suffix: raw.slice(end) };
}

function canonicalHost(url) {
  return url.hostname.replace(/^www\./i, '').toLowerCase();
}

function isAmazonHost(hostname) {
  const host = hostname.toLowerCase();
  return host === 'amazon.com' || host.startsWith('amazon.') || host.includes('.amazon.');
}

export function cleanTrackingParameters(url) {
  const cleaned = new URL(url.href);
  for (const key of [...cleaned.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm_') || trackingParameters.has(lower)) cleaned.searchParams.delete(key);
    if (isAmazonHost(cleaned.hostname) && ['tag', 'ascsubtag', 'linkcode', 'camp', 'creative', 'creativeasin'].includes(lower)) {
      cleaned.searchParams.delete(key);
    }
  }
  return cleaned;
}

export function validateUrl(url, { internalOrigins = new Set() } = {}) {
  if (url.protocol !== 'https:') fail('url_scheme', 'External links must use HTTPS.');
  if (url.username || url.password) fail('url_credentials', 'Links containing embedded credentials are not allowed.');

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || isIP(hostname) !== 0) fail('url_ip_literal', 'Links to literal IP addresses are not allowed.');
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.invalid')
  ) {
    fail('url_local_host', 'Links to local or private hostnames are not allowed.');
  }

  const host = canonicalHost(url);
  if (shortenerHosts.has(host) || affiliateHosts.has(host)) {
    fail('url_redirector', 'Please post the direct destination rather than an affiliate or shortened URL.');
  }

  return {
    external: !internalOrigins.has(url.origin),
    url: cleanTrackingParameters(url),
  };
}

export function processCommentUrls(text, { internalOrigins = new Set(), maxExternalLinks = 3 } = {}) {
  if (mediaMarkdown.test(text) || mediaHtml.test(text)) {
    fail('media_not_allowed', 'Images, files and embedded media are not supported in comments.');
  }

  for (const match of text.matchAll(markdownDestination)) {
    const destination = match[1];
    if (/^[a-z][a-z0-9+.-]*:/iu.test(destination) && !/^https:/iu.test(destination)) {
      fail('url_scheme', 'Comment links must use HTTPS.');
    }
  }

  const replacements = [];
  const uniqueExternal = new Map();

  for (const match of text.matchAll(webUrl)) {
    const { value, suffix } = stripTrailingPunctuation(match[0]);
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      fail('url_invalid', 'Comment contains an invalid URL.');
    }

    const result = validateUrl(parsed, { internalOrigins });
    const cleaned = result.url.href;
    replacements.push({ start: match.index, end: match.index + match[0].length, value: `${cleaned}${suffix}` });
    if (result.external) uniqueExternal.set(cleaned, result.url);
  }

  if (uniqueExternal.size > maxExternalLinks) {
    fail('url_limit', `Comments may contain at most ${maxExternalLinks} external links.`);
  }

  let normalizedText = text;
  for (let index = replacements.length - 1; index >= 0; index -= 1) {
    const replacement = replacements[index];
    normalizedText = `${normalizedText.slice(0, replacement.start)}${replacement.value}${normalizedText.slice(replacement.end)}`;
  }

  return {
    text: normalizedText,
    externalUrls: [...uniqueExternal.values()].map((url) => url.href),
  };
}
