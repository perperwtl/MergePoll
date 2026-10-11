#!/bin/sh
set -eu
# Secrets are generated at container startup, never baked into an image layer.
node /app/docker/configure.mjs
./node_modules/.bin/wrangler d1 migrations apply mergepoll --local --persist-to /app/.wrangler/state --config /app/wrangler.jsonc
exec ./node_modules/.bin/wrangler dev --config /app/dist/server/wrangler.json --local --ip 0.0.0.0 --port 5173 --inspector-port 0 --persist-to /app/.wrangler/state
