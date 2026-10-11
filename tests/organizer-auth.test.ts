import test from "node:test";
import assert from "node:assert/strict";
import {
  organizerIdentity,
  sessionCookie,
  matchesToken,
} from "../lib/organizer-auth.ts";

const token = "synthetic-test-token-not-a-real-credential";
const now = 1_800_000_000_000;

test("production does not grant ownership from Sites headers or missing secrets", async () => {
  const request = new Request("https://event.example/room", {
    headers: { "oai-authenticated-user-id": "organizer" },
  });
  assert.equal(await organizerIdentity(request, {}, now), "participant");
  assert.equal(
    await organizerIdentity(request, { LOCAL_DEMO: "true" }, now),
    "participant",
  );
  assert.equal(
    await organizerIdentity(request, { ORGANIZER_TOKEN: token }, now),
    "participant",
  );
});

test("localhost sandbox needs the dev flag and no configured organizer token", async () => {
  const request = new Request("http://127.0.0.1:5173/room");
  assert.equal(
    await organizerIdentity(request, { LOCAL_DEMO: "true" }, now),
    "organizer",
  );
  assert.equal(
    await organizerIdentity(request, { LOCAL_DEMO: "false" }, now),
    "participant",
  );
  assert.equal(
    await organizerIdentity(
      request,
      { LOCAL_DEMO: "true", ORGANIZER_TOKEN: token },
      now,
    ),
    "participant",
  );
});

test("sessions are signed, expire, and become invalid when the secret rotates", async () => {
  const request = new Request("https://event.example/room");
  const cookie = await sessionCookie(request, token, now);
  assert.match(cookie, /HttpOnly; SameSite=Strict; Max-Age=43200; Secure$/);
  assert.ok(!cookie.includes(token));
  const loggedIn = new Request(request, {
    headers: { cookie: cookie.split(";")[0] },
  });
  assert.equal(
    await organizerIdentity(loggedIn, { ORGANIZER_TOKEN: token }, now),
    "organizer",
  );
  assert.equal(
    await organizerIdentity(
      loggedIn,
      { ORGANIZER_TOKEN: token },
      now + 43_200_000,
    ),
    "participant",
  );
  assert.equal(
    await organizerIdentity(
      loggedIn,
      { ORGANIZER_TOKEN: token + "-rotated" },
      now,
    ),
    "participant",
  );
  const tampered = new Request(request, {
    headers: {
      cookie: cookie
        .split(";")[0]
        .replace(/\.([a-f0-9])/, (_, c) => "." + (c === "a" ? "b" : "a")),
    },
  });
  assert.equal(
    await organizerIdentity(tampered, { ORGANIZER_TOKEN: token }, now),
    "participant",
  );
});

test("token comparisons reject incorrect values", async () => {
  assert.equal(await matchesToken(token, token), true);
  assert.equal(await matchesToken("incorrect", token), false);
});
