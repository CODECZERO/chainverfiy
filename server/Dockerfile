# Build Stage
FROM node:20-slim AS builder

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
# We use --foreground-scripts=false to prevent postinstall from running 
# before we are ready or if it fails due to missing source files.
RUN npm install --legacy-peer-deps --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy source code and config
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-slim

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema for production client generation if needed (though already generated in builder)
COPY prisma ./prisma/

# Install only production dependencies
# Skip scripts to avoid postinstall issues
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the application - running compiled code explicitly
CMD ["node", "dist/index.js"]
