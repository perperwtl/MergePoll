# Run MergePoll on your own machine or Worker

## Local development

Use the [README quick start](../README.md#quick-start). `npm run db:migrate`
applies SQL migrations to a local Cloudflare D1 emulator; no account is needed.
The app creates ten demo questions on its first room request. Data persists in
the ignored `.wrangler/` directory across restarts.

The dev server is bound to `127.0.0.1`. Without an organizer token, local browser
windows share organizer controls. For an access-separated test, configure
`ORGANIZER_TOKEN` in `.dev.vars`. Signed sessions expire after 12 hours, and
rotating the token invalidates previously issued sessions.

| Setting | Where | Purpose |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | `.dev.vars` locally; Worker secret when deployed | Real Jev grouping |
| `ORGANIZER_TOKEN` | `.dev.vars` locally; Worker secret when deployed | Private organizer login |
| `LOCAL_DEMO` | Vite dev configuration / Wrangler vars | Local sandbox flag; keep `false` when deployed |
| `DB` | D1 binding in `wrangler.jsonc` | Room persistence |
| `SOURCE_URL` | `lib/project.ts` | Source link for the version you host |

Do not prefix keys or the organizer token with `NEXT_PUBLIC_`. The browser
never needs these environment values. After editing `.dev.vars`, restart the
server. The server must load an actual TypeSafe key before grouping can run.

## Cloudflare Workers deployment

You need a Cloudflare account and permission to create a Worker and D1 database.
Check [license permissions](LICENSING.md) for your deployment's purpose first.

1. Install dependencies and authenticate:

   ```bash
   npm ci
   npx wrangler login
   npx wrangler d1 create mergepoll
   ```

2. Put the returned **database ID** in `wrangler.jsonc`, replacing the all-zero
   local placeholder. You can also change the Worker name to avoid collisions;
   use that name for the secret commands below. Keep `LOCAL_DEMO` set to `false`.

3. Apply the database schema to the remote database:

   ```bash
   npx wrangler d1 migrations apply mergepoll --remote
   ```

4. Set private secrets using Wrangler's interactive prompts. Never paste secrets
   into committed files or command-line arguments:

   ```bash
   npx wrangler secret put ORGANIZER_TOKEN --name mergepoll
   npx wrangler secret put TYPESAFE_API_KEY --name mergepoll
   ```

   If Wrangler asks to create the Worker because it does not yet exist, let it
   create it. Use a randomly generated token with at least 32 bytes of entropy.
   For example, generate one locally with `openssl rand -hex 32` and store it
   privately. Give the token only to the organizer.

5. If you modified the project, update `SOURCE_URL` in `lib/project.ts` to the
   complete source for your served version. Run checks and deploy:

   ```bash
   npm run typecheck
   npm test
   npm run deploy
   ```

6. Open the Worker URL, select **Organizer** and sign in. Share
   `/room?view=participant` with attendees; that link contains no organizer secret.
   Confirm a participant browser cannot reset, regroup, change settings or mark
   questions answered. Test the grouping with your own key and confirm its usage.

The built Worker config is `dist/server/wrangler.json`. `npm run preview` runs
that build locally; it uses production permissions, so configure an organizer
token for organizer access. Remote deployment and real model calls are separate
from the repository's automated tests.

Before a wide public launch, add rate limiting, spending controls, moderation
and a communicated retention policy. See [SECURITY.md](../SECURITY.md).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Database not ready / `no such table: rooms` | Run `npm run db:migrate`; for a Worker use the remote migration command |
| “A server-side TypeSafe key is required” | Set `TYPESAFE_API_KEY` in `.dev.vars` or the Worker secret, then restart locally |
| Organizer controls disabled | Sign in with the organizer token; local automatic access requires no token and the dev server |
| Participant link opens the wrong computer | `127.0.0.1` only refers to the same machine; deploy before sharing with remote attendees |
| “No new questions” | Expected: the model is skipped when no new active question needs processing |
| Countdown does not run in the background | Keep an authenticated Organizer view open; this prototype has no server scheduler |
| Build fails on an older Node version | Use Node 24 with `nvm use`, or another supported Node version |

`Reset test questions` replaces the room's questions, votes and history. It does
not remove the database schema. Back up anything you need before resetting.
