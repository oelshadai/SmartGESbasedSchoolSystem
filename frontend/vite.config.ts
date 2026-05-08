import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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
    // Proxy API requests to the backend Django server during development
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      // Forward static files (Django static) to backend so templates load correctly
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/static/, '/static'),
      },
    },
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
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately, never changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Large UI library
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs',
                        '@radix-ui/react-switch', '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-popover', '@radix-ui/react-tooltip',
                        '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-checkbox', '@radix-ui/react-collapsible',
                        '@radix-ui/react-separator', '@radix-ui/react-slot',
                        '@radix-ui/react-label', '@radix-ui/react-progress',
                        '@radix-ui/react-scroll-area', '@radix-ui/react-avatar'],
          // Charts — only loaded on pages that use them
          'vendor-charts': ['recharts'],
          // Utility libs (no radix deps to avoid circular)
          'vendor-utils': ['axios', 'date-fns', 'zustand'],
          // Sonner uses its own portal — keep separate
          'vendor-sonner': ['sonner'],
        },
      },
    },
  },
}));
