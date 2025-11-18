# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --workspace=backend

# Copy source code
COPY backend ./backend
COPY prisma ./backend/prisma

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --workspace=backend --omit=dev

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY backend/prisma ./backend/prisma

WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/docs', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "run", "start:prod"]
