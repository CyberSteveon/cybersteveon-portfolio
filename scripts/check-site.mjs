import { readdir, readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(path.join(dir, entry.name))
          : path.join(dir, entry.name),
      ),
    )
  ).flat();
}
const files = await walk("dist");
const pages = files.filter((file) => file.endsWith(".html"));
assert.equal(
  pages.length,
  13,
  "Five original pages, seven case studies, and 404",
);
for (const name of ["index", "about", "projects", "resume", "contact", "404"])
  assert.ok(files.includes(`dist/${name}.html`));
for (const file of files) {
  assert.ok(
    !/(?:^|\/)(?:\.[^/]+|worker|node_modules|src|tests)(?:\/|$)/.test(file),
    `Private path: ${file}`,
  );
  assert.ok(
    !/\.(?:jsonc?|md|map)$/.test(file),
    `Source/config in assets: ${file}`,
  );
}
for (const file of pages) {
  // Attribute wrapping in readable output must not change metadata checks.
  const html = (await readFile(file, "utf8")).replace(/\s+/g, " ");
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${file}: one h1`);
  for (const marker of [
    'name="description"',
    'property="og:image"',
    'lang="en"',
    'id="main"',
  ])
    assert.ok(html.includes(marker), `${file}: ${marker}`);
  if (file === 'dist/404.html') {
    assert.ok(html.includes('name="robots" content="noindex, follow"'), 'Error page must not be indexed');
    assert.ok(!html.includes('rel="canonical"'), 'Error page must not claim a canonical content URL');
  } else {
    const route = file === 'dist/index.html' ? '/' : '/' + file.slice(5, -5);
    const expected = `https://cybersteveon.dev${route}`;
    assert.ok(html.includes(`rel="canonical" href="${expected}"`), `${file}: canonical must match its clean route`);
    assert.ok(html.includes(`property="og:url" content="${expected}"`), `${file}: Open Graph URL`);
    assert.ok(!/noindex/i.test(html), `${file}: public content must be indexable`);
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = new URL(
      match[1].replaceAll("&amp;", "&"),
      `https://cybersteveon.dev/${file.slice(5)}`,
    );
    if (url.origin !== "https://cybersteveon.dev") continue;
    const pathname = decodeURIComponent(url.pathname);
    const candidates =
      pathname === "/"
        ? ["dist/index.html"]
        : [
            `dist${pathname}`,
            `dist${pathname}.html`,
            `dist${pathname}/index.html`,
          ];
    let target;
    for (const candidate of candidates)
      if (
        await stat(candidate)
          .then((s) => s.isFile())
          .catch(() => false)
      ) {
        target = candidate;
        break;
      }
    assert.ok(target, `${file}: broken reference ${match[1]}`);
    if (url.hash && target.endsWith(".html"))
      assert.ok(
        (await readFile(target, "utf8")).includes(`id="${url.hash.slice(1)}"`),
        `${file}: broken anchor ${match[1]}`,
      );
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g))
    assert.match(image[0], /\balt="[^"]*"/, `${file}: image alt`);
}
const js = files.filter((file) => file.endsWith(".js"));
const externalBytes = (await Promise.all(js.map((file) => stat(file)))).reduce(
  (sum, s) => sum + s.size,
  0,
);
const inlineScripts = new Set();
for (const file of pages)
  for (const match of (await readFile(file, "utf8")).matchAll(
    /<script[^>]*>([\s\S]*?)<\/script>/g,
  ))
    inlineScripts.add(match[1]);
const bytes =
  externalBytes +
  [...inlineScripts].reduce(
    (sum, script) => sum + Buffer.byteLength(script),
    0,
  );
assert.ok(bytes < 25_000, "Keep first-party client scripts lightweight");
console.log(
  `${pages.length} pages: routes, local links, anchors, metadata, image alt, asset exclusions passed. First-party JS: ${bytes} bytes.`,
);

const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const expectedLocations = pages.filter(file => file !== 'dist/404.html').map(file =>
    'https://cybersteveon.dev' + (file === 'dist/index.html' ? '/' : '/' + file.slice(5, -5)));
assert.deepEqual(locations.toSorted(), expectedLocations.toSorted(), 'Sitemap must cover every content page exactly once');
const robots = await readFile('dist/robots.txt', 'utf8');
assert.match(robots, /User-agent: \*\nAllow: \//);
assert.ok(robots.includes('Sitemap: https://cybersteveon.dev/sitemap.xml'));
console.log('Exact canonical URLs, sitemap coverage, robots.txt, and error-page noindex passed.');
