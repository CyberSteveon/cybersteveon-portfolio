# Contact API and deployment

The existing Worker, production settings, and secret names are preserved. No DNS or secret changes are needed for the Astro migration.

### Request and email flow

The browser serializes `FormData`, adds a Turnstile token, and POSTs JSON to the
same origin. The Worker checks origin, content type, rate limit, body size, fields,
honeypot, and Turnstile before calling Resend over HTTPS using native `fetch()`.
Resend receives a plain-text email addressed only to `contact@cybersteveon.dev`.
The sender is `portfolio@notify.cybersteveon.dev`; the validated visitor email is
`reply_to`. Name, email, subject, and message appear in the body. Zoho continues
receiving mail and sending your personal replies normally.

A success response means **Resend accepted the submission**, not confirmed inbox
delivery. Failures retain the entered fields. The submit button is disabled while
processing; status messages use a polite live region and the form exposes its busy
state. A fresh Turnstile token is required after every attempt.

### Production configuration (manual, before authorized deployment)

1. In Resend, verify **sending** for `notify.cybersteveon.dev`. Add only the
   generated DNS records for that sending/bounce subdomain. Do not enable Resend
   receiving or replace the existing Zoho root MX/SPF/DKIM/DMARC records.
2. Create a Resend API key with **Sending access**, restricted to this domain.
3. Create a **Managed Turnstile widget** in Cloudflare for `cybersteveon.dev`.
   Put its public site key in top-level `vars.TURNSTILE_SITE_KEY` in
   `wrangler.jsonc`. Keep its secret key private. Do not use local test keys there.
4. Confirm `ALLOWED_ORIGIN=https://cybersteveon.dev`. The Worker must receive
   requests on that origin. Configure the existing Worker's custom domain in
   Cloudflare if it is not already connected; no route change was made here.
5. Check the rate-limit namespace `1001` is unused by unrelated Workers in the
   same account; change it if necessary. Local namespace `1002` is for simulation.
6. Add the secrets to the existing production Worker using the hidden prompts:

   ```sh
   npx wrangler secret put RESEND_API_KEY --env ""
   npx wrangler secret put TURNSTILE_SECRET_KEY --env ""
   ```

   **Only run these when production changes are authorized.** Secret commands can
   update the deployed Worker. Never put keys in shell arguments, Git, browser
   code, chat, screenshots, or logs. The email addresses and site key are public
   configuration, not secrets. No Zoho credentials are required.
7. After approval to deploy, run:

   ```sh
   npm ci
   npm test
   npm run check:deploy
   npx wrangler deploy --env ""
   ```

   Use the top-level environment for production. Never deploy `--env local`.
   If Cloudflare Workers Builds deploys from Git, ensure its build command is
   `npm run build` before the deploy command. Branch pushes can trigger deployment;
   review that integration before an authorized push.
8. Request approval for one real end-to-end test. Submit a clearly labeled test
   on the production form; check Resend acceptance/delivery status and receipt in
   Zoho (including spam). Verify name/message formatting and Reply-To. Only then
   report actual email delivery. The original contact implementation was tested before this migration; the migration uses local dry-run tests only.

### Security and limits

- `secrets.required` declares production secret names (never values), allowing
  Wrangler to reject deployments that lack the required secrets. This guard
  must be committed and included in the Git build to protect automatic deployments.
- Only same-origin JSON POSTs are accepted; no permissive CORS. Origin checking
  blocks ordinary cross-site browser submission, but is not authentication—bots
  can forge it. Turnstile is independently verified server-side.
- Body size is capped at 24 KiB while reading, even without Content-Length.
  Limits: name 100, email 254, subject 150, message 5,000 characters.
- Non-object JSON, invalid types, invalid email syntax, empty/overlong fields,
  header control characters, and a filled honeypot are rejected.
- Plain text prevents HTML injection. Visitors cannot control sender or recipient.
- Production Turnstile verification requires the expected hostname and `contact`
  action. Tokens are single-use and expire after five minutes.
- `CONTACT_RATE_LIMITER` permits approximately five attempts per minute per IP
  **per Cloudflare location**. This is not a strict worldwide quota; shared IPs
  may share the allowance. It supplements Turnstile and cannot guarantee that a
  distributed attacker will never exhaust Resend's free quota.
- A SHA-256 hash of the canonical outgoing email is the Resend idempotency key.
  Identical submissions are deduplicated for Resend's 24-hour retention window,
  including retries after uncertain network failures. This intentionally also
  suppresses an identical deliberate resubmission during that window.
- External calls have timeouts. Missing configuration and verification failures
  fail closed. Responses use consistent `{ok, code, message}` JSON, no-store,
  and appropriate 400/403/405/413/415/429/502/503 status codes.
- No secrets, message bodies, or upstream exception details are logged by the
  application. Cloudflare observability retains its existing configuration.
  Resend processes the message contents; review its retention settings if needed.
- Check the current Resend account quota before production rollout. Quota exhaustion
  results in a safe failure, not a paid-plan upgrade by this application.

References: [Resend sending API](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

