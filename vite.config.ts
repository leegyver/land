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
        // 사용자가 VITE_KAKAO_MAP_KEY를 지우고 KAKAO_API_KEY를 같이 쓰기로 함
        // 둘 중 하나라도 있으면 사용
        const kakaoKey = process.env.VITE_KAKAO_MAP_KEY || process.env.KAKAO_API_KEY;

        if (!kakaoKey) {
          console.warn("⚠️ Kakao API Key is missing! Maps will not work.");
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
