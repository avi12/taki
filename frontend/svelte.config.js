import packageJson from "./package.json" with { type: "json" };
import adapter from "@sveltejs/adapter-static";

const VERSION_POLL_INTERVAL_MS = 60_000;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter({
      fallback: "index.html",
      pages: "build",
      assets: "build",
      precompress: false,
      strict: true
    }),
    version: {
      name: packageJson.version,
      pollInterval: VERSION_POLL_INTERVAL_MS
    }
  },
  vitePlugin: {
    dynamicCompileOptions: ({ filename }) =>
      filename.includes("node_modules") ? undefined : { runes: true }
  }
};

export default config;
