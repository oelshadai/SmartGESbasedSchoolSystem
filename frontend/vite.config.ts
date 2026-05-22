import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    hmr: {
      overlay: false,
      clientPort: 8080,
      port: 8080,
    },
    watch: {
      usePolling: true,
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: [".railway.app"],
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: [".railway.app"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    // Use Vite/Rollup default chunking to avoid brittle inter-chunk dependency issues.
  },
}));
