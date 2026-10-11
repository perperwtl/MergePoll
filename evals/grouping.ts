// Live check of the Jev grouping instructions against labelled pairs in
// grouping-pairs.json. It spends TypeSafe credits, so it never runs in CI.
//
//   npm run eval:grouping                      every case in every context
//   npm run eval:grouping -- --runs 3          repeat to expose noisy pairs
//   npm run eval:grouping -- --context climate --filter song
//
// Reads TYPESAFE_API_KEY from the environment or this checkout's .env file.
// Exits 1 when a case without a "known" note lands on the wrong side.
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { evaluate, pairKey, type Question } from "../lib/grouping.ts";

export type EvalContext = { event: string; description: string };
export type EvalCase = {
  a: string;
  b: string;
  merge: boolean;
  why: string;
  contexts?: string[];
  known?: string;
};
export type EvalFile = {
  contexts: Record<string, EvalContext>;
  cases: EvalCase[];
};
export const THRESHOLD = 0.7;

export function loadEvalFile(): EvalFile {
  return JSON.parse(
    readFileSync(new URL("./grouping-pairs.json", import.meta.url), "utf8"),
  );
}

function apiKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY;
  const env = new URL("../.env", import.meta.url);
  const line = existsSync(env)
    ? readFileSync(env, "utf8").match(/^TYPESAFE_API_KEY=(.*)$/m)
    : null;
  return line?.[1].trim() || "";
}

// Score only the listed pairs: every other combination is pre-filled as cached.
async function scoreCases(
  key: string,
  context: EvalContext,
  cases: EvalCase[],
) {
  const questions: Question[] = [];
  const idFor = (text: string) => {
    let q = questions.find((x) => x.text === text);
    if (!q) {
      const id = "q" + questions.length;
      q = { id, text, supporters: [], group: id, saved: false, created: 0 };
      questions.push(q);
    }
    return q.id;
  };
  const keys = cases.map((c) => pairKey(idFor(c.a), idFor(c.b)));
  const cached: Record<string, number> = {};
  for (let i = 0; i < questions.length; i++)
    for (let j = i + 1; j < questions.length; j++)
      cached[pairKey(questions[i].id, questions[j].id)] = 0;
  for (const key of keys) delete cached[key];
  const result = await evaluate(
    key,
    context.event,
    context.description,
    questions,
    cached,
  );
  return keys.map((k) => result.scores[k]);
}

async function main() {
  const { values } = parseArgs({
    options: {
      runs: { type: "string", default: "1" },
      context: { type: "string" },
      filter: { type: "string" },
    },
  });
  const key = apiKey();
  if (!key) {
    console.error("Set TYPESAFE_API_KEY in the environment or .env first.");
    process.exit(2);
  }
  const data = loadEvalFile();
  const runs = Math.max(1, Number(values.runs) || 1);
  const filter = values.filter?.toLowerCase();
  let failed = 0,
    total = 0;
  for (const [name, context] of Object.entries(data.contexts)) {
    if (values.context && values.context !== name) continue;
    const cases = data.cases.filter(
      (c) =>
        (!c.contexts || c.contexts.includes(name)) &&
        (!filter || (c.a + " " + c.b).toLowerCase().includes(filter)),
    );
    if (!cases.length) continue;
    console.log(`\n== ${name}: ${context.event} (${cases.length} pairs)`);
    const scores: number[][] = cases.map(() => []);
    for (let r = 0; r < runs; r++)
      (await scoreCases(key, context, cases)).forEach((s, i) =>
        scores[i].push(s),
      );
    cases.forEach((c, i) => {
      const pass = scores[i].every((s) => s >= THRESHOLD === c.merge);
      const label = pass
        ? c.known
          ? "FIXED"
          : "PASS"
        : c.known
          ? "KNOWN"
          : "FAIL";
      total++;
      if (label === "FAIL") failed++;
      console.log(
        `${label.padEnd(5)} ${scores[i].map((s) => s.toFixed(2)).join(" ")}  ` +
          `want ${c.merge ? "merge   " : "separate"}  ${c.a}  <>  ${c.b}`,
      );
      if (label === "KNOWN") console.log(`      known: ${c.known}`);
      if (label === "FIXED")
        console.log(
          '      passed; remove its "known" note once it passes reliably with --runs 3.',
        );
    });
  }
  console.log(`\n${total - failed}/${total} passed (threshold ${THRESHOLD}).`);
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
