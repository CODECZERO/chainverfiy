# ─── Server Build stage ──────────────────────────────────────────
FROM node:20-slim AS builder
# Install Prisma dependencies
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app/server
COPY server/package*.json ./
# Copy prisma directory before install to support postinstall
COPY server/prisma ./prisma/

# Install dependencies (include devDependencies for tsc)
RUN npm install --include=dev --legacy-peer-deps --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the server source
COPY server/ ./

# Build the application (explicitly use npx and config for safety)
RUN npx tsc -p tsconfig.json

# ─── Server Production stage ─────────────────────────────────────
FROM node:20-slim
# Install Prisma dependencies
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app/server
COPY server/package*.json ./

# Install only production dependencies (skip scripts)
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

# Copy built assets and generated client from builder stage
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma/client ./node_modules/@prisma/client

# Use Render's dynamic PORT or fallback to 8000
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

CMD ["node", "dist/index.js"]
