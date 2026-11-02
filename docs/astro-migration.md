# Astro migration audit and decisions

## Baseline (main a3c294a)

Five root HTML pages duplicate navigation, footer, metadata and favicons. A single
CSS file contains the warm cream/orange/sage/gold palette and a dark navy theme.
Four ES modules initialize navigation, optional theme persistence, and the contact
form. Three favicon assets and a résumé PDF are public. There are no other project
screenshots. A copy script assembles `dist/`, excluding hidden files. There are 25
Node tests for the Worker, frontend submission behavior and blocked theme storage.

The custom `worker/index.js` owns `/api/contact` and `/api/contact/config`, with
ASSETS fallback, strict same-origin JSON handling, streamed body limits, field
validation, Turnstile, rate limiting and Resend idempotency. Required secrets are
server-side. The local environment is explicitly dry-run with public challenge
test credentials. This behavior must remain unchanged.

## Architecture and phased plan

1. Generate static HTML with Astro into `dist/`, the existing ASSETS directory.
   Keep `worker/index.js` and the production binding configuration unchanged.
   Neither SSR nor the Cloudflare adapter is necessary for a static frontend.
2. Share shell/navigation/footer, page metadata, theme initialization, project
   cards and contact form through Astro components. Bundle only theme/contact JS.
3. Define a validated Markdown project collection, including accurate development
   status and optional repository, demo, image and architecture assets.
4. Evolve the existing palette through typography, hierarchy, engineering diagrams,
   responsive grids, visible focus states and reduced-motion support.
5. Verify pages, legacy URLs, links, assets, theme and API locally before retiring
   duplicated frontend code. Add PR validation without deployment permissions.
6. Document changes and make local commits. Do not push, merge, deploy, alter
   secrets or send real email during this migration.

## Necessary versus optional

Necessary: Astro compiler, content schema/types, shared layout, public asset move,
static route checks and updated scripts. Optional and omitted: React, MDX, SSR,
Cloudflare adapter, animation libraries, databases and new email infrastructure.

## Risks and mitigations

- Existing `/about.html`, `/projects.html`, `/resume.html`, `/contact.html` links:
  use Astro's file build format and verify Workers' clean-URL handling as well.
- Contact initialization: keep field IDs and the JSON contract; bundle its tested
  module only where the form exists. Use real local Worker dry-run verification.
- Theme flashing: apply the saved/system theme to the root before first paint,
  independent of the optional contact script. Catch storage failures.
- Asset exposure: `public/` contains only explicitly copied public files; no
  backend/config/secrets. Generated HTML and `_astro` assets live in `dist/`.
- Git-triggered deployment: retain all work locally on `feature/astro-migration`.
  Existing production remains independent of the unpushed feature branch.
- Preview origin: use the existing `localhost:8787` Wrangler local environment.
  Rebuild Astro assets after frontend edits, then reload the integrated preview.

## Content requiring owner review

The original résumé lists May 2023–October 2024 for the first Amcor role but also
claims promotion after approximately ten months. The migration retains explicit
role dates and omits that conflicting elapsed-time claim pending confirmation.

Atlas is active development per the brief; no repository URL or schema details
were supplied. No URL, metrics, entities or completion claims are invented.
Power Automate Desktop and Copilot agents are included at the level authorized in
the brief; workflow details and employer-specific systems remain undisclosed.
AWS certification preparation, React coursework, orchestration, IaC and homelab
work are identified as learning goals, not completed credentials or production
experience. The original résumé PDF is preserved byte-for-byte and may contain
older wording; updating that document is a separate owner review task.

## References

- https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/
- https://docs.astro.build/en/guides/content-collections/

## Routing adjustment after verification

Local testing showed the default Workers missing-asset response did not render Astro’s 404 page. The sole Wrangler change adds `assets.not_found_handling: "404-page"`; Worker source, API-first routing, bindings, secrets, and domain variables stay unchanged. This is a local file change, not a production deployment. See [Cloudflare SSG routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

## Verification record — November 1, 2026

- `npm run check`: 22 files, no errors, warnings, or hints.
- `npm test`: 28 tests passed. External services are mocked. Includes Worker validation/security/provider behavior, form duplicate/error handling, system/theme behavior with blocked storage, and 4.5:1 text/button design-token contrast checks in both modes.
- `npm run build`: 11 static pages generated.
- `npm run check:site`: all generated routes, local links/anchors, metadata, image alt attributes, unique IDs, and public asset boundaries passed. Unique first-party script content totals approximately 3.2 KB uncompressed; third-party Turnstile assets are additional.
- `npm run test:local`: public routes and original PDF load, private files return 404, legacy `.html` paths redirect to clean paths, custom missing-page response returns 404, API methods/origin/validation/rate limiting passed.
- Local browser form submission returned “Local test passed. No email was sent.” The Worker performed Siteverify using public test credentials; Resend was not called.
- Browser checks covered home, projects, Atlas detail, about, résumé, and contact; theme persisted across reload and navigation. The skip link moved keyboard focus to `main`; navigation reflects the active page. No browser console errors/warnings were observed in the QA tab.
- Responsive inspection covered 320, 390, 768, 1440, and 1920 pixel widths. A 320px decorative diagram overlap was corrected and rechecked; sampled pages had no horizontal document overflow. Focus styles, input labels, live feedback, and reduced-motion CSS are present. This is not a full screen-reader or WCAG conformance audit; Safari/Firefox and real-device checks remain useful before release.
- `wrangler deploy --dry-run --env ""`: packaging passed with the final routing configuration. No upload or deployment occurred.
- `npm audit --audit-level=high`: zero reported vulnerabilities at verification time.
- Original résumé PDF and favicon files were compared byte-for-byte before their old paths were removed. Contact frontend logic was copied unchanged; Worker source is unchanged.

The original root HTML/CSS/JS and copy build script were retired only after these replacements were verified. The original source remains in Git history. New source uses shared Astro components; the CI workflow validates pull requests but has not yet run on GitHub because no branch push was made.

## Rollout and practical next steps

Review the design and personal content locally, confirm a Node 24 build environment in Cloudflare, then separately authorize push/PR/merge/deployment. Existing Git-triggered deployment settings need review before pushing. Production credentials, DNS, and mailbox configuration were not inspected or changed in this migration. No new real email delivery test was performed.

Future work: provide Atlas implementation examples and a repository URL when ready; add approved PAD/Copilot examples; refresh the résumé PDF; add case-study screenshots as real project interfaces become available. No React integration is needed until a feature warrants it.
