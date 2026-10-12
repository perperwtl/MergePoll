import { env } from "cloudflare:workers";
import { cleanupMcp } from "../../lib/cleanup-mcp";
import { cleanupExpiredTasks } from "../../lib/shared-task";
export async function POST(req: Request) {
  const bindings = env as unknown as { PUBLIC_DEMO?: string; DB: D1Database };
  return cleanupMcp(req, bindings.PUBLIC_DEMO === "true", () =>
    cleanupExpiredTasks(bindings.DB),
  );
}
