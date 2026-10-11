// Public room IDs and private browser identities are deliberately independent.
export const TASK_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const TASK_ID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export class TaskError extends Error {
  status: number;
  constructor(message: string, status = 410) {
    super(message);
    this.status = status;
  }
}
export function taskFromRequest(req: Request) {
  const id = new URL(req.url).searchParams.get("task");
  if (id !== null && !TASK_ID_PATTERN.test(id))
    throw new TaskError("This task link is invalid.", 404);
  return id;
}
export function assertTaskAlive(
  room: { expiresAt?: number },
  now = Date.now(),
) {
  if (!room.expiresAt || room.expiresAt <= now)
    throw new TaskError(
      "This task has expired. Custom tasks are available for 24 hours.",
    );
}
export async function participantIdentity(viewer: string, roomKey: string) {
  // Never expose the organizer's bearer cookie through question supporters.
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode("participant:" + roomKey + ":" + viewer),
  );
  return Array.from(new Uint8Array(hash), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
export async function activeCustomTask(
  db: D1Database,
  viewer: string,
  now = Date.now(),
) {
  const slot = await db
    .prepare("SELECT data FROM rooms WHERE id=?")
    .bind("custom-slot-" + viewer)
    .first<{ data: string }>();
  if (!slot) return null;
  const data = JSON.parse(slot.data) as { taskId: string; expiresAt: number };
  if (data.expiresAt <= now) return null;
  return { path: "/room/" + data.taskId, expiresAt: data.expiresAt };
}
export async function createCustomTask(
  db: D1Database,
  viewer: string,
  room: object,
  now = Date.now(),
) {
  const id = crypto.randomUUID();
  const expiresAt = now + TASK_LIFETIME_MS;
  const slotKey = "custom-slot-" + viewer;
  const slot = JSON.stringify({ taskId: id, expiresAt });
  // Both statements commit together. A concurrent loser cannot create an orphan
  // task, replace the winning slot, or generate a second active event.
  const result = await db.batch([
    db
      .prepare(
        "INSERT INTO rooms (id,data,version) VALUES (?,?,0) ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=rooms.version+1 WHERE json_extract(rooms.data,'$.expiresAt')<=?",
      )
      .bind(slotKey, slot, now),
    db
      .prepare(
        "INSERT INTO rooms (id,data,version) SELECT ?,?,0 FROM rooms WHERE id=? AND json_extract(data,'$.taskId')=?",
      )
      .bind(
        "task-" + id,
        JSON.stringify({
          ...room,
          owner: viewer,
          taskId: id,
          createdAt: now,
          expiresAt,
        }),
        slotKey,
        id,
      ),
  ]);
  if (!result[0].meta.changes || !result[1].meta.changes)
    throw new TaskError(
      "This browser already has an active task. Open it again; you can create another after it expires.",
      409,
    );
  return { id, expiresAt };
}
export async function cleanupExpiredTasks(db: D1Database, now = Date.now()) {
  // No request input controls this cutoff or the selected namespaces. This can
  // safely be called by the Site's public scheduled HTTP updater.
  const result = await db
    .prepare(
      "DELETE FROM rooms WHERE (id LIKE 'task-%' OR id LIKE 'custom-slot-%') AND json_extract(data,'$.expiresAt')<=?",
    )
    .bind(now)
    .run();
  return result.meta.changes;
}
