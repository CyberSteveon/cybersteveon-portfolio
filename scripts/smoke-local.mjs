import assert from "node:assert/strict";

// This only sends invalid requests to the local dry-run server. Never sends email.
const base = "http://localhost:8787";
const config = await (await fetch(`${base}/api/contact/config`)).json();
assert.equal(config.dryRun, true, "Start npm run dev before running this check");
for (const path of ["/", "/contact", "/js/main.js", "/css/styles.css", "/images/favicon/favicon.svg"]) {
    assert.equal((await fetch(base + path)).status, 200, path);
}
for (const path of ["/worker/index.js", "/.dev.vars", "/wrangler.jsonc", "/package.json", "/README.md"]) {
    assert.equal((await fetch(base + path)).status, 404, `Private asset ${path}`);
}
assert.equal((await fetch(`${base}/api/contact`)).status, 405);
const headers = { Origin: base, "Content-Type": "application/json" };
const post = (body, extra = {}) => fetch(`${base}/api/contact`, { method: "POST", headers: { ...headers, ...extra }, body });
assert.equal((await post("null")).status, 400);
assert.equal((await post("{}", { Origin: "https://evil.example" })).status, 403);
let limited = false;
for (let i = 0; i < 8; i++) if ((await post("{}")).status === 429) limited = true;
assert.ok(limited, "Native local rate limit");
console.log("Static assets, private-file exclusions, methods, validation, origin protection, and native rate limiter passed.");
