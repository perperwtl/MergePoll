import { env } from "cloudflare:workers";
import { cleanupExpiredTasks } from "../../../../lib/shared-task";
export async function POST() {
  const bindings = env as unknown as { PUBLIC_DEMO?: string; DB: D1Database };
  if (bindings.PUBLIC_DEMO !== "true")
    return Response.json({ error: "Not available." }, { status: 404 });
  const deleted = await cleanupExpiredTasks(bindings.DB);
  return Response.json(
    { deleted, checkedAt: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
