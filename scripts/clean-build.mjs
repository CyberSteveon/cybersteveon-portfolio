import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

// Finder can create these after public assets are added or replaced.
// Remove only known OS metadata from generated output, never source files.
async function clean(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) await clean(filename);
        else if (entry.isFile() && entry.name === '.DS_Store') await unlink(filename);
    }
}
await clean('dist');
