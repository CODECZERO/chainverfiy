# ─── Build Stage ──────────────────────────────────────────────────
FROM node:20-slim AS builder

# Install system dependencies (Prisma needs openssl)
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./
COPY prisma.config.ts ./

# Copy prisma schema early to allow prisma generate to be cached
COPY prisma ./prisma/

# Install dependencies (include devDependencies for tsc)
# --ignore-scripts prevents prisma post-install from running (we run it explicitly)
RUN npm install --include=dev --legacy-peer-deps --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the server source (respects .dockerignore)
COPY . .

# Build the application
RUN npx tsc -p tsconfig.json

# ─── Production Stage ─────────────────────────────────────────────
FROM node:20-slim

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

# Copy built assets and generated client from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set production defaults
ENV NODE_ENV=production
ENV PORT=10000 
# Render default port is usually 10000 if not specified

# Expose the service port
EXPOSE 10000

# Start server
CMD ["node", "dist/index.js"]
