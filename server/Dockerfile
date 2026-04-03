# Build Stage
FROM node:20-slim AS builder

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files (including lock file)
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies (include devDependencies for tsc)
RUN npm install --include=dev --legacy-peer-deps --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the server source (respecting .dockerignore)
COPY . .

# Build the application (explicitly use npx and config for safety)
RUN npx tsc -p tsconfig.json

# Production Stage
FROM node:20-slim

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma/

# Install only production dependencies (skip scripts)
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

# Copy built assets and generated client from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Expose the port
EXPOSE 8000

# Start the application - running compiled code explicitly
CMD ["node", "dist/index.js"]
