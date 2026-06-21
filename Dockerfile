# Multi-stage build for MedSage Backend
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build tools)
RUN npm ci

# Copy all source files needed for the build
COPY tsconfig.json ./
COPY index.html ./
COPY backend/ ./backend/
COPY src/ ./src/
COPY public/ ./public/

# Build TypeScript and Vite frontend
RUN npm run build

# Prune devDependencies for the runtime image
RUN npm prune --omit=dev

# Stage 2: Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy production node_modules and build output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run Node process
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start backend server
CMD ["node", "--import", "tsx", "backend/server.ts"]

