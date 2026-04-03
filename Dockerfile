# ─── Server Build stage ──────────────────────────────────────────
FROM node:20-alpine AS server-builder
# Install Prisma dependencies for Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app/server
COPY server/package*.json ./
# Copy prisma directory before install to support postinstall
COPY server/prisma ./prisma/

# Install dependencies (skip scripts to avoid early build/generate)
RUN npm ci --foreground-scripts=false

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the server source
COPY server/ ./

# Build the application
RUN npm run build

# ─── Server Production stage ─────────────────────────────────────
FROM node:20-alpine AS server
# Install Prisma dependencies for Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app/server
COPY server/package*.json ./

# Install only production dependencies (skip scripts)
RUN npm ci --omit=dev --foreground-scripts=false

# Copy built assets and generated client from builder stage
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/server/node_modules/@prisma/client ./node_modules/@prisma/client

# Use Render's dynamic PORT or fallback to 8000
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

CMD ["node", "dist/index.js"]

# ─── Frontend Build stage ────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ARG NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK
RUN npm run build

# ─── Frontend Production stage ───────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/package*.json ./
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
