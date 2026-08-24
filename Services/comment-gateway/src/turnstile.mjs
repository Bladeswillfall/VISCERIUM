import { GatewayError } from './errors.mjs';

export async function verifyTurnstile({ token, remoteIp, config, fetchImpl = fetch }) {
  if (config.mode === 'off') return;
  if (!token) throw new GatewayError(403, 'turnstile_required', 'Please complete the anti-bot check before posting.');

  const form = new URLSearchParams({ secret: config.secret, response: token });
  if (remoteIp) form.set('remoteip', remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  let response;
  try {
    response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: controller.signal,
    });
  } catch {
    throw new GatewayError(503, 'turnstile_unavailable', 'Comment safety checks are temporarily unavailable. Your draft has not been posted.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new GatewayError(503, 'turnstile_unavailable', 'Comment safety checks are temporarily unavailable. Your draft has not been posted.');

  let result;
  try {
    result = await response.json();
  } catch {
    throw new GatewayError(503, 'turnstile_invalid_response', 'Comment safety checks are temporarily unavailable. Your draft has not been posted.');
  }

  if (
    result.success !== true ||
    (config.expectedHostname && result.hostname !== config.expectedHostname) ||
    (config.expectedAction && result.action !== config.expectedAction)
  ) {
    throw new GatewayError(403, 'turnstile_failed', 'The anti-bot check could not be verified. Please try again.');
  }
}
