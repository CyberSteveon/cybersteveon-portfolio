import test from "node:test";
import assert from "node:assert/strict";
import { initializeTheme } from "../js/theme.js";

test("theme toggles and updates accessibility state when storage is blocked", () => {
    const classes = new Set();
    let click;
    const attributes = {};
    const button = { textContent: "", setAttribute: (key, value) => { attributes[key] = value; }, addEventListener: (_, listener) => { click = listener; } };
    const previous = { document: globalThis.document, localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage") };
    try {
        globalThis.document = { getElementById: () => button, body: { classList: { add: (name) => classes.add(name), contains: (name) => classes.has(name), toggle: (name) => { if (classes.has(name)) { classes.delete(name); return false; } classes.add(name); return true; } } } };
        Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } });
        initializeTheme();
        click();
        assert.equal(button.textContent, "Light Mode");
        assert.equal(attributes["aria-pressed"], "true");
        click();
        assert.equal(button.textContent, "Dark Mode");
    } finally {
        globalThis.document = previous.document;
        if (previous.localStorage) Object.defineProperty(globalThis, "localStorage", previous.localStorage);
        else delete globalThis.localStorage;
    }
});
