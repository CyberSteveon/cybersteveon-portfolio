import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { basename } from "node:path";

// Publish an allowlist, never the repository root or local secrets.
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const entry of await readdir(".")) {
    if (entry.endsWith(".html")) await cp(entry, `dist/${entry}`);
}
for (const directory of ["css", "js", "images", "files"]) {
    await cp(directory, `dist/${directory}`, {
        recursive: true,
        filter: source => !basename(source).startsWith(".")
    });
}
