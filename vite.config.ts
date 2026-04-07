import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// HMR via wss:443 é para túnel Lovable; em localhost isso impede o hot reload e a UI fica “congelada” no bundle antigo.
const lovableTunnelHmr = process.env.LOVABLE_HMR === "1";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    ...(lovableTunnelHmr
      ? {
          hmr: {
            clientPort: 443,
            protocol: "wss",
          },
        }
      : {}),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
