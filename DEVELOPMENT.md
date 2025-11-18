# Development Guide

## Project Structure

```
gamification-loyalty-engine/
├── backend/                   # NestJS API
│   ├── src/
│   │   ├── common/           # Shared utilities
│   │   │   ├── filters/      # Exception filters
│   │   │   └── interceptors/ # Response transformers
│   │   ├── events/           # Event ingestion
│   │   ├── users/            # User management
│   │   ├── programs/         # Program CRUD
│   │   ├── badges/           # Badge management
│   │   ├── rules-engine/     # Core business logic
│   │   ├── prisma/           # Database service
│   │   └── redis/            # Cache service
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Demo data
│   └── test/                 # Unit tests
├── admin/                     # Next.js Admin UI
│   └── src/
│       ├── app/              # Pages (App Router)
│       └── lib/              # API client
├── examples/                  # Integration examples
└── docker-compose.yml        # Full stack deployment

```

## Development Workflow

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Start databases
npm run docker:up

# Setup backend
cd backend
npm run prisma:generate
npm run db:migrate
npm run db:seed
```

### 2. Daily Development

```bash
# Terminal 1: Backend with hot reload
cd backend
npm run dev

# Terminal 2: Admin UI with hot reload
cd admin
npm run dev

# Terminal 3: Watch tests
cd backend
npm run test:watch
```

### 3. Making Changes

#### Adding a New Endpoint

1. Create DTO in `src/<module>/dto/`
2. Add controller method with Swagger decorators
3. Implement service logic
4. Write tests in `<module>.service.spec.ts`
5. Test via Swagger UI or curl

#### Adding a Database Field

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Update TypeScript interfaces
4. Update seed data if needed

#### Adding a New Module

```bash
cd backend
nest g module <module-name>
nest g controller <module-name>
nest g service <module-name>
```

### 4. Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# Specific test
npx jest rules-engine
```

### 5. Code Quality

```bash
# Lint and auto-fix
npm run lint

# Type check
cd admin
npm run type-check

# Format code
cd backend
npm run format
```

### 6. Database Management

```bash
# View data in browser
npm run prisma:studio

# Reset database (dev only)
npm run db:reset

# Create migration
cd backend
npx prisma migrate dev --name migration_name
```

## Debugging

### Backend

Add breakpoints in VS Code and use the Debug configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "cwd": "${workspaceFolder}/backend",
  "console": "integratedTerminal"
}
```

### Database

```bash
# Check database connection
docker exec -it gamification-db psql -U gamification -d gamification_loyalty

# View table data
SELECT * FROM "Program";
SELECT * FROM "UserAccount";
```

### Redis

```bash
# Connect to Redis
docker exec -it gamification-redis redis-cli

# View cached data
KEYS gam:*
GET gam:program:demo-rewards
```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Database Connection Error

```bash
# Restart database
docker-compose restart postgres

# Check DATABASE_URL in .env
```

### Prisma Client Out of Sync

```bash
cd backend
npm run prisma:generate
```

### Cache Issues

```bash
# Clear Redis cache
docker exec gamification-redis redis-cli FLUSHALL

# Restart Redis
docker-compose restart redis
```

## Performance Monitoring

### Query Performance

```bash
# Enable Prisma query logging
DEBUG=prisma:query npm run dev
```

### Redis Hit Rate

```bash
docker exec gamification-redis redis-cli INFO stats | grep keyspace
```

## Deployment Checklist

- [ ] Run tests: `npm test`
- [ ] Lint code: `npm run lint`
- [ ] Build backend: `cd backend && npm run build`
- [ ] Build admin: `cd admin && npm run build`
- [ ] Update environment variables
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Test endpoints
- [ ] Monitor logs

## Useful Commands

```bash
# Generate Prisma ERD
npx prisma generate
npx prisma-erd-generator

# Export database schema
pg_dump -U gamification gamification_loyalty > backup.sql

# Import database
psql -U gamification gamification_loyalty < backup.sql

# Docker cleanup
docker system prune -a
docker volume prune
```
