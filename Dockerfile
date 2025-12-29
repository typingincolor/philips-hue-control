# Home Control - Production Docker Image
# Multi-stage build for smaller final image

# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY frontend/ ./frontend/
COPY backend/ ./backend/
COPY config.yaml ./

# Build frontend (outputs to frontend/dist)
RUN npm run build --workspace=frontend

# Copy frontend build to backend/public
RUN npm run build --workspace=backend

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install wget for health checks and create non-root user
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files (need all workspaces for npm resolution)
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install production dependencies only
# This installs backend deps + root deps (amazon-cognito-identity-js)
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built backend and frontend
COPY --from=builder /app/backend/ ./backend/
COPY config.yaml ./

# Create data directory and set ownership for all files
RUN mkdir -p /app/backend/data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (default from config.yaml)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
WORKDIR /app/backend
CMD ["node", "server.js"]
