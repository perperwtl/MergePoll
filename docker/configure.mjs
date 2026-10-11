import { readFileSync, writeFileSync } from "node:fs";
const configPath = "dist/server/wrangler.json";
const config = JSON.parse(readFileSync(configPath, "utf8"));
config.vars = { ...config.vars, LOCAL_DEMO: "true", PUBLIC_DEMO: "false" };
writeFileSync(configPath, JSON.stringify(config));
const secrets = ["TYPESAFE_API_KEY", "ORGANIZER_TOKEN"]
  .map((key) => `${key}=${JSON.stringify(process.env[key] || "")}`)
  .join("\n");
writeFileSync("dist/server/.dev.vars", secrets + "\n", { mode: 0o600 });
