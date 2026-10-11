FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV WRANGLER_SEND_METRICS=false CLOUDFLARE_CF_FETCH_ENABLED=false
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
LABEL org.opencontainers.image.source="https://github.com/perperwtl/MergePoll" org.opencontainers.image.licenses="AGPL-3.0-only"
ENV NODE_ENV=production WRANGLER_SEND_METRICS=false CLOUDFLARE_CF_FETCH_ENABLED=false WRANGLER_WRITE_LOGS=false
# workerd verifies outbound TLS (e.g. the TypeSafe API) against the system CA store.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json wrangler.jsonc LICENSE THIRD_PARTY_NOTICES.md README.md ./
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node docker ./docker
RUN mkdir -p .wrangler/state && chown -R node:node .wrangler
USER node
EXPOSE 5173
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 CMD node -e "fetch('http://127.0.0.1:5173/api/room').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/bin/sh", "/app/docker/entrypoint.sh"]
