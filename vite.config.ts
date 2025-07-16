
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Tauri expects a specific dist directory
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  // Clear any dev server proxy settings that might conflict with Tauri
  clearScreen: false,
  // Tauri uses a different server setup
  envPrefix: ["VITE_", "TAURI_"],
}));
