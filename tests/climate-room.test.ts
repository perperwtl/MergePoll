import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import ts from "typescript";

// Exercise the real route against SQLite, replacing only the Worker binding.
const db = new DatabaseSync(":memory:");
db.exec(
  "CREATE TABLE rooms (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0)",
);
const bindings = {
  PUBLIC_DEMO: "true",
  DB: {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          const statement = db.prepare(sql);
          return {
            async first() {
              return statement.get(...args) ?? null;
            },
            async run() {
              return { meta: { changes: statement.run(...args).changes } };
            },
          };
        },
      };
    },
  },
};
(globalThis as any).__climateTestBindings = bindings;
const source = readFileSync(
  new URL("../app/api/room/route.ts", import.meta.url),
  "utf8",
)
  .replace(
    'import { env } from "cloudflare:workers";',
    "const env = globalThis.__climateTestBindings;",
  )
  .replaceAll(
    /from "(\.\.\/\.\.\/\.\.\/lib\/[^\"]+)"/g,
    (_, path) =>
      `from "${new URL(path + ".ts", new URL("../app/api/room/route.ts", import.meta.url)).href}"`,
  );
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { GET, POST } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
const browser = crypto.randomUUID();
const viewer = "demo-" + browser;
const cookie = "mergepoll-demo=" + browser;
const request = (body?: object) =>
  new Request("https://demo.example/api/room", {
    headers: { cookie, "Content-Type": "application/json" },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });

test("climate entry restores a legacy blank test scene, preserving its data and allowance", async () => {
  const legacy = {
    title: "Test scene",
    description: "My custom test",
    published: false,
    interval: 0,
    threshold: 0.95,
    questions: [],
    scores: {},
    blocked: [],
    owner: viewer,
    revision: 0,
    lastRun: 0,
    lock: 0,
    metrics: null,
    demoRuns: 7,
    demoLastAttempt: Date.now(),
    mergePolicy: "shared-response-v5",
  };
  const original = JSON.stringify(legacy);
  db.prepare("INSERT INTO rooms (id,data) VALUES (?,?)").run(viewer, original);
  const response = await GET(request());
  assert.equal(response.status, 200);
  const climate = await response.json();
  assert.equal(climate.title, "Climate Change 101");
  assert.equal(climate.questions.length, 10);
  assert.equal(climate.canTeach, true);
  assert.equal(climate.published, true);
  assert.equal(climate.threshold, 0.7);
  assert.equal(climate.interval, 0);
  assert.equal(climate.demoRunsRemaining, 33);
  assert.equal(climate.demoLastAttempt, legacy.demoLastAttempt);
  assert.equal(
    db.prepare("SELECT data FROM rooms WHERE id=?").get(viewer)!.data,
    original,
  );
  const repeat = await (await GET(request())).json();
  assert.deepEqual(repeat.questions, climate.questions);
  // Settings remain usable by the browser organizer after restoration.
  assert.equal(
    (
      await POST(
        request({
          action: "settings",
          title: climate.title,
          description: climate.description,
          published: true,
          interval: 0,
          threshold: 0.8,
        }),
      )
    ).status,
    200,
  );
  assert.equal((await (await GET(request())).json()).threshold, 0.8);
});

test("existing climate progress migrates once and shared custom tasks stay separate", async () => {
  const id = crypto.randomUUID();
  const owner = "demo-" + id;
  const headers = { cookie: "mergepoll-demo=" + id };
  const climate = {
    title: "Climate Change 101",
    description: "Existing climate session",
    published: true,
    interval: 0,
    threshold: 0.8,
    questions: [
      {
        id: "mine",
        text: "My climate question",
        supporters: ["student"],
        group: "mine",
        saved: true,
        created: 1,
      },
    ],
    scores: {},
    blocked: [],
    owner,
    revision: 4,
    lastRun: 0,
    lock: 0,
    metrics: null,
    demoRuns: 9,
    mergePolicy: "shared-response-v5",
  };
  db.prepare("INSERT INTO rooms (id,data,version) VALUES (?,?,4)").run(
    owner,
    JSON.stringify(climate),
  );
  const migrated = await (
    await GET(new Request("https://demo.example/api/room", { headers }))
  ).json();
  assert.deepEqual(migrated.questions, climate.questions);
  assert.equal(migrated.threshold, 0.8);
  assert.equal(migrated.demoRunsRemaining, 31);
  const taskId = crypto.randomUUID();
  const task = {
    ...climate,
    title: "Shared test",
    questions: [],
    taskId,
    expiresAt: Date.now() + 60_000,
  };
  db.prepare("INSERT INTO rooms (id,data) VALUES (?,?)").run(
    "task-" + taskId,
    JSON.stringify(task),
  );
  const custom = await (
    await GET(
      new Request("https://demo.example/api/room?task=" + taskId, { headers }),
    )
  ).json();
  assert.equal(custom.title, "Shared test");
  assert.equal(custom.questions.length, 0);
  assert.equal(custom.canTeach, true);
  assert.equal(custom.roomPath, "/room/" + taskId);
  const participant = await (
    await GET(new Request("https://demo.example/api/room?task=" + taskId))
  ).json();
  assert.equal(participant.canTeach, false);
  assert.equal(participant.title, "Shared test");
});

test("a new visitor gets the seeded climate demo with organizer settings", async () => {
  const response = await GET(new Request("https://demo.example/api/room"));
  const room = await response.json();
  assert.equal(room.title, "Climate Change 101");
  assert.equal(room.questions.length, 10);
  assert.equal(room.canTeach, true);
  assert.equal(room.demoRunsRemaining, 40);
  assert.match(response.headers.get("Set-Cookie"), /mergepoll-demo=/);
});
