import { env } from "cloudflare:workers";
import {
  matchesToken,
  sessionCookie,
  clearSessionCookie,
} from "../../../lib/organizer-auth";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const bindings = env as unknown as { ORGANIZER_TOKEN?: string };
  if (!bindings.ORGANIZER_TOKEN)
    return Response.json(
      { error: "Organizer login is not configured." },
      { status: 503 },
    );
  try {
    const body = (await req.json()) as { token?: unknown; logout?: boolean };
    if (body.logout)
      return Response.json(
        { ok: true },
        {
          headers: {
            "Set-Cookie": clearSessionCookie(req),
            "Cache-Control": "no-store",
          },
        },
      );
    if (
      typeof body.token !== "string" ||
      body.token.length > 512 ||
      !(await matchesToken(body.token, bindings.ORGANIZER_TOKEN))
    ) {
      return Response.json(
        { error: "Incorrect organizer token." },
        { status: 401 },
      );
    }
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": await sessionCookie(req, bindings.ORGANIZER_TOKEN),
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json({ error: "Invalid login request." }, { status: 400 });
  }
}
