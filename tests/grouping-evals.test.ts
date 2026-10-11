import test from "node:test";
import assert from "node:assert/strict";
import { loadEvalFile } from "../evals/grouping.ts";

test("grouping eval pairs are well formed", () => {
  const { contexts, cases } = loadEvalFile();
  for (const [name, c] of Object.entries(contexts))
    assert.ok(c.event.trim() && c.description.trim(), name);
  const seen = new Set<string>();
  for (const c of cases) {
    const label = `${c.a} <> ${c.b}`;
    assert.ok(c.a.trim() && c.b.trim() && c.a !== c.b, label);
    assert.equal(typeof c.merge, "boolean", label);
    assert.ok(c.why?.trim(), `${label} needs a "why"`);
    for (const name of c.contexts || [])
      assert.ok(name in contexts, `${label}: unknown context ${name}`);
    const key = [c.a, c.b].sort().join("\n");
    assert.ok(!seen.has(key), `duplicate pair: ${label}`);
    seen.add(key);
  }
  assert.ok(cases.some((c) => c.merge) && cases.some((c) => !c.merge));
});
