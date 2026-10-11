import test from "node:test";
import assert from "node:assert/strict";
import {
  assertTaskAlive,
  taskFromRequest,
  TaskError,
  participantIdentity,
  TASK_LIFETIME_MS,
} from "../lib/shared-task.ts";
test("task IDs validate strictly and expiry includes the exact deadline", () => {
  const id = crypto.randomUUID();
  assert.equal(
    taskFromRequest(new Request("https://demo/api/room?task=" + id)),
    id,
  );
  assert.throws(
    () => taskFromRequest(new Request("https://demo/api/room?task=demo-owner")),
    TaskError,
  );
  assert.doesNotThrow(() =>
    assertTaskAlive({ expiresAt: TASK_LIFETIME_MS }, TASK_LIFETIME_MS - 1),
  );
  assert.throws(
    () => assertTaskAlive({ expiresAt: TASK_LIFETIME_MS }, TASK_LIFETIME_MS),
    TaskError,
  );
  assert.throws(() => assertTaskAlive({}, 0), TaskError);
});
test("public supporter IDs cannot disclose the private organizer cookie", async () => {
  const viewer = "demo-" + crypto.randomUUID(),
    room = "task-" + crypto.randomUUID();
  const actor = await participantIdentity(viewer, room);
  assert.match(actor, /^[a-f0-9]{64}$/);
  assert.ok(!actor.includes(viewer.slice(5)));
  assert.equal(await participantIdentity(viewer, room), actor);
  assert.notEqual(await participantIdentity(viewer, room + "other"), actor);
  assert.notEqual(await participantIdentity("other", room), actor);
});
