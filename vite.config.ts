import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  /** Set `VITE_BASE_PATH=/repo-name/` when hosting on GitHub Pages project sites (e.g. `/digitalhealthevvm-frontend/`). */
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    host: "::",
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
