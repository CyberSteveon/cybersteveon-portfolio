import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
function luminance(hex) {
    let value = hex.slice(1);
    if (value.length === 3) value = [...value].map(char => char + char).join('');
    const rgb = value.match(/../g).map(channel => parseInt(channel, 16) / 255)
        .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}
for (const mode of [':root', ':root.dark-mode']) test(`${mode} text and button tokens meet 4.5:1 contrast`, () => {
    const block = css.slice(css.indexOf(`${mode} {`)).split('}')[0];
    const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+): (#[\da-f]+);/g)].map(match => [match[1], match[2]]));
    for (const foreground of ['text', 'muted', 'orange', 'sage', 'gold']) {
        for (const background of ['bg', 'surface', 'subtle']) {
            assert.ok(contrast(tokens[foreground], tokens[background]) >= 4.5, `${foreground} on ${background}`);
        }
    }
    assert.ok(contrast(tokens['button-text'], tokens.button) >= 4.5, 'button text');
});
