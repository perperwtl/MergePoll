# Hosted build overlay

This directory contains the retained Codex Sites build integration, dependency
lockfile, D1 schema and migration history for the public experiment. The shared
application source is the repository's root `app/` and `lib/`; this avoids keeping
two copies of MergePoll's application code. Ordinary users should use Docker.

To reproduce the hosted build in a separate working directory:

1. Copy this directory's contents, including dotfiles, to an empty folder.
2. Copy root `app/`, `lib/` and `public/` into it, retaining the overlay's connector helpers.
3. Create `.openai/`, copy `hosting.example.json` to `.openai/hosting.json`, and use a Sites
   project ID returned by the native Sites tools. The original deployment's ID,
   credentials, API key and user database are intentionally excluded.
4. Install the locked dependencies with `npm ci`, then `npm run build`.
5. Use the Codex Sites plugin workflow to synchronize source, package and deploy.
   Set `PUBLIC_DEMO=true` and the secret `TYPESAFE_API_KEY` through Sites runtime tools.

Sites applies the retained Drizzle migrations and supplies the D1 binding.
Keep applied migrations unchanged. The ordinary Cloudflare Worker path uses
root `migrations/` instead. Both schemas contain the same rooms table.

The unmodified Sites scaffold and build plugin remain independently licensed;
see `build/sites-vite-plugin.LICENSE` (OpenAI MIT). Dependencies keep their own
licenses. MergePoll application changes retain the root LICENSE. This overlay
is build source, not a second app or a bundle of hosting credentials.
