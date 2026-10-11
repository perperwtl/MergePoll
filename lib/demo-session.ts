export const DEMO_COOKIE = "mergepoll-demo";
// Private browser identity; shared task IDs never contain this cookie value.
export function demoSession(req: Request, enabled: boolean, create = false) {
  if (!enabled) return null;
  const value = (req.headers.get("cookie") || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(DEMO_COOKIE + "="))
    ?.slice(DEMO_COOKIE.length + 1);
  if (
    value &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      value,
    )
  ) {
    return { id: "demo-" + value, cookie: browserCookie(req, value) };
  }
  if (!create) return null;
  const id = crypto.randomUUID();
  return {
    id: "demo-" + id,
    cookie: browserCookie(req, id),
  };
}
export const DEMO_MAX_QUESTIONS = 100;
export const DEMO_MAX_RUNS = 40;
export const DEMO_DAILY_RUNS = 500;
export function demoGroupingError(
  room: { demoRuns?: number; demoLastAttempt?: number },
  now = Date.now(),
) {
  if ((room.demoRuns || 0) >= DEMO_MAX_RUNS)
    return "Demo limit: 40 live grouping passes per task. Use Docker for further experiments.";
  if (now - (room.demoLastAttempt || 0) < 60_000)
    return "Please wait one minute between live demo grouping passes.";
  return null;
}

export const DEMO_DAILY_PAIRS = 100_000;
export function questionLimitError(
  questions: unknown[] | number,
  demo: boolean,
) {
  return demo &&
    (typeof questions === "number" ? questions : questions.length) >=
      DEMO_MAX_QUESTIONS
    ? "Task limit: 100 questions including answered questions. Use votes on existing questions or run Docker."
    : null;
}

function browserCookie(req: Request, id: string) {
  return `${DEMO_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
}
