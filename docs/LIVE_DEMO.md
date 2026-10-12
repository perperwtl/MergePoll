# Live MergePoll

[Open MergePoll](https://mergepoll.newreed128.chatgpt.site/) or
[create your own task](https://mergepoll.newreed128.chatgpt.site/new).
No account, installation or personal API key is required. The host supplies a
TypeSafe key as a server-only secret. Grouping sends question text and event
context to TypeSafe; use appropriate, non-private examples.

## Shared custom tasks

1. Open **Try it with your own task** and give the task a name and optional context.
2. The server creates an empty task with a random `/room/<UUID>` URL.
3. **Share room** copies that URL with `?view=participant`. Other browsers join
   the same queue, can ask and vote, and cannot change settings or group questions.
4. Keep the creator's browser cookies for organizer access. Adding
   `?view=organizer` to a participant URL does not grant that access.
5. A visible countdown shows the 24-hour deadline from creation. Editing,
   clearing questions or visiting the task does not extend it.

Each browser can have **one active custom task**. Concurrent create requests
are reserved atomically. `/new` offers a link back to the existing task.
After expiry the same browser can create another task. Without login this is a
browser limit, not verified person identity: clearing cookies, private browsing
or another browser can bypass it. We do not fingerprint visitors. Shared daily
model budgets still apply across all browsers.

## Expiry and deletion

At 24 hours the server refuses reads and writes, and the client closes the task.
An expired task is deleted when accessed. The Site's linked cleanup task calls the hosted
`cleanup_expired_tasks` MCP tool to delete expired task rows and browser reservations
when nobody visits. Physical deletion may lag the deadline until the next enabled cleanup run
(currently configured every three hours); scheduler failures can delay it further. Access expiry
does not depend on the schedule. Active tasks and Docker data are never selected
by cleanup. The cutoff is server time and cannot be supplied by a caller. A paused schedule
does not remove unvisited expired records until it resumes.

The cleanup task does not republish the Site or call the model. Its tool
returns only a deleted-row count and check time. No visitor identity or secret is needed to
trigger this bounded, idempotent removal of already-expired rows. This policy
covers newly created shared tasks; legacy personal demo rooms are retained.

## Grouping allowances

- **100 total submitted questions per task**, including answered questions.
  Clearing questions does not reset the count. Each post is at most 500 UTF-16
  code units (browser `maxLength`), and event context is at most 2,000.
- **40 live grouping attempts per task** with at least one minute between them.
  A 90-minute class checking every three minutes needs at most 30 attempts;
  40 leaves room for manual passes. No-new-question and fully cached checks
  do not consume the allowance. Failed model attempts count.
- Custom tasks default to **three-minute automatic checks** while the authorized
  Organizer view remains open. Closing it stops automatic checks; participants
  cannot initiate model calls. **Group now** remains available.
- Shared daily caps: **500 grouping attempts and 100,000 new pair comparisons**,
  resetting at UTC midnight. Provider retries may repeat comparisons. These are
  request budgets, not a guaranteed currency-denominated bill; provider spending
  limits remain separate. A task can still accept questions and votes after its
  model allowance is exhausted, until its deadline or question cap.
- The Climate Change 101 walkthrough remains a private browser sandbox with
  ten seed questions and manual grouping. It has its own 40-attempt allowance.
  Its URL does not share the sandbox. Resetting it preserves used allowances.

## Deployment boundary

| Behavior | Docker (`PUBLIC_DEMO=false`) | Public ChatGPT Site (`PUBLIC_DEMO=true`) |
| --- | --- | --- |
| Room | One operator-managed shared room | Private climate walkthrough plus shared custom tasks |
| Key | Operator's own TypeSafe key | Maintainer's server secret |
| Question/grouping count quota | None imposed by the app | Per-task and shared daily budgets above |
| Custom task lifetime | No automatic expiry or cleanup | One active task per browser, 24 hours |
| Organizer access | Local controls or configured organizer token | Private HttpOnly browser cookie |
| Participant link | Shared local room | Random custom-task URL, participant view |

Both targets bound individual text inputs and comparison batches. Jev's
[model documentation](https://docs.typesafe.ai/models.md), checked 2026-10-11,
specifies 64k tokens per request and 32k for state plus the longest question.
100 audience questions need up to 4,950 pair decisions, split into requests using
conservative UTF-8 byte bounds. This product cap is not Jev's question-count limit.

The shared code lives in root `app/` and `lib/`. The
[hosted overlay](../hosting/sites/README.md) retains the build integration and
D1 migrations. Tasks and reservations reuse the existing rooms table's JSON;
The cleanup integration adds the Site MCP capability without changing schema,
bindings, secrets or audience. It reuses the existing Site-linked schedule.
The task must call the connected cleanup tool rather than a shell HTTP client,
whose cloud network proxy may be unavailable. The public HTTP cleanup endpoint
is retained for operational checks. Docker exposes neither cleanup interface.
