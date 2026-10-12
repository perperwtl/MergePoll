// Stateless Site MCP adapter. The only write is the same bounded expiry cleanup
// used by the HTTP endpoint; callers cannot select records or supply a cutoff.
const versions = ["2026-07-28", "2025-11-25", "2025-06-18", "2024-11-05"];
const tool = {
  name: "cleanup_expired_tasks",
  description:
    "Delete only MergePoll custom tasks and browser reservations whose 24-hour deadline has passed. Active tasks are preserved. Returns the deleted-row count and server check time.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};
export async function cleanupMcp(
  req: Request,
  enabled: boolean,
  cleanup: () => Promise<number>,
) {
  const headers = { "Cache-Control": "no-store" };
  if (!enabled)
    return Response.json({ error: "Not available." }, { status: 404, headers });
  let rpc: any;
  try {
    rpc = await req.json();
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { headers },
    );
  }
  const id = rpc?.id ?? null;
  const result = (value: unknown) =>
    Response.json({ jsonrpc: "2.0", id, result: value }, { headers });
  const error = (code: number, message: string) =>
    Response.json(
      { jsonrpc: "2.0", id, error: { code, message } },
      { headers },
    );
  if (
    !rpc ||
    Array.isArray(rpc) ||
    rpc.jsonrpc !== "2.0" ||
    typeof rpc.method !== "string"
  )
    return error(-32600, "Invalid Request");
  if (rpc.method.startsWith("notifications/") && rpc.id === undefined)
    return new Response(null, { status: 204, headers });
  if (
    rpc.id === undefined ||
    (typeof rpc.id !== "number" &&
      typeof rpc.id !== "string" &&
      rpc.id !== null)
  )
    return error(-32600, "A request ID is required");
  switch (rpc.method) {
    case "server/discover":
      return result({
        supportedVersions: versions,
        capabilities: { tools: {} },
        serverInfo: { name: "MergePoll cleanup", version: "1.0.0" },
      });
    case "initialize":
      return result({
        protocolVersion: versions.includes(rpc.params?.protocolVersion)
          ? rpc.params.protocolVersion
          : versions[0],
        capabilities: { tools: {} },
        serverInfo: { name: "MergePoll cleanup", version: "1.0.0" },
      });
    case "ping":
      return result({});
    case "tools/list":
      return result({ tools: [tool] });
    case "tools/call": {
      if (rpc.params?.name !== tool.name) return error(-32602, "Unknown tool");
      const args = rpc.params.arguments ?? {};
      if (
        !args ||
        typeof args !== "object" ||
        Array.isArray(args) ||
        Object.keys(args).length
      )
        return error(-32602, "This tool accepts no arguments");
      try {
        const deleted = await cleanup();
        return result({
          content: [
            {
              type: "text",
              text: JSON.stringify({ deleted, checkedAt: Date.now() }),
            },
          ],
          isError: false,
        });
      } catch {
        return result({
          content: [
            { type: "text", text: "Cleanup could not complete. Please retry." },
          ],
          isError: true,
        });
      }
    }
    default:
      return error(-32601, "Method not found");
  }
}
