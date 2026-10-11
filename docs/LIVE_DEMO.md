# Live experiment

[Try MergePoll in your browser](https://mergepoll.newreed128.chatgpt.site/).
The experiment is hosted with Codex Sites. No account, installation or personal
API key is required. The host supplies a dedicated TypeSafe key as a server secret.

Each browser receives a separate room, identified by an opaque HttpOnly cookie.
Both Organizer and Participant views use that room. Another browser or private
window gets a different room; this sandbox does not simulate multiple attendees
sharing one event. Cookies expire after 12 hours. This is an experimental demo;
do not enter private data. There is no automatic database deletion policy yet.

## Deployment boundary

Docker (`PUBLIC_DEMO=false`) uses the operator’s own key and one shared room,
with no application question-count or grouping-attempt quota. The hosted Site
(`PUBLIC_DEMO=true`) uses a server-only maintainer key and browser-isolated
sandboxes with the allowances below. Neither target collects visitor API keys.
Both cap individual posts at 500 characters and batch Jev comparisons to fit
its context window; these are input safeguards, not Docker usage quotas.

**Try it with your own task** opens `/new`, a blank setup form. Creating a task
replaces the current room’s questions, votes and history after an explicit submit.
It preserves browser-session model allowances; demo and custom tasks share them.
Task setup and language switching require no new Site capabilities, secrets,
storage bindings or scheduled jobs. Existing D1 room JSON stores the task.

## Walkthrough

1. Open the introduction and enter Climate Change 101.
2. Click **Group now** to compare the ten seed questions with real Jev predictions.
3. Expand a group's original wording and inspect the Grouping lab.
4. Mark questions answered, reopen them, or split a mistaken merge.
5. Try “How does climate change affect ocean life?” and
   “Will climate change affect ocean life?” after making room in the queue.

## Allowances

- 100 questions per task, including answered questions; 500 characters per question.
- Ten live model grouping attempts per browser session, with one minute between attempts.
- A shared daily cap of 100 grouping attempts across all visitors, resetting at UTC midnight.
- A shared daily cap of 20,000 new pair comparisons (failed attempts count; provider retries can repeat them).
- Cached comparisons and no-new-question cycles do not consume model attempts.
- Resetting the question set preserves used allowances. Failed model attempts
  count too. A visit can still post, vote and inspect results after its quota is used.
- Automatic grouping starts disabled. Use **Group now** for the walkthrough.

The caps bound model requests, not a currency-denominated bill. Provider-side
spending limits are separate. For further experimentation use [Docker](SELF_HOSTING.md)
with your own key. The demo does not distribute the host's key or grant production
hosting access. Question text and event context go to TypeSafe during grouping.

## Hosted source

The demo's application code is in `app/` and `lib/` in this repository.
The maintainer's demo uses browser sandboxes; local Docker uses a shared room
with optional organizer authentication. Docker is the supported setup for
running your own copy. The hosted demo is provided for quick visitor trials.

The [hosted build overlay](../hosting/sites/README.md) includes its lockfile,
retained build scripts and migration history so the served version can be rebuilt.

## Model sizing

100 audience questions require up to 4,950 pair decisions. This is our hosted
product allowance, not Jev’s question limit. As checked on 2026-10-11, the
[model documentation](https://docs.typesafe.ai/models.md) specifies 64k tokens
per request and 32k for state plus the longest question. Comparison requests
use conservative UTF-8 byte bounds with room for shared state. Docker can
accept more questions, but all-pairs time, memory and provider cost grow quadratically.
