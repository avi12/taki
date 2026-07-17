import packageJson from "./package.json" with { type: "json" };
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import favicon from "vite-plugin-favicon2";

const { version } = packageJson;

export default defineConfig({
  plugins: [
    sveltekit(),
    favicon({
      logo: "static/TakiSquare.svg",
      favicons: {
        icons: {
          appleStartup: false,
          windows: false,
          yandex: false
        }
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version)
  }
});
