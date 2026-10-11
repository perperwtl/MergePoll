import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(async ({ command }) => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return {
    server: { host: "127.0.0.1", watch: { usePolling: true } },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        // Only the development server enables shared local organizer access.
        // A configured ORGANIZER_TOKEN always takes precedence over this flag.
        ...(command === "serve"
          ? { config: { vars: { LOCAL_DEMO: "true" } } }
          : {}),
      }),
    ],
  };
});
