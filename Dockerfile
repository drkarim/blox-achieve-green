# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install all dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build: Vite compiles the frontend → dist/public
#        esbuild compiles the server  → dist/index.js
RUN pnpm run build

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy manifests and install production-only deps
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy drizzle migrations so the migrate script can run them at startup
COPY drizzle/ ./drizzle/
COPY drizzle.config.ts ./

# Copy the migration startup script
COPY scripts/ ./scripts/

# Expose the port Railway will route traffic to
EXPOSE 3000

# Run DB migrations then start the server
CMD ["sh", "-c", "node scripts/migrate.mjs && node dist/index.js"]
