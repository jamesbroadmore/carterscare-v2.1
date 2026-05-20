import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    hmr: {
      overlay: false,
    },
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (["react", "react-dom", "react-router-dom"].some((p) => id.includes(`/${p}/`))) return "vendor";
            if (id.includes("@radix-ui")) return "ui";
            if (id.includes("recharts")) return "charts";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("@tanstack")) return "query";
          }
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
