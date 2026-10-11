export type AuthEnvironment = { ORGANIZER_TOKEN?: string; LOCAL_DEMO?: string };
const COOKIE = "mergepoll-organizer";
const MAX_AGE = 12 * 60 * 60;
const encoder = new TextEncoder();

export function isLocalDemo(req: Request, env: AuthEnvironment) {
  return (
    !env.ORGANIZER_TOKEN &&
    env.LOCAL_DEMO === "true" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(new URL(req.url).hostname)
  );
}

export async function matchesToken(value: string, expected: string) {
  const [a, b] = await Promise.all(
    [value, expected].map((v) =>
      crypto.subtle.digest("SHA-256", encoder.encode(v)),
    ),
  );
  const aa = new Uint8Array(a),
    bb = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i];
  return difference === 0;
}

async function sign(expiry: string, token: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(token),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode("mergepoll-organizer-v1:" + expiry),
  );
  return Array.from(new Uint8Array(signature), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}

export async function organizerIdentity(
  req: Request,
  env: AuthEnvironment,
  now = Date.now(),
) {
  if (isLocalDemo(req, env)) return "organizer";
  if (!env.ORGANIZER_TOKEN) return "participant";
  const cookie = (req.headers.get("cookie") || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(COOKIE + "="));
  const [expiry, signature] = (cookie?.slice(COOKIE.length + 1) || "").split(
    ".",
  );
  if (
    !expiry ||
    !signature ||
    !/^\d+$/.test(expiry) ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return "participant";
  const seconds = Math.floor(now / 1000);
  if (Number(expiry) <= seconds || Number(expiry) > seconds + MAX_AGE)
    return "participant";
  return (await matchesToken(
    signature,
    await sign(expiry, env.ORGANIZER_TOKEN),
  ))
    ? "organizer"
    : "participant";
}

export async function sessionCookie(
  req: Request,
  token: string,
  now = Date.now(),
) {
  const expiry = String(Math.floor(now / 1000) + MAX_AGE);
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${expiry}.${await sign(expiry, token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${secure}`;
}

export function clearSessionCookie(req: Request) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
}
