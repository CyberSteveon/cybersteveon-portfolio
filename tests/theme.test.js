import test from "node:test";
import assert from "node:assert/strict";
import { initializeTheme } from "../src/scripts/theme.js";

for (const blocked of [false, true])
  test(`theme follows system until selected; storage blocked=${blocked}`, () => {
    const saved = Object.fromEntries(
      ["document", "window", "localStorage"].map((key) => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      ]),
    );
    const classes = new Set();
    const attributes = {};
    const label = {};
    let click, change, stored;
    const button = {
      setAttribute: (key, value) => (attributes[key] = value),
      addEventListener: (_, callback) => (click = callback),
    };
    const root = {
      style: {},
      classList: {
        contains: (key) => classes.has(key),
        toggle: (key, enabled) =>
          enabled ? classes.add(key) : classes.delete(key),
      },
    };
    try {
      globalThis.document = {
        documentElement: root,
        getElementById: (id) => (id === "theme-label" ? label : button),
      };
      globalThis.window = {
        matchMedia: () => ({
          matches: true,
          addEventListener: (_, callback) => (change = callback),
        }),
      };
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
          getItem() {
            if (blocked) throw Error("blocked");
            return null;
          },
          setItem(_, value) {
            if (blocked) throw Error("blocked");
            stored = value;
          },
        },
      });
      initializeTheme();
      assert.equal(root.style.colorScheme, "dark");
      change({ matches: false });
      assert.equal(label.textContent, "Dark mode");
      click();
      assert.equal(attributes["aria-pressed"], "true");
      assert.equal(label.textContent, "Light mode");
      change({ matches: false });
      assert.equal(
        root.style.colorScheme,
        "dark",
        "explicit choice wins over system",
      );
      if (!blocked) assert.equal(stored, "dark");
      click();
      assert.equal(root.style.colorScheme, "light");
    } finally {
      for (const [key, descriptor] of Object.entries(saved)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
