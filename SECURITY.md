# Security and privacy

For questions, bug reports and feature requests, use
[GitHub Issues](https://github.com/perperwtl/MergePoll/issues).

For security concerns, open an issue with a brief, sanitized description and
affected versions. Do not include credentials, participant content, personal
data or actionable exploit details in a public issue. If sensitive details are
needed, ask the maintainer to arrange a private reporting channel before sharing
them. There is no promised response time or bounty program.

MergePoll is an experimental prototype. Only the latest version
on `main` is maintained; stable releases and production support are not promised.

## Before hosting

- Configure a long, random `ORGANIZER_TOKEN` in Docker's `.env`. Never put it
  in a URL, frontend environment variable or repository. Login uses a signed,
  HTTP-only session cookie that expires after 12 hours.
- Docker enables local organizer access only when no organizer token is
  configured.
- Add deployment-level rate limiting for login and participant submissions,
  spending controls and event moderation before opening a demo to a large audience.
- Provide your own TypeSafe key and check its service terms and data practices.
  Questions and event context are sent to TypeSafe when grouping runs.
- Decide how long to retain event data and communicate that policy to participants.
  This prototype has no retention scheduler or participant deletion workflow.

Questions are anonymous in the displayed queue, not guaranteed anonymous to
the host or model provider. Votes are deduplicated by a browser token, not a
verified person. Clearing storage, using another browser, or impersonating a
token can circumvent that mechanism. Do not use it for elections or binding votes.

The source-sharing license requires code and safe configuration examples, never
secrets or user data. `.dev.vars`, environment files and local D1 state are ignored.

## Public experiment

The hosted experiment opts into `PUBLIC_DEMO=true`. An opaque HttpOnly cookie
gives each browser a private climate walkthrough sandbox and organizer access to
the custom task it creates. Custom tasks use random `/room/<UUID>` participant
links; holding the link allows asking and voting, not organizer actions. The
normal shared room stays behind organizer authentication on deployments without
that flag.

The demo uses its own server key and limits each task to 100 questions and 40
live grouping attempts, at least one minute apart. Atomic daily counters in D1
cap all browsers at 500 attempts and 100,000 new pair comparisons (UTC). Each
browser can hold one active custom task; tasks expire 24 hours after creation
and an hourly cleanup deletes expired rows. Clearing cookies bypasses the
per-browser limit but not the shared daily counters. This bounds requests rather
than guaranteeing a monetary spending cap. Legacy personal demo rooms have no
automatic expiry. Use synthetic questions only. See [LIVE_DEMO.md](docs/LIVE_DEMO.md).

Docker publishes its port on host loopback by default, persists D1 in a named
volume and excludes secrets from the image build context. Runtime secrets live
inside the container; hosts with Docker access can read them.
