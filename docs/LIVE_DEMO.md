# Live experiment

[Try MergePoll in your browser](https://mergepoll.newreed128.chatgpt.site/).
The experiment is hosted with Codex Sites. No account, installation or personal
API key is required. The host supplies a dedicated TypeSafe key as a server secret.

Each browser receives a separate room, identified by an opaque HttpOnly cookie.
Both Organizer and Participant views use that room. Another browser or private
window gets a different room; this sandbox does not simulate multiple attendees
sharing one event. Cookies expire after 12 hours. This is an experimental demo;
do not enter private data. There is no automatic database deletion policy yet.

## Walkthrough

1. Open the introduction and enter Climate Change 101.
2. Click **Group now** to compare the ten seed questions with real Jev predictions.
3. Expand a group's original wording and inspect the Grouping lab.
4. Mark questions answered, reopen them, or split a mistaken merge.
5. Try “How does climate change affect ocean life?” and
   “Will climate change affect ocean life?” after making room in the queue.

## Allowances

- 12 open questions per sandbox.
- Three live model grouping attempts per browser session, with one minute between attempts.
- A shared daily cap of 100 grouping attempts across all visitors, resetting at UTC midnight.
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
