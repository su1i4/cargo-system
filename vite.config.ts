import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  define: {
    "process.env": {},
  },
  server: {
    host: true, // позволяет доступ извне, включая через домен
    port: 5173, // (если нужно явно указать порт)
    allowedHosts: ['systemcargo.ru'], // ✅ разрешён ваш домен
  },
});