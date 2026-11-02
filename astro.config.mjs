import { defineConfig } from "astro/config";

// Astro builds the frontend only. The existing Worker remains the runtime entry.
export default defineConfig({
  site: "https://cybersteveon.dev",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
});
