import { env } from "cloudflare:workers";
import {
  seed,
  cluster,
  evaluate,
  pairKey,
  type Question,
} from "../../../lib/grouping";
import { MERGE_POLICY, upgradeMergePolicy } from "../../../lib/merge-policy";
import { organizerIdentity, isLocalDemo } from "../../../lib/organizer-auth";
import {
  demoSession,
  demoGroupingError,
  DEMO_DAILY_RUNS,
  DEMO_DAILY_PAIRS,
  DEMO_MAX_RUNS,
  questionLimitError,
} from "../../../lib/demo-session";
import {
  TaskError,
  taskFromRequest,
  assertTaskAlive,
  participantIdentity,
  activeCustomTask,
  createCustomTask,
} from "../../../lib/shared-task";
export const dynamic = "force-dynamic";
type Room = {
  title: string;
  description: string;
  published: boolean;
  interval: number;
  threshold: number;
  questions: Question[];
  scores: Record<string, number>;
  blocked: string[];
  lastRun: number;
  lock: number;
  metrics: any;
  owner: string;
  revision: number;
  lastGroupedIds?: string[];
  mergePolicy?: string;
  demoRuns?: number;
  demoLastAttempt?: number;
  taskId?: string;
  createdAt?: number;
  expiresAt?: number;
  questionCount?: number;
};
const bindings = () =>
  env as unknown as {
    DB: D1Database;
    TYPESAFE_API_KEY?: string;
    ORGANIZER_TOKEN?: string;
    LOCAL_DEMO?: string;
    PUBLIC_DEMO?: string;
  };
