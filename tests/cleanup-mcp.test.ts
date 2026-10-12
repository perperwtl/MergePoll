import assert from "node:assert/strict";
import test from "node:test";
import { cleanupMcp } from "../lib/cleanup-mcp.ts";
const request = (method: string, params?: unknown, id: unknown = 1) =>
  new Request("https://example.com/mcp", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
test("hosted cleanup discovery is read-only; Docker exposes no tool", async () => {
  let calls = 0;
  const cleanup = async () => ++calls;
  assert.equal(
    (
      await cleanupMcp(
        request("tools/call", { name: "cleanup_expired_tasks" }),
        false,
        cleanup,
      )
    ).status,
    404,
  );
  const discovery = (await (
    await cleanupMcp(request("server/discover"), true, cleanup)
  ).json()) as any;
  assert.ok(discovery.result.supportedVersions.includes("2026-07-28"));
  const listing = (await (
    await cleanupMcp(request("tools/list"), true, cleanup)
  ).json()) as any;
  assert.equal(listing.result.tools[0].name, "cleanup_expired_tasks");
  assert.equal(calls, 0);
});
test("cleanup callers cannot choose a cutoff, records, or arbitrary operation", async () => {
  let calls = 0;
  const cleanup = async () => ++calls;
  for (const params of [
    { name: "arbitrary" },
    { name: "cleanup_expired_tasks", arguments: { now: 9999999999999 } },
    { name: "cleanup_expired_tasks", arguments: ["id"] },
  ]) {
    const response = (await (
      await cleanupMcp(request("tools/call", params), true, cleanup)
    ).json()) as any;
    assert.equal(response.error.code, -32602);
  }
  assert.equal(calls, 0);
  const response = (await (
    await cleanupMcp(
      request("tools/call", { name: "cleanup_expired_tasks", arguments: {} }),
      true,
      cleanup,
    )
  ).json()) as any;
  assert.equal(response.result.isError, false);
  assert.equal(JSON.parse(response.result.content[0].text).deleted, 1);
  assert.equal(calls, 1);
});
test("failed cleanup is reported without database details or credentials", async () => {
  const response = (await (
    await cleanupMcp(
      request("tools/call", { name: "cleanup_expired_tasks" }),
      true,
      async () => {
        throw new Error("private DB detail");
      },
    )
  ).json()) as any;
  assert.equal(response.result.isError, true);
  assert.ok(!JSON.stringify(response).includes("private DB detail"));
});
