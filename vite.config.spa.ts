import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Static SPA for GitHub Pages — no SSR / Nitro / auth API. */
export default defineConfig({
  base: "/Soccer-Activate/",
  define: {
    "import.meta.env.VITE_SPA": JSON.stringify("1"),
    "import.meta.env.VITE_AUTH_ENABLED": JSON.stringify("false"),
  },
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: [
      {
        find: "@/lib/server/training",
        replacement: path.resolve(rootDir, "src/lib/server/training.spa.ts"),
      },
      { find: "@", replacement: path.resolve(rootDir, "src") },
    ],
  },
  build: {
    outDir: "dist-spa",
    emptyOutDir: true,
  },
});
