# Steven Wager — Forge Terminal

An engineering portfolio built with Astro, Markdown, CSS, and small native JavaScript modules. Software development, cloud infrastructure, and automation are presented through actual projects, enterprise IT experience, and clearly labeled learning goals.

Live website: [cybersteveon.dev](https://cybersteveon.dev). The Astro redesign lives on `feature/astro-migration` until an approved merge/deployment.

## Architecture

```text
Browser → Cloudflare Worker
           ├─ /api/* → existing contact backend → Turnstile → Resend → Zoho inbox
           └─ other paths → ASSETS → Astro-generated HTML/CSS/JavaScript
```

Astro generates static pages into `dist/`. `worker/index.js` remains the runtime entry; no Cloudflare Astro adapter, SSR, React, or replacement email backend is needed. Only `dist/` is published as static assets. Secrets stay in Worker bindings, outside the frontend build.

```text
src/layouts/BaseLayout.astro   Shared metadata, navigation, theme initialization
src/components/               Navigation, footer, headings, project cards, form, toolkit
src/pages/                    Original routes and project detail template
src/content/projects/         Validated Markdown project collection
src/content.config.ts         Collection schema
src/scripts/                  Native theme and contact modules
src/styles/global.css         Design tokens, layouts, responsive and print styles
public/                       Public-only favicon, social card, résumé PDF
worker/index.js               Existing contact API
wrangler.jsonc                Existing Workers static-assets configuration
scripts/                      Built-site and local HTTP checks
tests/                       Mocked API, form, and theme regression tests
```

Never place secrets or private documents in `public/`: Astro copies it into the public output. The build removes macOS `.DS_Store` metadata from generated output. `.dev.vars*` and `.env*` remain ignored. The public Turnstile site key and local test keys are not credentials.

## Development

Use Node **22.23.4 or newer** (Node 24 recommended) and npm 9.6.5+.

```sh
npm ci
npm run check
npm test
npm run dev
```

Open `http://localhost:8787` using exactly `localhost`, as the API enforces the origin. `dev` builds Astro and starts Wrangler's integrated preview. After frontend edits, run `npm run build` in another terminal and reload; Worker edits reload automatically. This deliberately tests the same static-assets/Worker boundary as production. Stop with Ctrl+C. If port 8787 is occupied, reuse or stop the existing preview instead of launching another.

The `local` environment uses public Turnstile test keys and dry-run mode. Siteverify requires internet access; **Resend is never called locally**. No production secrets are needed. Wrangler's warning that production `secrets` are not inherited by `local` is expected; local uses its own public test configuration.

```sh
npm run build           # Generate 13 static pages
npm run check:site      # Check built routes, links, anchors, metadata, and asset boundaries
npm run test:local      # With dev running: HTTP/API checks; deliberately reaches rate limit
npm run check:deploy    # Build + Wrangler packaging dry-run; does not deploy
```

Wait one minute after `test:local` before testing the form again. Unit tests mock external services and do not send email. Pull requests run type checks, unit tests, build, and static checks through `.github/workflows/quality.yml`; this workflow does not deploy.

## Routes and theme

`/`, `/about`, `/projects`, `/resume`, and `/contact` are preserved. Astro uses file-format output (`about.html`, etc.); Workers provides clean-path handling and redirects old `.html` URLs. Five project detail pages live under `/projects/<slug>`. `404.html` supplies the missing-page view.

The theme uses the system preference unless the visitor chooses a mode. The preference persists when storage is available; blocked storage does not break the toggle. An early head script applies the theme before rendering, and navigation works without JavaScript. Styles include visible focus, a skip link, reduced motion, wrapping mobile navigation, and print styling.

## Update project content

Add a Markdown file in `src/content/projects/`. The validated frontmatter is:

```yaml
---
title: Project name
slug: project-name
description: A concise, factual summary.
technologies: [Java, SQL]
status: Planned
category: Software development
featured: false
order: 6
visual: code
# repository: https://github.com/your-account/project
# demo: https://example.com
# image: { src: /images/project.png, alt: Meaningful screenshot description }
# architecture: { src: /images/architecture.svg, alt: Architecture description }
---
## Overview
Describe only work that exists, and clearly label future plans.
```

Status is `Completed`, `Active Development`, or `Planned`. `visual` is `database`, `network`, `terminal`, `code`, `infrastructure`, or `finance`; it supplies a decorative illustration when no image is provided. Repository, demo, image, and architecture are optional. Slugs must be unique lowercase words separated by hyphens. Body content renders as Markdown in the shared case-study layout. Put public images under `public/images/` and use absolute site paths.

## Production rollout — requires approval

The migration preserves `worker/index.js`. The only Wrangler change is `assets.not_found_handling: "404-page"` to serve the generated 404 page with a 404 status. Keep the existing custom domain, `ASSETS`, rate limiter, production variables, `RESEND_API_KEY`, and `TURNSTILE_SECRET_KEY`. Zoho DNS requires no change.

Before an approved push, review Cloudflare's Git build branch settings: a push may trigger deployment. Configure a supported Node version (24) in the build environment. Build command remains `npm run build`; deploy command remains `npx wrangler deploy --env ""`. Never deploy the `local` environment.

For a separately approved CLI deployment:

```sh
npm ci
npm run check
npm test
npm run check:deploy
npm run check:site
npx wrangler deploy --env ""
```

A packaging dry-run cannot verify remote secrets, account permissions, or inbox delivery. After deployment, inspect the live routes, theme, and form configuration, then obtain approval for one real submission and verify receipt and Reply-To. Do not claim delivery solely from an accepted API response.

See [contact API, security, and configuration](docs/contact-api.md) and [migration audit and review notes](docs/astro-migration.md).

## Content requiring owner review

- Atlas's repository link, schema examples, screenshots, and concrete milestones were not supplied; no details were invented.
- Professional PAD/Copilot work is described generally. Add only approved, nonconfidential examples.
- Employment dates are preserved. Old promotion-duration wording conflicted with those dates and was removed from the web résumé.
- The owner supplied an updated résumé PDF. Its summary still needs promotion-duration review; the web résumé uses the explicit employment dates.
- AWS certification preparation, orchestration/homelab learning, and Java coursework are not presented as completed credentials or professional specialization.
