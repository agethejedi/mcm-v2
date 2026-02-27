import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        live: resolve(__dirname, "live.html"),
        events: resolve(__dirname, "events.html"),
        performance: resolve(__dirname, "performance.html"),
        faq: resolve(__dirname, "faq.html")
      }
    }
  }
});
