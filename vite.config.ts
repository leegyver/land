import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // Custom plugin to inject Kakao Map script
    {
      name: "html-transform",
      transformIndexHtml(html) {
        const kakaoKey = process.env.VITE_KAKAO_MAP_KEY;
        if (!kakaoKey) {
          console.warn("⚠️ VITE_KAKAO_MAP_KEY environment variable is missing during build!");
          return html;
        }
        return html.replace(
          "<!-- %KAKAO_MAP_SCRIPT% -->",
          `<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services"></script>`
        );
      },
    },
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
