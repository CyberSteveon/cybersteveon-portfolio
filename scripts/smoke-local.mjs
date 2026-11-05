import assert from "node:assert/strict";

// This only sends invalid requests to the local dry-run server. Never sends email.
const base = "http://localhost:8787";
const config = await (await fetch(`${base}/api/contact/config`)).json();
assert.equal(config.dryRun, true, "Start npm run dev before running this check");
for (const path of ["/", "/contact", "/about", "/resume", "/projects", "/projects/atlas", "/contact.html", "/files/Steven-Wager-Resume.pdf", "/images/favicon/favicon.svg"]) {
    assert.equal((await fetch(base + path)).status, 200, path);
}
for (const path of ["/worker/index.js", "/.dev.vars", "/wrangler.jsonc", "/package.json", "/README.md"]) {
    assert.equal((await fetch(base + path)).status, 404, `Private asset ${path}`);
}
const missing = await fetch(`${base}/missing-migration-page`);
assert.equal(missing.status, 404);
assert.ok((await missing.text()).includes('Page not found | Steven Wager'));
for (const path of ['/about', '/projects', '/resume', '/contact', '/projects/atlas']) {
    const legacy = await fetch(`${base}${path}.html`, { redirect: 'manual' });
    assert.equal(legacy.status, 307);
    assert.equal(legacy.headers.get('location'), path);
}
const homepage = await (await fetch(base)).text();
assert.ok(homepage.includes('rel="canonical" href="https://cybersteveon.dev/"'));
const sitemap = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemap.status, 200);
assert.ok(sitemap.headers.get('content-type').includes('xml'));
assert.ok((await sitemap.text()).includes('<loc>https://cybersteveon.dev/</loc>'));
const robots = await fetch(`${base}/robots.txt`);
assert.equal(robots.status, 200);
assert.ok((await robots.text()).includes('Sitemap: https://cybersteveon.dev/sitemap.xml'));
const errorPage = await (await fetch(`${base}/404`)).text();
assert.ok(errorPage.includes('name="robots" content="noindex, follow"'));
assert.equal((await fetch(`${base}/api/contact`)).status, 405);
const headers = { Origin: base, "Content-Type": "application/json" };
const post = (body, extra = {}) => fetch(`${base}/api/contact`, { method: "POST", headers: { ...headers, ...extra }, body });
assert.equal((await post("null")).status, 400);
assert.equal((await post("{}", { Origin: "https://evil.example" })).status, 403);
let limited = false;
for (let i = 0; i < 8; i++) if ((await post("{}")).status === 429) limited = true;
assert.ok(limited, "Native local rate limit");
console.log("Static assets, private-file exclusions, methods, validation, origin protection, and native rate limiter passed.");
