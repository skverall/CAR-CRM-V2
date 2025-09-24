# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY web/package.json ./web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/web
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /app ./
USER app
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]

