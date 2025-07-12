import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  define: {
    "process.env": {},
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 5174,
    allowedHosts: ["systemcargo.ru"],
  },
});