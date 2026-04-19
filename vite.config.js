import { defineConfig } from "vite";
import uniPlugin from "@dcloudio/vite-plugin-uni";

const uni = uniPlugin.default || uniPlugin.uni || uniPlugin;

export default defineConfig({
  plugins: [uni()],
  server: {
    proxy: {
      "/api/v1": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true
      }
    }
  }
});
