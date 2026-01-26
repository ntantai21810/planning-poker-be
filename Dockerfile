# Production Dockerfile for NestJS Backend
# Using Debian-based image for better Prisma compatibility
FROM node:20-slim AS builder

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3001

# Run migrations and start the application
ENTRYPOINT ["./docker-entrypoint.sh"]
