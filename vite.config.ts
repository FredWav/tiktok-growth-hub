import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Le vrai pré-rendu est exécuté après les builds client et SSR par
// `scripts/prerender.mjs`. La configuration Vite reste volontairement neutre :
// elle sert le BrowserRouter en développement et compile `entry-server.tsx`
// lorsque le script `build:ssr` fournit cette entrée.
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/__wavstats-image": {
        target: "https://wavstats.com",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/__wavstats-image/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["@react-pdf/renderer"],
  },
  build: {
    rollupOptions: isSsrBuild
      ? undefined
      : {
          output: {
            manualChunks: {
              vendor: ["react", "react-dom", "react-router-dom"],
              ui: ["@radix-ui/react-dialog", "@radix-ui/react-slot", "@radix-ui/react-toast"],
              supabase: ["@supabase/supabase-js"],
            },
          },
        },
  },
}));
