import assert from "node:assert/strict";
const base = process.env.SMOKE_URL || "http://localhost:5173";
const phase = process.argv[2] || "seed";
const get = async () => {
  const r = await fetch(base + "/api/room");
  assert.equal(r.status, 200);
  return r.json();
};
const post = async (body, cookie) => {
  const r = await fetch(base + "/api/room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
};
const room = await get();
if (phase === "seed") {
  assert.equal(room.questions.length, 10);
  assert.equal(room.canTeach, true);
  assert.equal(room.connected, false);
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base + "/room")).status, 200);
  assert.equal(
    (
      await post({
        action: "settings",
        title: "Docker persistence check",
        description: room.description,
        threshold: 0.7,
        interval: 0,
        published: true,
      })
    ).status,
    200,
  );
} else if (phase === "persist") {
  assert.equal(room.title, "Docker persistence check");
} else if (phase === "auth") {
  assert.equal(room.canTeach, false);
  assert.equal(room.connected, true);
  assert.equal((await post({ action: "reset" })).status, 403);
  const login = await fetch(base + "/api/organizer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(base).origin,
    },
    body: JSON.stringify({ token: "synthetic-docker-test-token" }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  assert.equal((await post({ action: "reset" }, cookie)).status, 200);
  assert.ok(!JSON.stringify(room).includes("synthetic-docker-test-key"));
} else throw new Error("Unknown smoke phase");
console.log(`PASS: Docker ${phase}`);
