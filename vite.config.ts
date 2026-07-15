import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Plain client-side SPA build — this is what gets wrapped by Capacitor.
// (The original project used TanStack Start/SSR + Nitro, which needs a Node
// server at runtime. Capacitor loads static files into a WebView, so this
// app is mounted as a normal client-rendered React app instead. Same
// components, same styles, same behavior — just no server round-trip.)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
