export const DEMO_COOKIE = "mergepoll-demo";
// An unguessable HttpOnly cookie grants access only to its own demo room.
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
    return { id: "demo-" + value, cookie: undefined };
  }
  if (!create) return null;
  const id = crypto.randomUUID();
  return {
    id: "demo-" + id,
    cookie: `${DEMO_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`,
  };
}
export const DEMO_MAX_QUESTIONS = 100;
export const DEMO_MAX_RUNS = 10;
export const DEMO_DAILY_RUNS = 100;
export function demoGroupingError(
  room: { demoRuns?: number; demoLastAttempt?: number },
  now = Date.now(),
) {
  if ((room.demoRuns || 0) >= DEMO_MAX_RUNS)
    return "Demo limit: ten live grouping passes per browser session. Use Docker for further experiments.";
  if (now - (room.demoLastAttempt || 0) < 60_000)
    return "Please wait one minute between live demo grouping passes.";
  return null;
}

export const DEMO_DAILY_PAIRS = 20_000;
export function questionLimitError(questions: unknown[], demo: boolean) {
  return demo && questions.length >= DEMO_MAX_QUESTIONS
    ? "Task limit: 100 questions including answered questions. Start a new task or use Docker."
    : null;
}
