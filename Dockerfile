# Multi-stage build for full-stack deployment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy frontend package files first
COPY frontend/package*.json ./frontend/

# Install frontend dependencies (including react-scripts)
RUN cd frontend && npm ci

# Copy frontend source code
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS runner

# Install sqlite3 and other runtime dependencies
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /app

# Copy backend dependencies and source
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend
COPY --from=builder /app/frontend/build ./public

# Create data directory for SQLite
RUN mkdir -p ./data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
