import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { format } from "prettier";

// Format generated pages on every build, including nested project routes.
// Keep whitespace-sensitive inline content intact and leave bundled assets alone.
async function formatPages(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await formatPages(filename);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const html = await readFile(filename, "utf8");
      const formatted = await format(html, {
        parser: "html",
        tabWidth: 2,
        printWidth: 100,
        htmlWhitespaceSensitivity: "css",
      });
      await writeFile(filename, formatted);
    }
  }
}

await formatPages("dist");
