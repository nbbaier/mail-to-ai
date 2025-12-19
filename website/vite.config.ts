import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import alchemy from "alchemy/cloudflare/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), alchemy()],
});
