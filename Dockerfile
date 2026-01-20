# ---- deps ----
FROM node:24.11.0-alpine AS deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:24.11.0-alpine AS builder
WORKDIR /app
RUN corepack enable

# deps para build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY . .

# Build arg para inyectar en Next (se hornea en el bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm build

# ---- run ----
FROM node:24.11.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# Manifests para instalar solo prod deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Artefactos necesarios para ejecutar next start
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next


ENV PORT=3001
ENV HOSTNAME=0.0.0.0
EXPOSE 3001

CMD ["pnpm", "start"]
