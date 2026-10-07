import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

/** Dev proksi manzili — `.env` dagi `VITE_API_PROXY_TARGET` bilan almashtiriladi. */
const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? "https://api.alishaxkids.uz";

export default defineConfig({
  plugins: [
    // Resolves the `@/*` -> `src/*` paths declared in tsconfig.json.
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Must come before viteReact() so Start can transform routes/server fns first.
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR
      // error wrapper). nitro builds the deployable output from this.
      server: { entry: "server" },
    }),
    // Dev'da API shu server orqali proksilanadi: backend `kg_refresh` cookie'ni
    // `SameSite=Lax` bilan beradi va uni brauzer boshqa saytga yubormaydi.
    // Proksi tufayli cookie bir xil manzilda qoladi va yangilash halqasi ishlaydi.
    nitro({
      routeRules: {
        "/api/**": {
          proxy: {
            to: `${API_TARGET}/api/**`,
            // Backend CORS ro'yxatida faqat prod manzillari bor va noma'lum
            // `Origin` kelsa u 500 `INTERNAL_ERROR` qaytaradi. Brauzer dev'da
            // `Origin: http://localhost:8080` yuboradi, proksi esa uni o'zgarishsiz
            // uzatadi — natijada kirish 500 bilan tugaydi. Bu so'rov server-server
            // bo'lgani uchun `Origin` umuman kerak emas, shuning uchun olib tashlanadi.
            filterHeaders: ["origin"],
          },
        },
      },
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "@": srcDir,
    },
    // A duplicate copy of React or the TanStack runtime breaks hooks and router
    // context at runtime, so pin every import to a single instance.
    dedupe: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "@tanstack/react-start",
    ],
  },
  server: {
    port: 8080,
    // Port band bo'lsa vite jimgina 8081, 8082 ga ko'chadi va brauzerda eski
    // jarayon ochilib qoladi. Ko'chish o'rniga xato berilsin.
    strictPort: true,
    host: true,
  },
  preview: {
    port: 8080,
    strictPort: true,
    host: true,
  },
});
