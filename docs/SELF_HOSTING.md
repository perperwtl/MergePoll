# Run MergePoll with Docker

## Docker quick start

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows
or macOS, or Docker Engine plus Compose v2.24+ on Linux. Start Docker before running:

```bash
git clone https://github.com/perperwtl/MergePoll.git
cd MergePoll
docker compose up --build -d
```

Open **http://localhost:5173**. The container handles Node.js, locked npm
dependencies, the app build and database migrations. It runs the built Worker
with Wrangler's local D1 emulator; no Cloudflare account is needed. This is a
single-machine prototype for local use.

The port is bound to loopback on the host. Inside the container the server listens
on all interfaces, which allows Docker's port forwarding. Without an organizer
token, localhost organizer controls are shared. The published Sites demo gives
each visitor a separate sandbox; it does not provide a shared remote event room.

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

Docker reads credentials only from this checkout’s `.env` file. A
`TYPESAFE_API_KEY` exported in your shell is not passed into the container. There
is no bundled key or fallback to the maintainer’s demo key. The browser displays
a setup notice when no key is configured; credentials are configured by the
Docker operator, not collected from participants.

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

## Configuration

| Setting | Docker behavior | Purpose |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | Optional value in `.env` | Real Jev grouping |
| `ORGANIZER_TOKEN` | Optional value in `.env` | Private organizer login; sessions expire after 12 hours |
| `MERGEPOLL_PORT` | `.env`, default 5173 | Host port |
| `LOCAL_DEMO` | Container sets `true`; a configured token takes precedence | Local organizer access |
| `PUBLIC_DEMO` | Container forces `false` | Docker uses one shared room |
| `DB` | Local D1 state in the named volume | Room persistence |
| `SOURCE_URL` | `lib/project.ts` | Source for the served version |

## Development checks in Docker

After editing source, rebuild with `docker compose up --build -d`. The container
runs the compiled app; source changes require a rebuild.

Use the Dockerfile's build stage to run contributor checks without host Node.js:

```bash
docker build --target build -t mergepoll-check .
docker run --rm --entrypoint npm mergepoll-check run format:check
docker run --rm --entrypoint npm mergepoll-check run typecheck
docker run --rm --entrypoint npm mergepoll-check test
```

The image build runs `npm run build` internally. These checks use synthetic data
and do not require API keys. If formatting needs repair, run Prettier through a
Node container with the source directory mounted, or use your editor's formatter;
formatting inside the check image does not modify your working tree.

## Supported setup

Docker is the supported setup for running your own copy. The public hosted demo
lets visitors try MergePoll quickly; it is separate from this local setup.
Wrangler, the Worker build configuration and local migrations remain in the
repository because Docker uses them internally.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Docker cannot connect to daemon | Start Docker Desktop or the Docker Engine service |
| Port already in use | Set a different `MERGEPOLL_PORT` in `.env`, then run `docker compose up -d` |
| Container unhealthy | Inspect `docker compose logs mergepoll`; check migrations and available disk/memory |
| Database not ready / `no such table: rooms` | Rebuild and recreate with `docker compose up --build -d`; inspect container logs for migration failures |
| “AI grouping needs your own TypeSafe key” | Set `TYPESAFE_API_KEY` in `.env` and recreate the container |
| Organizer controls disabled | Sign in with the organizer token; local automatic access requires an empty `ORGANIZER_TOKEN` |
| Participant link opens the wrong computer | `127.0.0.1` refers to the same machine; Docker is local, and the Sites demo isolates visitors |
| “No new questions” | Expected: the model is skipped when no new active question needs processing |
| Countdown does not run in the background | Keep an authenticated Organizer view open; this prototype has no server scheduler |
| Docker build fails | Inspect the build output; the Dockerfile supplies the supported Node version |

`Reset test questions` replaces the room's questions, votes and history. It does
not remove the database schema. Back up anything you need before resetting.