const reply = (data: any, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
function initial(owner: string): Room {
  return {
    title: "Climate Change 101",
    description:
      "An introduction to the climate system, greenhouse gases, evidence of human-caused warming, sea-level rise, and practical climate action.",
    published: true,
    interval: bindings().PUBLIC_DEMO === "true" ? 0 : 120,
    threshold: 0.7,
    questions: seed(),
    scores: {},
    blocked: [],
    lastRun: Date.now(),
    lock: 0,
    metrics: null,
    owner,
    revision: 0,
    mergePolicy: MERGE_POLICY,
  };
}
type Target = { key: string; viewer: string; task: string | null };
function targetFor(viewer: string, task: string | null): Target {
  if (task && bindings().PUBLIC_DEMO !== "true")
    throw new TaskError("This task link is invalid.", 404);
  return {
    viewer,
    task,
    key: task
      ? "task-" + task
      : bindings().PUBLIC_DEMO === "true"
        ? viewer
        : "demo",
  };
}
async function read(target: Target) {
  const db = bindings().DB;
  if (!target.task)
    await db
      .prepare("INSERT OR IGNORE INTO rooms (id,data,version) VALUES (?,?,0)")
      .bind(
        target.key,
        JSON.stringify(
          initial(
            bindings().PUBLIC_DEMO === "true" ? target.viewer : "organizer",
          ),
        ),
      )
      .run();
  for (let i = 0; i < 8; i++) {
    const row = await db
      .prepare("SELECT data,version FROM rooms WHERE id=?")
      .bind(target.key)
      .first<{ data: string; version: number }>();
    if (!row) throw new TaskError("This task has expired or does not exist.");
    const room = JSON.parse(row.data) as Room;
    if (target.task) {
      try {
        assertTaskAlive(room);
      } catch (e) {
        await db
          .prepare(
            "DELETE FROM rooms WHERE id=? AND json_extract(data,'$.expiresAt')<=?",
          )
          .bind(target.key, Date.now())
          .run();
        throw e;
      }
    }
    if (!upgradeMergePolicy(room)) return { room, version: row.version };
    room.revision = row.version + 1;
    const result = await db
      .prepare(
        "UPDATE rooms SET data=?,version=version+1 WHERE id=? AND version=?",
      )
      .bind(JSON.stringify(room), target.key, row.version)
      .run();
    if (result.meta.changes) return { room, version: row.version + 1 };
  }
  throw new Error("The room is busy. Please try again.");
}
async function change(target: Target, mutate: (r: Room) => void) {
  for (let i = 0; i < 8; i++) {
    const { room, version } = await read(target);
    mutate(room);
    room.revision = version + 1;
    const result = await bindings()
      .DB.prepare(
        "UPDATE rooms SET data=?,version=version+1 WHERE id=? AND version=? AND (json_extract(data,'$.expiresAt') IS NULL OR json_extract(data,'$.expiresAt')>?)",
      )
      .bind(JSON.stringify(room), target.key, version, Date.now())
      .run();
    if (result.meta.changes) return room;
  }
  throw new Error("The room is busy. Please try again.");
}
function publicRoom(r: Room, viewer: string, actor: string | null) {
  const { owner, ...data } = r;
  return {
    ...data,
    canTeach: owner === viewer,
    connected: !!bindings().TYPESAFE_API_KEY,
    publicDemo: bindings().PUBLIC_DEMO === "true",
    interval: bindings().PUBLIC_DEMO === "true" && !r.taskId ? 0 : r.interval,
    demoRunsRemaining: Math.max(0, DEMO_MAX_RUNS - (r.demoRuns || 0)),
    serverTime: Date.now(),
    participantActor: actor,
    roomPath: r.taskId ? "/room/" + r.taskId : "/room",
    participantPath: r.taskId
      ? "/room/" + r.taskId + "?view=participant"
      : "/room?view=participant",
    localDemo: isLocalDemo(new Request("http://localhost"), bindings()),
  };
}
export async function GET(req: Request) {
  try {
    const demo = bindings().PUBLIC_DEMO === "true";
    const session = demoSession(req, demo, true);
    const who = session?.id ?? (await organizerIdentity(req, bindings()));
    const target = targetFor(who, taskFromRequest(req));
    const { room } = await read(target);
    const actor = demo ? await participantIdentity(who, target.key) : null;
    const response = reply({
      ...publicRoom(room, who, actor),
      ...(!target.task && demo
        ? { activeCustomTask: await activeCustomTask(bindings().DB, who) }
        : {}),
    });
    if (session?.cookie) response.headers.set("Set-Cookie", session.cookie);
    return response;
  } catch (e) {
    return reply(
      {
        error:
          e instanceof TaskError
            ? e.message
            : "The event database is not ready. Please refresh shortly.",
      },
      e instanceof TaskError ? e.status : 503,
    );
  }
}
export async function POST(req: Request) {
  let ownsLock = false;
  const demo = bindings().PUBLIC_DEMO === "true";
  const session = demoSession(req, demo);
  if (demo && !session)
    return reply(
      { error: "Open the demo room first to start your sandbox." },
      401,
    );
  const who = session?.id ?? (await organizerIdentity(req, bindings()));
  let target: Target | undefined;
  try {
    target = targetFor(who, taskFromRequest(req));
    if (
      req.headers.get("origin") &&
      req.headers.get("origin") !== new URL(req.url).origin
    )
      return reply({ error: "Invalid request origin" }, 403);
    const b = (await req.json()) as any;
    const { room: snapshot } = await read(target);
    const teacher = [
      "group",
      "settings",
      "start",
      "answer",
      "save",
      "restore",
      "split",
      "reset",
    ];
    if (teacher.includes(b.action) && snapshot.owner !== who)
      return reply({ error: "Only the room organizer can do this." }, 403);
    const actor = demo
      ? await participantIdentity(who, target.key)
      : typeof b.actor === "string" && /^[a-zA-Z0-9-]{8,80}$/.test(b.actor)
        ? b.actor
        : null;
    if (b.action === "group") {
      if (snapshot.lock && Date.now() - snapshot.lock < 300000)
        return reply({ error: "A grouping pass is already running." }, 409);
      const active = snapshot.questions.filter((q) => !q.saved);
      const processed = new Set(
        snapshot.lastGroupedIds ??
          Object.keys(snapshot.scores).flatMap((k) => k.split("|")),
      );
      if (!active.some((q) => !processed.has(q.id))) {
        const room = await change(target!, (r) => {
          r.lastRun = Date.now();
        });
        return reply({ ...publicRoom(room, who, actor), noNewQuestions: true });
      }
      let pendingPairs = 0;
      for (let i = 0; i < active.length; i++)
        for (let j = i + 1; j < active.length; j++)
          if (!(pairKey(active[i].id, active[j].id) in snapshot.scores))
            pendingPairs++;
      if (!pendingPairs) {
        const room = await change(target!, (r) => {
          r.lastGroupedIds = active.map((q) => q.id);
          r.lastRun = Date.now();
          r.metrics = {
            pairs: 0,
            model: "cache",
            ms: 0,
            usage: { input_tokens: 0, output_tokens: 0 },
            at: Date.now(),
          };
        });
        return reply(publicRoom(room, who, actor));
      }
      if (!bindings().TYPESAFE_API_KEY)
        return reply(
          {
            error: demo
              ? "The demo's TypeSafe key is not configured."
              : "AI grouping needs your own TypeSafe key. Set TYPESAFE_API_KEY in the Docker .env file, then run docker compose up -d.",
          },
          503,
        );
      if (!snapshot.published)
        return reply({ error: "Publish the room before grouping." }, 409);
      await change(target!, (r) => {
        if (r.revision !== snapshot.revision)
          throw new Error("The room changed. Please group again.");
        if (r.lock && Date.now() - r.lock < 300000)
          throw new Error("A grouping pass is already running.");
        if (demo) {
          const error = demoGroupingError(r);
          if (error) throw new Error(error);
          r.demoRuns = (r.demoRuns || 0) + 1;
          r.demoLastAttempt = Date.now();
        }
        r.lock = Date.now();
      });
      ownsLock = true;
      if (demo) {
        // Use a separate counter row in the existing schema. Atomic increment
        // caps total upstream requests even when visitors clear their cookies.
        const day = "demo-budget-" + new Date().toISOString().slice(0, 10);
        const db = bindings().DB;
        await db
          .prepare(
            "INSERT OR IGNORE INTO rooms (id,data,version) VALUES (?, '{}', 0)",
          )
          .bind(day)
          .run();
        const budget = await db
          .prepare(
            "UPDATE rooms SET version=version+1 WHERE id=? AND version<?",
          )
          .bind(day, DEMO_DAILY_RUNS)
          .run();
        if (!budget.meta.changes)
          throw new Error(
            "The demo's daily model budget is used up. Try tomorrow or run Docker with your own key.",
          );
      }
      if (demo) {
        const pairs = pendingPairs;
        const db = bindings().DB;
        const day =
          "demo-pairs-budget-" + new Date().toISOString().slice(0, 10);
        await db
          .prepare(
            "INSERT OR IGNORE INTO rooms (id,data,version) VALUES (?, '{}', 0)",
          )
          .bind(day)
          .run();
        const budget = await db
          .prepare(
            "UPDATE rooms SET version=version+? WHERE id=? AND version+?<=?",
          )
          .bind(pairs, day, pairs, DEMO_DAILY_PAIRS)
          .run();
        if (!budget.meta.changes)
          throw new Error(
            "The demo's daily comparison budget is used up. Try tomorrow or use Docker.",
          );
      }
      const result = await evaluate(
        bindings().TYPESAFE_API_KEY!,
        snapshot.title,
        snapshot.description,
        active,
        snapshot.scores,
      );
      const room = await change(target!, (r) => {
        if (
          r.title !== snapshot.title ||
          r.description !== snapshot.description
        )
          throw new Error("Event context changed. Please group again.");
        r.scores = { ...r.scores, ...result.scores };
        const groups = cluster(
          r.questions.filter((q) => !q.saved),
          r.scores,
          r.threshold,
          r.blocked,
        );
        for (const g of groups)
          for (const id of g.members) {
            const q = r.questions.find((q) => q.id === id)!;
            q.group = g.id;
          }
        r.lastGroupedIds = active.map((q) => q.id);
        r.lastRun = Date.now();
        r.lock = 0;
        r.metrics = { ...result, scores: undefined, at: Date.now() };
      });
      ownsLock = false;
      return reply(publicRoom(room, who, actor));
    }
    if (b.action === "start" && demo) {
      if (target.task)
        throw new TaskError("Create a task from the setup page.", 400);
      validateSetup(b);
      const room: Room = {
        ...initial(who),
        title: b.title.trim(),
        description: b.description,
        questions: [],
        interval: b.interval,
        published: !!b.published,
      };
      const task = await createCustomTask(bindings().DB, who, room);
      Object.assign(room, {
        taskId: task.id,
        expiresAt: task.expiresAt,
        createdAt: Date.now(),
      });
      return reply(
        publicRoom(
          room,
          who,
          await participantIdentity(who, "task-" + task.id),
        ),
      );
    }
    const room = await change(target!, (r) => {
      if (b.action === "submit") {
        if (!r.published) throw new Error("This room is paused.");
        if (!actor) throw new Error("Missing participant identity.");
        const text = typeof b.text === "string" ? b.text.trim() : "";
        if (!text || text.length > 500)
          throw new Error("Please write a question of 1–500 characters.");
        const count = r.questionCount ?? r.questions.length;
        const limitError = questionLimitError(count, demo);
        if (limitError) throw new Error(limitError);
        if (
          r.questions.some(
            (q) =>
              q.supporters.includes(actor) && Date.now() - q.created < 3000,
          )
        )
          throw new Error("Please wait a moment before asking again.");
        const id = crypto.randomUUID();
        r.questionCount = count + 1;
        r.questions.push({
          id,
          text,
          supporters: [actor],
          group: id,
          saved: false,
          created: Date.now(),
        });
      } else if (b.action === "vote") {
        if (!r.published || !actor)
          throw new Error(
            "This room is paused or participant identity is missing.",
          );
        const members = r.questions.filter((q) => q.group === b.id && !q.saved);
        if (!members.length) throw new Error("Question is no longer active.");
        if (members.some((q) => q.supporters.includes(actor)))
          members.forEach(
            (q) => (q.supporters = q.supporters.filter((x) => x !== actor)),
          );
        else members[0].supporters.push(actor);
      } else if (
        b.action === "answer" ||
        b.action === "save" ||
        b.action === "restore"
      ) {
        r.questions
          .filter((q) => q.group === b.id)
          .forEach((q) => (q.saved = b.action !== "restore"));
      } else if (b.action === "split") {
        const members = r.questions.filter((q) => q.group === b.id);
        for (let i = 0; i < members.length; i++)
          for (let j = i + 1; j < members.length; j++)
            r.blocked.push(pairKey(members[i].id, members[j].id));
        members.forEach((q) => (q.group = q.id));
      } else if (b.action === "settings" || b.action === "start") {
        if (r.lock && Date.now() - r.lock < 300000)
          throw new Error("Wait for the current grouping pass to finish.");
        if (
          typeof b.title !== "string" ||
          !b.title.trim() ||
          b.title.length > 100
        )
          throw new Error("Enter an event name (up to 100 characters).");
        if (typeof b.description !== "string" || b.description.length > 2000)
          throw new Error("Description is too long.");
        if (
          ![60, 120, 180, 300, 0].includes(b.interval) ||
          !Number.isFinite(b.threshold) ||
          b.threshold < 0.7 ||
          b.threshold > 0.99
        )
          throw new Error("Invalid grouping settings.");
        if (demo && !r.taskId && b.interval !== 0)
          throw new Error("Hosted grouping is manual only.");
        if (b.action === "start") {
          r.questions = [];
          r.scores = {};
          r.blocked = [];
          r.metrics = null;
          r.lastGroupedIds = [];
          r.lock = 0;
        }
        if (r.title !== b.title.trim() || r.description !== b.description) {
          r.scores = {};
          r.lastGroupedIds = [];
          r.questions.filter((q) => !q.saved).forEach((q) => (q.group = q.id));
        }
        for (const g of cluster(
          r.questions.filter((q) => !q.saved),
          r.scores,
          b.threshold,
          r.blocked,
        ))
          for (const id of g.members)
            r.questions.find((q) => q.id === id)!.group = g.id;
        r.title = b.title.trim();
        r.description = b.description;
        r.published = !!b.published;
        r.interval = b.interval;
        r.threshold = b.threshold;
        r.lastRun = Date.now();
      } else if (b.action === "reset") {
        if (r.lock && Date.now() - r.lock < 300000)
          throw new Error("Wait for the current grouping pass to finish.");
        r.questions = r.taskId ? [] : seed();
        r.lastGroupedIds = [];
        r.scores = {};
        r.blocked = [];
        r.metrics = null;
        r.lastRun = Date.now();
        r.lock = 0;
      } else throw new Error("Unknown action.");
    });
    return reply(publicRoom(room, who, actor));
  } catch (e) {
    if (ownsLock)
      await change(target!, (r) => {
        r.lock = 0;
      }).catch(() => {});
    return reply(
      { error: e instanceof Error ? e.message : "Please try again." },
      e instanceof TaskError ? e.status : 400,
    );
  }
}

function validateSetup(b: any) {
  if (typeof b.title !== "string" || !b.title.trim() || b.title.length > 100)
    throw new Error("Enter an event name (up to 100 characters).");
  if (typeof b.description !== "string" || b.description.length > 2000)
    throw new Error("Description is too long.");
  if (![0, 60, 120, 180, 300].includes(b.interval) || b.threshold !== 0.7)
    throw new Error("Invalid grouping settings.");
}
