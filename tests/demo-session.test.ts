import test from "node:test";
import assert from "node:assert/strict";
import {
  demoSession,
  demoGroupingError,
  questionLimitError,
} from "../lib/demo-session.ts";

test("demo access is opt-in and new visitors receive separate opaque rooms", () => {
  const req = new Request("https://demo.example/api/room");
  assert.equal(demoSession(req, false, true), null);
  assert.equal(demoSession(req, true), null);
  const a = demoSession(req, true, true)!;
  const b = demoSession(req, true, true)!;
  assert.notEqual(a.id, b.id);
  assert.match(a.cookie!, /HttpOnly; SameSite=Strict; Max-Age=43200; Secure$/);
  const returning = new Request(req, {
    headers: { cookie: a.cookie!.split(";")[0] },
  });
  assert.equal(demoSession(returning, true)!.id, a.id);
  assert.equal(demoSession(returning, false), null);
  assert.equal(
    demoSession(
      new Request(req, { headers: { cookie: "mergepoll-demo=organizer" } }),
      true,
    ),
    null,
  );
});

test("demo quotas and cooldown do not reset with question resets", () => {
  assert.equal(demoGroupingError({ demoRuns: 9 }, 100_000), null);
  assert.match(demoGroupingError({ demoRuns: 10 }, 100_000)!, /ten/);
  assert.match(
    demoGroupingError({ demoLastAttempt: 90_000 }, 100_000)!,
    /one minute/,
  );
  assert.equal(demoGroupingError({ demoLastAttempt: 40_000 }, 100_000), null);
});

test("hosted task cap includes answered questions; Docker has no count quota", () => {
  assert.equal(questionLimitError(Array(99).fill({ saved: true }), true), null);
  assert.match(
    questionLimitError(Array(100).fill({ saved: true }), true)!,
    /100/,
  );
  assert.equal(
    questionLimitError(Array(1000).fill({ saved: false }), false),
    null,
  );
});
