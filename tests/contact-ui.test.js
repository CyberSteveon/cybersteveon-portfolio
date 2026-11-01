import test from "node:test";
import assert from "node:assert/strict";
import { initializeContact } from "../js/contact.js";

test("form blocks duplicate submits, retains fields on errors, and resets on acceptance", async () => {
    const saved = Object.fromEntries(["document", "window", "fetch", "FormData"].map(key => [key, globalThis[key]]));
    let submit, widgetOptions, finish;
    let requests = 0;
    let resets = 0;
    let mode = "pending";
    const status = { textContent: "" };
    const button = {};
    const attributes = {};
    const form = {
        querySelector: () => button, reportValidity: () => true,
        addEventListener: (_, listener) => { submit = listener; },
        setAttribute: (key, value) => { attributes[key] = value; },
        reset: () => { resets++; }
    };
    try {
        globalThis.document = {
            getElementById: id => id === "contact-form" ? form : status,
            createElement: () => ({}), head: { append: script => script.onload() }
        };
        globalThis.window = { turnstile: {
            render: (_, options) => { widgetOptions = options; options.callback("token"); return "widget"; },
            reset: () => widgetOptions.callback("fresh-token")
        } };
        globalThis.FormData = class { *[Symbol.iterator]() { yield ["name", "Visitor"]; } };
        globalThis.fetch = async (url) => {
            if (url.endsWith("/config")) return Response.json({ siteKey: "test" });
            requests++;
            if (mode === "pending") return new Promise(resolve => { finish = resolve; });
            if (mode === "network") throw new Error("offline");
            return Response.json({ ok: true, code: "accepted", message: "Accepted" });
        };
        await initializeContact();
        const event = { preventDefault() {} };
        const pending = submit(event);
        assert.equal(button.disabled, true);
        assert.equal(attributes["aria-busy"], "true");
        await submit(event);
        assert.equal(requests, 1);
        finish(Response.json({ ok: false, message: "Please wait" }, { status: 429 }));
        await pending;
        assert.equal(status.textContent, "Please wait");
        assert.equal(resets, 0);
        assert.equal(attributes["aria-busy"], "false");
        mode = "network";
        await submit(event);
        assert.ok(status.textContent.includes("Check your connection"));
        assert.equal(resets, 0);
        mode = "success";
        await submit(event);
        assert.equal(status.textContent, "Accepted");
        assert.equal(resets, 1);
    } finally {
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
