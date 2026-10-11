# Security and privacy

Report vulnerabilities privately to **[perperwtl@gmail.com](mailto:perperwtl@gmail.com)**.
Include affected versions, steps to reproduce and expected impact. Do not post
credentials, participant content or exploit details in a public issue. There is
no promised response time or bounty program.

MergePoll is an experimental, single-room prototype. Only the latest version
on `main` is maintained; stable releases and production support are not promised.

## Before hosting

- Configure a long, random `ORGANIZER_TOKEN` as a Worker secret. Never put it in
  a URL, frontend environment variable or repository. Login uses a signed,
  HTTP-only session cookie that expires after 12 hours.
- Keep `LOCAL_DEMO` set to `false` for deployed Workers. The development server
  enables a localhost sandbox only when no organizer token is configured.
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
