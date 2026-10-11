import type { Question } from "./grouping";
export const MERGE_POLICY = "shared-response-v2";
export type PolicyState = {
  mergePolicy?: string;
  threshold: number;
  scores: Record<string, number>;
  questions: Question[];
  lastGroupedIds?: string[];
  metrics: unknown;
  lock: number;
  lastRun: number;
};
export function upgradeMergePolicy(r: PolicyState, now = Date.now()) {
  if (r.mergePolicy === MERGE_POLICY) return false;
  r.mergePolicy = MERGE_POLICY;
  r.threshold = 0.7;
  r.scores = {};
  r.lastGroupedIds = [];
  r.metrics = null;
  r.lock = 0;
  r.lastRun = now;
  // Keep original wording, votes, answered history and manual exclusions.
  r.questions.filter((q) => !q.saved).forEach((q) => (q.group = q.id));
  return true;
}
