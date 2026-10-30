import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies API calls to FastAPI, so the browser stays same-origin
// and the backend needs no CORS configuration.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const target = env.VITE_API_TARGET || "http://localhost:8005";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target, changeOrigin: true },
        "/health": { target, changeOrigin: true },
      },
    },
    preview: {
      proxy: {
        "/api": { target, changeOrigin: true },
        "/health": { target, changeOrigin: true },
      },
    },
  };
});
