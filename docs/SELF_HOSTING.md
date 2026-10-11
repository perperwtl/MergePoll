# Run MergePoll on your own machine or Worker

## Docker quick start

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows
or macOS, or Docker Engine plus Compose v2+ on Linux. Start Docker before running:

```bash
git clone https://github.com/perperwtl/MergePoll.git
cd MergePoll
docker compose up --build -d
```

Open **http://localhost:5173**. The container handles Node.js, locked npm
dependencies, the app build and database migrations. It runs the built Worker
with Wrangler's local D1 emulator; no Cloudflare account is needed. This is a
single-machine prototype, not a production replacement for Cloudflare Workers.

The port is bound to loopback on the host. Inside the container the server listens
on all interfaces, which allows Docker's port forwarding. Without an organizer
token, localhost organizer controls are shared. For real remote events, use the
Worker deployment below with an organizer token.

### Optional grouping and organizer login

```bash
cp .env.example .env
```

Edit `.env` in your editor. Set your own `TYPESAFE_API_KEY` for real grouping and,
optionally, a long random `ORGANIZER_TOKEN` for organizer login. Generate a token
with `openssl rand -hex 32` if available. Then apply changes:

```bash
docker compose up -d
```

Docker Compose recreates the container when the environment changes. Merely
restarting an existing container does not reload `.env`. Secrets are supplied
at runtime; `.env`, `.dev.vars`, local database state and Sites files are
excluded from the image build context. Never use a `NEXT_PUBLIC_` prefix for secrets.

Set `MERGEPOLL_PORT=8080` in `.env` to use http://localhost:8080 instead.

### Stop, update and back up

```bash
docker compose logs -f mergepoll
docker compose ps
docker compose down
```

`down` preserves the `mergepoll-data` volume. After pulling source updates, run
`docker compose up --build -d` again; migrations run automatically on startup.
**`docker compose down -v` permanently deletes the local room database.**

For a consistent backup, stop the service, copy its state, then start it again:

```bash
docker compose stop mergepoll
docker compose cp mergepoll:/app/.wrangler/state ./mergepoll-backup
docker compose start mergepoll
```

To restore, stop the service and copy the saved directory contents back with
`docker compose cp ./mergepoll-backup/. mergepoll:/app/.wrangler/state`, then start.
Keep the backup private; it contains questions and browser identities.

## Source development (optional)

Only contributors need host Node.js **22.13+** (Node 24 in `.nvmrc`) and npm:

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:migrate
npm run dev
```

Open http://localhost:5173. Set secrets in `.dev.vars` for this workflow and
restart after edits. Local state persists in `.wrangler/`. Signed organizer
sessions expire after 12 hours; rotating the token invalidates them.

| Setting | Docker | Source / Worker | Purpose |
| --- | --- | --- | --- |
| `TYPESAFE_API_KEY` | `.env` | `.dev.vars` / Worker secret | Real Jev grouping |
| `ORGANIZER_TOKEN` | `.env` | `.dev.vars` / Worker secret | Private organizer login |
| `MERGEPOLL_PORT` | `.env`, default 5173 | Vite/Wrangler port argument | Host port |
| `LOCAL_DEMO` | Container sets `true` | Dev sets `true`; keep `false` on Worker | Local sandbox only |
| `PUBLIC_DEMO` | Container forces `false` | Optional hosted demo variable | Separate visitor sandboxes; see [live demo](LIVE_DEMO.md) |
| `DB` | Named volume with local D1 | D1 binding | Room persistence |
| `SOURCE_URL` | `lib/project.ts` | `lib/project.ts` | Source for hosted version |

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
| Docker cannot connect to daemon | Start Docker Desktop or the Docker Engine service |
| Port already in use | Set a different `MERGEPOLL_PORT` in `.env`, then run `docker compose up -d` |
| Container unhealthy | Inspect `docker compose logs mergepoll`; check migrations and available disk/memory |
| Database not ready / `no such table: rooms` | Restart the container to apply migrations, or run `npm run db:migrate` for source development; for a Worker use the remote migration command |
| “A server-side TypeSafe key is required” | Set `TYPESAFE_API_KEY` in `.env` and recreate the container; use `.dev.vars` for development or a Worker secret |
| Organizer controls disabled | Sign in with the organizer token; local automatic access requires no token and the dev server |
| Participant link opens the wrong computer | `127.0.0.1` only refers to the same machine; deploy before sharing with remote attendees |
| “No new questions” | Expected: the model is skipped when no new active question needs processing |
| Countdown does not run in the background | Keep an authenticated Organizer view open; this prototype has no server scheduler |
| Build fails on an older Node version | Use Node 24 with `nvm use`, or another supported Node version |

`Reset test questions` replaces the room's questions, votes and history. It does
not remove the database schema. Back up anything you need before resetting.
