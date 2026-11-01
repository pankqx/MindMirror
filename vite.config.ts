import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" keeps every path relative, so the same build works on localhost and on GitHub Pages.
export default defineConfig({ base: "./", plugins: [react(), tailwindcss()] });
