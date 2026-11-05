# Post-deployment website audit — November 5, 2026

## Release and assessment

Deployed source: `7c777d3` on `feature/astro-migration`, pushed to origin. Cloudflare Worker version: `43768be2-b551-4c30-90ca-93bdfb5dd4b8`. Deployment uploaded 15 changed static assets; production contact dry-run remains false. No email DNS records or credentials were changed. No real emails were sent.

The site is working in the tested paths. The previous canonical, sitemap, robots, error-page indexing, and HTTP redirect issues are resolved live. There is no observed release-blocking failure. The highest-priority follow-up is bringing these release changes into main through review, followed by search discovery setup. Additional features are not needed before sharing the portfolio.

## Verified results

| Area | Evidence |
| --- | --- |
| Build and tests | Astro check: zero errors/warnings/hints; all 28 unit tests pass; build and static site validation pass; local Worker smoke test passes. |
| Dependencies | `npm audit` reports zero known advisories at audit time. This does not establish absence of undiscovered vulnerabilities. |
| Pages and metadata | All 12 sitemap content URLs return 200, each with one H1, a unique title and description, and an exact matching canonical. Homepage canonical is now `/`. |
| Crawling | `/sitemap.xml` returns 200 XML with all 12 content URLs. `/robots.txt` returns 200 and explicitly allows crawling and references the sitemap. |
| Errors | An arbitrary missing URL returns 404 with noindex. Direct `/404` returns 200 but carries noindex and is excluded from the sitemap. |
| Links and assets | All 18 discovered same-origin page/asset URLs return 200. Static build validation separately checks local links, anchors, images, and private-file exclusions. Resume PDF is reachable. Five linked GitHub destinations return 200. |
| HTTPS | HTTP homepage and a case-study path with query string return 301 to the identical HTTPS path/query. HTTPS certificate validation succeeds. No `http:` resource sources were detected in inspected page markup. |
| API | Public config returns the production site key and `dryRun:false`. Unsupported method returns 405; unknown API route 404; malformed JSON 400; foreign Origin 403; unsupported media type 415. Errors are generic JSON. |
| Private files | Requests for `.dev.vars`, `wrangler.jsonc`, `worker/index.js`, and `package.json` return 404. No secret values were inspected or printed. |
| Contact interface | Loading protection transitions to a ready form with no error status. Required name/email/subject/message controls have associated labels; feedback has `aria-live="polite"`. No live submission was made. |
| Navigation and themes | Live navigation from homepage to Contact works. Both light/dark toggles work and selection survives page navigation. |
| Responsive layout | At 390px, homepage, contact, projects, resume, about, Leakline, and Finance API show no horizontal document overflow. No broken loaded images observed on sampled pages. Projects also fits at 768px; desktop contact fits at 1280px. Temporary viewport override was reset. |
| Accessibility foundations | Static checks verify image alt and anchors; DOM exposes navigation, main, headings, form labels, and status region. Existing text/button token contrast tests pass in both themes. This is not a complete WCAG conformance audit. |

## Follow-up priorities

1. **Synchronize main with the deployed release.** The previous migration PR #9 is merged, and its main tree matched the branch before this SEO work. The new SEO commit is pushed on `feature/astro-migration` and deployed directly, but is not merged into main. A future main-based deployment could revert these fixes until a new PR is reviewed and merged. This audit does not merge branches.
2. **Complete search discovery setup.** Verify Google Search Console ownership, submit `https://cybersteveon.dev/sitemap.xml`, and inspect homepage/project indexing. Actual search inclusion and recruiter traffic remain unverified. Public GitHub profile still has empty name, website, and bio fields; add the portfolio URL there and ensure LinkedIn/application materials link to it. Existing CLI lacks the permission to edit those profile fields, so no profile changes were made.
3. **Remove stale migration wording.** The portfolio case study still says the live link may show the prior design until deployment. README also says the redesign awaits merge/deployment and lists five project detail pages; there are now seven. These are small content/documentation follow-ups, not runtime faults.
4. **Add security headers deliberately.** The live homepage lacks explicit CSP, frame restrictions, Referrer-Policy, Permissions-Policy, and X-Content-Type-Options. The API already sets nosniff and no-store. Consider static-asset headers with a Turnstile-compatible CSP and test both forms before rollout. HTTPS is working; missing headers alone do not demonstrate an exploit. No new header policy was installed during this audit.
5. **Optional polish and measurement.** Run dedicated Lighthouse/axe and keyboard/screen-reader checks, measure real Core Web Vitals once traffic exists, and consider truthful Person structured data. A www alias is optional; the apex domain works. Avoid treating these as reasons to postpone sharing the site.

## Limits and observations

- Email delivery and Reply-To were previously confirmed by the owner, but were not retested in this audit. Live malformed requests stop before external verification/delivery. Provider failures, Turnstile hostname/action checks, input limits, duplicate handling, and rate limiting were exercised with unit/local tests rather than abusive production traffic.
- Turnstile emitted opaque console warnings/errors from its third-party challenge URL in the automated browser. The form became ready with no user-facing error; these messages alone do not prove a failure. A real email acceptance/delivery test would need separate explicit approval.
- LinkedIn rejected the HEAD probe with 405; this is not proof of a broken profile. That destination remains manually unverified.
- No authenticated Cloudflare dashboard/analytics, Search Console, full penetration test, email-provider account audit, Lighthouse performance score, field Core Web Vitals, or exhaustive assistive-technology testing was performed. Only public HTTP responses, repository code/tests, dependency advisories, and sampled browser behavior were assessed.
- Browser screenshots and raw HTTP results were retained locally outside the repository. This report contains no secrets or private administrator addresses.

## Recommendation

Review and merge the deployed SEO changes, clean up the stale wording, and complete Search Console/GitHub discovery setup. Then hold feature development and use the portfolio in applications while collecting real feedback. Header hardening and measured accessibility/performance improvements can be a focused follow-up instead of another redesign.
