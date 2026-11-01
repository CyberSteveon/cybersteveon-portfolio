import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../worker/index.js";

const origin = "https://cybersteveon.dev";
const valid = { name: "Visitor", email: "visitor@example.com", subject: "Project", message: "Hello there", website: "", token: "test-token" };
function env(overrides = {}) {
    return { ALLOWED_ORIGIN: origin, TURNSTILE_SITE_KEY: "public-test-fixture", TURNSTILE_SECRET_KEY: "secret-test-fixture", RESEND_API_KEY: "fake-not-a-real-key", CONTACT_RATE_LIMITER: { limit: async () => ({ success: true }) }, ...overrides };
}
function request(data = valid, options = {}) {
    return new Request(`${origin}/api/contact`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1", ...options.headers }, body: options.raw ?? JSON.stringify(data) });
}
function mockHTTP({ verification = { success: true, hostname: "cybersteveon.dev", action: "contact" }, providerStatus = 200 } = {}) {
    const calls = [];
    const http = async (url, options) => {
        calls.push({ url, options });
        if (url.includes("siteverify")) return Response.json(verification);
        assert.equal(url, "https://api.resend.com/emails");
        return Response.json(providerStatus === 200 ? { id: "mock-email-id" } : { message: "PRIVATE PROVIDER ERROR" }, { status: providerStatus });
    };
    return { calls, http };
}
const noNetwork = async () => { assert.fail("Unexpected external request"); };

test("valid submission sends plain text with fixed recipient and visitor Reply-To", async () => {
    const mock = mockHTTP();
    const response = await handleRequest(request({ ...valid, message: "<script>alert(1)</script>\nHello" }), env(), mock.http);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).code, "accepted");
    const mail = JSON.parse(mock.calls[1].options.body);
    assert.deepEqual(mail.to, ["contact@cybersteveon.dev"]);
    assert.equal(mail.reply_to, valid.email);
    assert.equal(mail.html, undefined);
    assert.ok(mail.text.includes("<script>"));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("identical requests use the same idempotency key despite different Turnstile tokens", async () => {
    const mock = mockHTTP();
    await handleRequest(request(), env(), mock.http);
    await handleRequest(request({ ...valid, token: "new-token" }), env(), mock.http);
    assert.equal(mock.calls[1].options.headers["Idempotency-Key"], mock.calls[3].options.headers["Idempotency-Key"]);
});

for (const [name, data] of Object.entries({ null: null, array: [], missing: {}, type: { ...valid, message: 123 }, long: { ...valid, message: "x".repeat(5001) }, email: { ...valid, email: "bad@" }, injection: { ...valid, subject: "Hello\r\nBcc: other@example.com" }, nameInjection: { ...valid, name: "Name\n" }, honeypot: { ...valid, website: "https://spam.example" }, token: { ...valid, token: "" } })) {
    test(`rejects ${name} before external calls`, async () => {
        assert.equal((await handleRequest(request(data), env(), noNetwork)).status, 400);
    });
}

test("rejects malformed JSON and oversized streamed bodies", async () => {
    assert.equal((await handleRequest(request(valid, { raw: "{" }), env(), noNetwork)).status, 400);
    assert.equal((await handleRequest(request(valid, { raw: " ".repeat(25000) }), env(), noNetwork)).status, 413);
    assert.equal((await handleRequest(request(valid, { headers: { "Content-Length": "25000" } }), env(), noNetwork)).status, 413);
});

test("enforces method, media type, origin and fetch metadata", async () => {
    for (const method of ["GET", "PUT", "DELETE", "OPTIONS", "HEAD"]) {
        const response = await handleRequest(new Request(`${origin}/api/contact`, { method }), env(), noNetwork);
        assert.equal(response.status, 405);
        assert.equal(response.headers.get("Allow"), "POST");
    }
    assert.equal((await handleRequest(request(valid, { headers: { "Content-Type": "text/plain" } }), env(), noNetwork)).status, 415);
    for (const headers of [{ Origin: "https://evil.example" }, { Origin: "null" }, { "Sec-Fetch-Site": "cross-site" }]) {
        assert.equal((await handleRequest(request(valid, { headers }), env(), noNetwork)).status, 403);
    }
});

test("rate limit returns retry guidance without sending", async () => {
    const response = await handleRequest(request(), env({ CONTACT_RATE_LIMITER: { limit: async () => ({ success: false }) } }), noNetwork);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "60");
});

for (const verification of [{ success: false }, { success: true, hostname: "evil.example", action: "contact" }, { success: true, hostname: "cybersteveon.dev", action: "login" }]) {
    test(`rejects Turnstile mismatch ${JSON.stringify(verification)}`, async () => {
        const mock = mockHTTP({ verification });
        assert.equal((await handleRequest(request(), env(), mock.http)).status, 400);
        assert.equal(mock.calls.length, 1);
    });
}

test("provider errors and thrown exceptions do not leak details", async () => {
    const mock = mockHTTP({ providerStatus: 429 });
    const response = await handleRequest(request(), env(), mock.http);
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes("PRIVATE"));
    const unavailable = await handleRequest(request(), env(), async () => { throw new Error("PRIVATE secret"); });
    assert.equal(unavailable.status, 503);
    assert.ok(!(await unavailable.text()).includes("PRIVATE"));
});

test("missing secrets and accidental production dry-run fail closed", async () => {
    for (const overrides of [{ RESEND_API_KEY: "" }, { TURNSTILE_SECRET_KEY: "" }, { CONTACT_RATE_LIMITER: null }, { CONTACT_DRY_RUN: "true" }, { TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }]) {
        assert.equal((await handleRequest(request(), env(overrides), noNetwork)).status, 503);
    }
});

test("local dry-run verifies challenge but never calls Resend", async () => {
    const mock = mockHTTP();
    const req = new Request("http://localhost:8787/api/contact", { method: "POST", headers: { Origin: "http://localhost:8787", "Content-Type": "application/json" }, body: JSON.stringify(valid) });
    const response = await handleRequest(req, env({ ALLOWED_ORIGIN: "http://localhost:8787", CONTACT_DRY_RUN: "true", RESEND_API_KEY: "" }), mock.http);
    assert.equal((await response.json()).code, "dry_run");
    assert.equal(mock.calls.length, 1);
});

test("public config never exposes secrets; unknown API paths return JSON 404", async () => {
    const response = await handleRequest(new Request(`${origin}/api/contact/config`), env(), noNetwork);
    const text = await response.text();
    assert.ok(!text.includes("secret-test-fixture"));
    assert.ok(!text.includes("fake-not-a-real-key"));
    assert.equal((await handleRequest(new Request(`${origin}/api/missing`), env(), noNetwork)).status, 404);
});

test("static requests delegate to the assets binding", async () => {
    const response = await handleRequest(new Request(`${origin}/contact`), env({ ASSETS: { fetch: async () => new Response("asset") } }), noNetwork);
    assert.equal(await response.text(), "asset");
});
