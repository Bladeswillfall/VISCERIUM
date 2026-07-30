# Contact form setup

The Astro site remains static. Its `/contact/` page renders a native form only when a separate HTTPS Cloudflare Worker endpoint and a public Turnstile site key are configured. No email-sending code or secret is bundled into the Pages output.

## Architecture

```text
Browser
  -> Turnstile challenge
  -> separate contact Worker
       -> Turnstile Siteverify
       -> abuse and input checks
       -> Resend API
```

Do not migrate the whole Astro application to Workers for this form.

## Public Pages variables

These values are safe to expose to the browser:

```text
PUBLIC_CONTACT_FORM_ENABLED=0
PUBLIC_CONTACT_FORM_ENDPOINT=
PUBLIC_TURNSTILE_SITE_KEY=
```

Set `PUBLIC_CONTACT_FORM_ENABLED=1` only after the endpoint and site key are real. The checked-in default keeps the form unavailable.

If the Worker uses a custom domain instead of `workers.dev`, add its exact origin to `form-action` in `Site/public/_headers` before enforcing the current report-only Content Security Policy.

## Worker-only configuration

Keep these values in the separate Worker's secret or server-side configuration store:

```text
RESEND_API_KEY
TURNSTILE_SECRET_KEY
CONTACT_TO_EMAIL
CONTACT_FROM_EMAIL
CONTACT_ALLOWED_ORIGIN=https://www.viscerium.co.uk
TURNSTILE_EXPECTED_HOSTNAME=www.viscerium.co.uk
TURNSTILE_EXPECTED_ACTION=contact
```

`RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` must be Cloudflare Worker secrets. Do not put them in Pages variables, Wrangler `[vars]`, client code, logs, or the repository. `Site/.dev.vars.example` contains blank local-development names only. Keep the real `Site/.dev.vars` untracked.

The recipient and sender values are owner-controlled and intentionally blank. `CONTACT_FROM_EMAIL` must use an address on the verified sending subdomain, such as `mail.viscerium.co.uk`. Use the visitor's submitted email address as Resend `Reply-To`, never as `From`.

## Worker request contract

The static form sends `multipart/form-data` with:

- `name`
- `email`
- `subject`
- `message`
- `website`, an expected-empty honeypot
- `cf-turnstile-response`, supplied by Turnstile

The Worker must:

1. Accept only `POST`.
2. Check the request origin against `CONTACT_ALLOWED_ORIGIN`.
3. Apply a strict body-size limit and bounded field lengths.
4. Reject a populated honeypot.
5. Validate the email address without using it as the sender.
6. Call Turnstile Siteverify with `TURNSTILE_SECRET_KEY` and `cf-turnstile-response`.
7. Reject expired, reused, failed, wrong-hostname, or wrong-action Turnstile results.
8. Apply rate limits and avoid logging message bodies or credentials.
9. Send through Resend from the verified `mail.viscerium.co.uk` identity and set the visitor as `Reply-To`.
10. Return clear success, validation-failure, and rate-limit responses without exposing provider errors.

Do not activate a Worker implementation until the real endpoint, sender, recipient, site key, secrets, rate-limit policy, and response behaviour have been approved.

## Resend and DNS

1. Add `mail.viscerium.co.uk` in Resend.
2. Add exactly the SPF and DKIM records supplied by Resend.
3. Wait for Resend to verify the domain.
4. Configure DMARC deliberately after reviewing existing mail use for the parent domain.
5. Create a narrowly scoped Resend API key and store it as a Worker secret.

Do not fabricate DNS values. Copy the provider-supplied records exactly.

## Turnstile

1. Create a widget for `www.viscerium.co.uk`.
2. Add its public site key to the Pages project.
3. Store its secret key only in the Worker.
4. Validate every token server-side. Client-side completion alone is not proof.
5. Check the expected hostname and `contact` action.

## Validation before launch

Test all of these against the deployed Worker:

- successful delivery
- missing and malformed fields
- invalid, expired, and reused Turnstile tokens
- wrong origin, hostname, and action
- honeypot and rate-limit handling
- provider failure without secret or message leakage
- verified `From` identity and visitor `Reply-To`
- mobile and keyboard form use
- no Worker secrets in Pages output or browser requests
