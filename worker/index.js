const MAX_BODY_BYTES = 24 * 1024;
const LIMITS = { name: 100, email: 254, subject: 150, message: 5000 };
const SINGLE_LINE_CONTROLS = /[\u0000-\u001f\u007f]/;
const MESSAGE_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

function json(status, code, message, extra = {}, headers = {}) {
    return Response.json({ ok: status < 400, code, message, ...extra }, {
        status,
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers }
    });
}

function dryRun(request, env) {
    const url = new URL(request.url);
    return env.CONTACT_DRY_RUN === "true" && url.protocol === "http:"
        && ["localhost", "127.0.0.1"].includes(url.hostname);
}

async function readJson(request) {
    if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) throw new RangeError("Body limit");
    const reader = request.body?.getReader();
    if (!reader) throw new SyntaxError("Missing body");
    const chunks = [];
    let size = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY_BYTES) {
            await reader.cancel();
            throw new RangeError("Body limit");
        }
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function validate(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const fields = {};
    for (const [name, limit] of Object.entries(LIMITS)) {
        if (typeof data[name] !== "string") return null;
        const controls = name === "message" ? MESSAGE_CONTROLS : SINGLE_LINE_CONTROLS;
        if (controls.test(data[name])) return null;
        fields[name] = data[name].trim();
        if (!fields[name] || fields[name].length > limit) return null;
    }
    if (!EMAIL.test(fields.email) || fields.email.split("@")[0].length > 64) return null;
    if (data.website !== undefined && data.website !== "") return null;
    if (typeof data.token !== "string" || !data.token || data.token.length > 2048) return null;
    return fields;
}

// Inject HTTP in unit tests so automated tests cannot deliver real email.
export async function handleRequest(request, env, http = fetch) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const configPath = url.pathname === "/api/contact/config";
    if (!configPath && url.pathname !== "/api/contact") return json(404, "not_found", "Not found.");
    const method = configPath ? "GET" : "POST";
    if (request.method !== method) {
        return json(405, "method_not_allowed", "Method not allowed.", {}, { Allow: method });
    }
    const local = dryRun(request, env);
    if (configPath) {
        if (!env.TURNSTILE_SITE_KEY) return json(503, "unavailable", "The contact form is temporarily unavailable.");
        return json(200, "config", "", { siteKey: env.TURNSTILE_SITE_KEY, dryRun: local });
    }
    if (request.headers.get("Origin") !== env.ALLOWED_ORIGIN || url.origin !== env.ALLOWED_ORIGIN
        || request.headers.get("Sec-Fetch-Site") === "cross-site") {
        return json(403, "forbidden", "Please submit the form from this website.");
    }
    if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        return json(415, "unsupported_media_type", "Please submit JSON.");
    }
    try {
        if (!env.CONTACT_RATE_LIMITER || !env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY
            || (!local && (!env.RESEND_API_KEY || env.CONTACT_DRY_RUN === "true"
                || env.TURNSTILE_SITE_KEY === "1x00000000000000000000AA"
                || env.TURNSTILE_SECRET_KEY === "1x0000000000000000000000000000000AA"))) {
            return json(503, "unavailable", "The contact form is temporarily unavailable.");
        }
        const ip = request.headers.get("CF-Connecting-IP");
        if (!local && !ip) return json(403, "forbidden", "Unable to verify this request.");
        const { success } = await env.CONTACT_RATE_LIMITER.limit({ key: `contact:${ip || "local"}` });
        if (!success) return json(429, "rate_limited", "Too many attempts. Please wait a minute.", {}, { "Retry-After": "60" });
        let data;
        try { data = await readJson(request); }
        catch (error) {
            return error instanceof RangeError
                ? json(413, "too_large", "Your submission is too large.")
                : json(400, "invalid_json", "Invalid request.");
        }
        const fields = validate(data);
        if (!fields) return json(400, "invalid_fields", "Check all fields and complete the spam check.");
        const verification = await http("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: data.token, ...(ip ? { remoteip: ip } : {}) }),
            signal: AbortSignal.timeout(10000)
        });
        if (!verification.ok) return json(503, "unavailable", "Verification is unavailable. Please try again.");
        const verified = await verification.json();
        if (!verified.success || (!local && (verified.hostname !== url.hostname || verified.action !== "contact"))) {
            return json(400, "verification_failed", "Please complete the spam check again.");
        }
        if (local) return json(200, "dry_run", "Local test passed. No email was sent.");
        const email = {
            from: "Portfolio contact form <portfolio@notify.cybersteveon.dev>",
            to: ["contact@cybersteveon.dev"], reply_to: fields.email,
            subject: `Portfolio contact: ${fields.subject}`,
            text: `Name: ${fields.name}\nEmail: ${fields.email}\nSubject: ${fields.subject}\n\n${fields.message}`
        };
        // Resend deduplicates identical submissions for 24 hours, including timeout retries.
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(email)));
        const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
        const result = await http("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `portfolio/${key}` },
            body: JSON.stringify(email), signal: AbortSignal.timeout(10000)
        });
        if (!result.ok) return json(502, "delivery_unavailable", "Unable to submit your message. Please try again later.");
        const accepted = await result.json();
        if (typeof accepted.id !== "string" || !accepted.id) throw new Error("Invalid provider response");
        return json(200, "accepted", "Your message was accepted for delivery. Thank you!");
    } catch {
        // Never log credentials, submission contents, or provider error bodies.
        return json(503, "unavailable", "Unable to submit your message. Please try again later.");
    }
}

export default { fetch: (request, env) => handleRequest(request, env) };
