# Steven Wager Portfolio

This repository contains the source code for my personal portfolio website.

The portfolio highlights my professional experience, technical projects, and continued growth as a software engineer while documenting my transition from enterprise IT into software development.

## Technologies

- HTML5
- CSS3
- JavaScript (ES Modules)

## Features

- Responsive multi-page website
- Dark and light mode
- Active navigation highlighting
- Downloadable résumé
- Project showcase
- Contact information

## Featured Projects

- SecurelyScoped
- Windows Privacy & Setup Automation
- Personal Portfolio Website

## Live Website

https://cybersteveon.dev

## Repository Structure

```text
cybersteveon-portfolio/
│
├── css/
├── js/
├── images/
│   └── favicon/
├── files/
│
├── index.html
├── about.html
├── resume.html
├── projects.html
├── contact.html
│
├── README.md
└── .gitignore
```

## Future Improvements

- Additional software projects
- Expanded project demonstrations
- Improved responsive design
- Accessibility enhancements
- Performance optimizations

## Cloudflare Worker and contact form

Hosting uses **Cloudflare Workers with static assets**, not Pages. The frontend remains
HTML/CSS and native JavaScript ES modules. `scripts/build.mjs` copies only HTML and
public asset directories into `dist/`; repository files, tests, Worker source,
credentials and dependencies are not public assets.

- `worker/index.js` handles `/api/*` before static asset routing.
- `GET /api/contact/config` exposes only the public Turnstile site key and local-test status.
- `POST /api/contact` accepts JSON. Other methods return JSON `405` with `Allow`.
- Other API paths return JSON `404`; website requests use the `ASSETS` binding.
- `js/main.js` initializes theme/navigation independently, then loads `js/contact.js`
  only on the contact page. A failed contact import cannot disable dark mode.
- Theme storage is optional; blocked `localStorage` does not disable the toggle.
- Navigation supports both `/about.html` and Workers' clean `/about` paths.

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

### Local development and checks

Use Node.js 22 or newer:

```sh
npm ci
npm test
npm run dev
```

Open `http://localhost:8787/contact`. Use this exact hostname because local origin
validation is explicit. `npm run dev` builds assets before starting Wrangler;
rerun `npm run build` after editing HTML/CSS/browser JS, then reload the browser.
Worker changes reload automatically. Do not use `file://` for ES modules.

The `local` environment uses Cloudflare's public Turnstile test keys and
`CONTACT_DRY_RUN=true`. It validates through Siteverify but **never calls Resend**,
even if a real API key exists locally. The page clearly labels test mode and its
success message says no email was sent. Local dry-run works only on HTTP loopback;
production rejects accidentally enabled dry-run or the always-pass test keys.
Unit tests inject mock HTTP and make no real email requests.

```sh
npm run check:deploy
```

This builds the public assets and runs `wrangler deploy --dry-run`, without
publishing. A successful dry-run validates packaging/configuration, not account
permissions, production secrets, custom-domain routing, or email deliverability.

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
   report actual email delivery. See the deployment verification record below for the latest real-test status.

### Security and limits

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
- Resend Free currently allows 3,000 emails/month and 100/day. Quota exhaustion
  results in a safe failure, not a paid-plan upgrade by this application.

References: [Resend sending API](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

### Verification performed

- 25 automated tests passed, including mocked Resend requests, validation, header
  injection rejection, challenge failures, provider failures, duplicate keys,
  frontend repeated-submit prevention, network errors, and blocked theme storage.
- Wrangler local HTTP checks passed for public assets, private-file exclusions,
  unsupported methods, invalid JSON data, origin checks, and rate limiting.
- Browser checks passed for dry-run form submission, dark mode and persistence
  across reload/navigation, active navigation, and the mobile contact layout.
- Production bundle/configuration dry-run passed. Production secret names were verified without reading values. See the
  deployment verification record below for live-test status.

To repeat local HTTP checks with `npm run dev` already running:

```sh
node scripts/smoke-local.mjs
```

This deliberately reaches the local rate limit. Wait a minute before further form
submissions or another smoke-check run.

### Deployment verification — November 1, 2026

With explicit approval, deployed version
`4dae6dff-f929-41da-99a9-86ce2f3c3828` to the existing Worker.
The public site key is configured and both required secret names exist. The build
now also excludes hidden files within public asset directories.

Submitted one approved test through `https://cybersteveon.dev/contact`. Production
Turnstile verification and Resend acceptance succeeded; the browser displayed
“Your message was accepted for delivery. Thank you!” The mailbox owner confirmed
receipt in Zoho and reported replying to the test email. Incoming delivery is
confirmed. The test used `visitor@example.com` as Reply-To, so successful reply
delivery to a real visitor was not tested. No Git commit, push, or merge was
performed; the deployed source changes remain uncommitted on `adding-contact-form`.
