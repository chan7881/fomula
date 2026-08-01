import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/formula/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    // Fail loudly if 5173 is already taken instead of silently moving to
    // 5174+ — a silent port switch breaks the backend's CORS allowlist
    // and shows up as a confusing "Network Error" on generate.
    strictPort: true,
    open: true,
  },
});
