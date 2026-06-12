# ── Base ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── Install dependencies ───────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo
# Copy manifests only — layer-cached until deps change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json         ./apps/api/
COPY packages/config/package.json  ./packages/config/
COPY packages/schemas/package.json ./packages/schemas/
RUN pnpm install --frozen-lockfile

# ── Build API ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules                        ./node_modules
COPY --from=deps /repo/apps/api/node_modules               ./apps/api/node_modules
COPY --from=deps /repo/packages/config/node_modules        ./packages/config/node_modules
COPY --from=deps /repo/packages/schemas/node_modules       ./packages/schemas/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api      ./apps/api
COPY packages/config  ./packages/config
COPY packages/schemas ./packages/schemas
# Compile TypeScript → dist/
RUN pnpm --filter=api build
# Bundle app + all production node_modules (workspace deps included) into /standalone
RUN pnpm --filter=api --prod deploy /standalone

# ── Production runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Standalone contains package.json + flat node_modules (workspace deps resolved)
COPY --from=builder /standalone .
# Compiled JS lives outside the standalone deploy dir — copy it in
COPY --from=builder /repo/apps/api/dist ./dist

EXPOSE 3000
CMD ["node", "dist/app.js"]
