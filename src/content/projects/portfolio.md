---
title: Forge Terminal
slug: portfolio
description: "This portfolio: an Astro frontend backed by a Cloudflare Worker, with a validated, spam-protected contact API."
technologies: [Astro, JavaScript, Cloudflare Workers, Resend]
status: Active Development
category: Web / serverless
repository: https://github.com/CyberSteveon/cybersteveon-portfolio
demo: https://cybersteveon.dev
featured: true
order: 2
visual: network
---
## More than a résumé

I built this portfolio to give my professional experience, personal projects, and engineering interests a shared home. It began with semantic HTML, CSS, and native JavaScript, and continues to evolve alongside my learning.

## Architecture

Astro generates static pages and project case studies from Markdown. Cloudflare Workers serves those assets and routes `/api/contact` to a small custom backend. The frontend does not require React or server-rendered pages.

The contact endpoint validates the request, checks Cloudflare Turnstile, applies rate limiting, and sends a plain-text email through Resend to my professional Zoho mailbox. The visitor's validated address becomes Reply-To.

## Engineering decisions

- Reusable layouts keep navigation, metadata, and themes consistent.
- Markdown collections separate project content from layout code.
- The existing Worker stays independent of the frontend framework.
- Secret values remain in Cloudflare; the browser receives only public configuration.
- Idempotency keys reduce duplicate emails after retries.
- Local development uses a clearly labeled dry-run mode that cannot send email.

## Verification and learning

The project includes focused tests for validation, API failures, spam protections, frontend submission behavior, and theme storage failures. The original production contact integration was tested with an approved message received in Zoho.

The Astro redesign is a separate migration, verified locally before production approval. Building the site has reinforced semantic HTML, maintainable CSS, API design, and the distinction between accepting an email request and confirming delivery.

## Next steps

Continue developing case studies and improving accessibility as the project grows. The live link may show the prior design until the migration is approved and deployed.
