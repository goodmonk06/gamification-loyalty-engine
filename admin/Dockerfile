# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY admin/package*.json ./admin/

# Install dependencies
RUN npm ci --workspace=admin

# Copy source code
COPY admin ./admin

# Build application
WORKDIR /app/admin
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
COPY admin/package*.json ./admin/
RUN npm ci --workspace=admin --omit=dev

# Copy built application
COPY --from=builder /app/admin/.next ./admin/.next
COPY --from=builder /app/admin/public ./admin/public
COPY --from=builder /app/admin/next.config.js ./admin/
COPY --from=builder /app/admin/package.json ./admin/

WORKDIR /app/admin

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "run", "start"]
