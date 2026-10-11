# Hosted build overlay

This directory contains the retained Codex Sites build integration, dependency
lockfile, D1 schema and migration history for the public experiment. The shared
application source is the repository's root `app/` and `lib/`; this avoids keeping
two copies of MergePoll's application code. Ordinary users should use Docker.

This overlay preserves the demo's build source. It is not a supported hosting
setup for users; follow the root README to run your own copy with Docker.
Demo deployment procedures are maintained separately in local maintainer notes.

To reproduce the demo build artifacts:

1. Copy this directory's contents, including dotfiles, to an empty folder.
2. Copy root `app/`, `lib/` and `public/` into it, retaining the overlay's connector helpers.
3. Create `.openai/` and copy `hosting.example.json` to `.openai/hosting.json`.
   The example contains a placeholder identity, not a connection to the live demo.
4. Install the locked dependencies with `npm ci`, then `npm run build`.

These steps build artifacts only. They do not create a Site, publish a deployment
or provide access to the maintainer's database or runtime secrets.

Sites applies the retained Drizzle migrations and supplies the D1 binding.
Keep applied migrations unchanged. Docker applies root `migrations/` to its local
D1 database instead. Both schemas contain the same rooms table.

The unmodified Sites scaffold and build plugin remain independently licensed;
see `build/sites-vite-plugin.LICENSE` (OpenAI MIT). Dependencies keep their own
licenses. MergePoll application changes retain the root LICENSE. This overlay
is build source, not a second app or a bundle of hosting credentials.
