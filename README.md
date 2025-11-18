# 🎮 Gamification & Loyalty Engine

A production-ready, centralized gamification and loyalty platform that enables any application to implement points, badges, levels, and tier systems through a simple REST API.

## 📋 Overview

This engine provides a complete gamification infrastructure that can be integrated into multiple applications (marketplaces, learning platforms, community apps, etc.) to deliver engaging user experiences through:

- **Points System** - Award and track points for user actions with configurable rules and multipliers
- **Badge System** - Define and automatically grant achievement badges based on criteria
- **Level Progression** - Automatic leveling based on points thresholds
- **Loyalty Tiers** - Bronze, Silver, Gold, Platinum tiers with customizable requirements
- **Multi-tenancy** - Isolated programs for each application with independent configurations
- **Real-time Processing** - Immediate point calculation and badge granting
- **Admin Dashboard** - Full-featured UI for managing programs, events, badges, and users

## 🏗️ Tech Stack

### Backend
- **NestJS** - Modern TypeScript framework
- **Prisma** - Type-safe ORM with PostgreSQL
- **Redis** - High-performance caching layer
- **Swagger** - Auto-generated API documentation
- **Jest** - Comprehensive testing framework

### Admin UI
- **Next.js 14** - React framework with App Router
- **TypeScript** - End-to-end type safety
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client

### Infrastructure
- **Docker & Docker Compose** - Containerized deployment
- **PostgreSQL 15** - Relational database
- **Redis 7** - In-memory cache

## 📊 Domain Model

```
Program (Gamification Instance)
  ├── EventDefinitions (purchase, login, referral, etc.)
  ├── BadgeDefinitions (achievements with criteria)
  ├── UserAccounts (user progress within program)
  │     ├── points (total points earned)
  │     ├── level (1-5+ based on thresholds)
  │     ├── tier (bronze/silver/gold/platinum)
  │     └── UserBadges (earned achievements)
  └── EarnEvents (history of all point-earning actions)
```

### Core Entities

- **Program**: Isolated gamification instance per application
- **UserAccount**: User's progress within a program (points, level, tier)
- **EventDefinition**: Rules for point-earning events
- **EarnEvent**: Historical record of points earned
- **BadgeDefinition**: Achievement criteria and metadata
- **UserBadge**: Badge earned by a user

### Key Relationships

- One Program has many UserAccounts, EventDefinitions, and BadgeDefinitions
- One UserAccount has many EarnEvents and UserBadges
- Badge granting is automatic based on criteria evaluation

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git**

### Quick Start (Development)

1. **Clone and install dependencies**

```bash
git clone <repository-url>
cd gamification-loyalty-engine
npm install
```

2. **Start databases**

```bash
npm run docker:up
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

3. **Set up the backend**

```bash
# Generate Prisma client
cd backend
npm run prisma:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

4. **Start development servers**

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Admin UI
cd admin
npm run dev
```

5. **Access the applications**

- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Admin Dashboard**: http://localhost:3001

### Quick Start (Docker - Full Stack)

```bash
# Build and start all services
docker-compose up -d

# Run migrations inside container
docker exec gamification-backend npx prisma migrate deploy

# Seed demo data
docker exec gamification-backend npm run db:seed

# View logs
docker-compose logs -f
```

Access:
- **Backend API**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001

## 🎯 Example Flow (Vertical Slice)

This implementation includes a complete, working vertical slice demonstrating all core functionality:

### Demo Program: `demo-rewards`

**Event Definitions:**
- `purchase` - 10 base points (1.5x for orders > $100, 2x for orders > $500)
- `referral` - 50 points
- `daily_login` - 5 points

**Badge Definitions:**
- `first_purchase` - Complete 1 purchase
- `points_100` - Reach 100 total points
- `super_referrer` - Complete 5 referrals

**Demo Users:**
- `demo_user_1` - 150 points, Level 2, Bronze tier
- `demo_user_2` - 620 points, Level 4, Silver tier
- `demo_user_3` - 1800 points, Level 5, Gold tier

### Testing the Vertical Slice

#### 1. View Demo User Data

```bash
curl http://localhost:3000/users/demo-rewards/demo_user_1 | jq
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "externalUserId": "demo_user_1",
    "points": 150,
    "level": 2,
    "tier": "bronze",
    "badges": [
      {
        "key": "first_purchase",
        "name": "First Purchase",
        "description": "Made your first purchase",
        "grantedAt": "2024-01-15T10:30:00Z"
      },
      {
        "key": "points_100",
        "name": "100 Points",
        "description": "Earned 100 points",
        "grantedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### 2. Create a New Event

```bash
curl -X POST http://localhost:3000/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "programKey": "demo-rewards",
    "externalUserId": "demo_user_1",
    "eventKey": "purchase",
    "meta": {
      "amount": 150,
      "orderId": "order_12345"
    }
  }' | jq
```

Expected response:
```json
{
  "success": true,
  "result": {
    "userAccountId": "clx...",
    "pointsEarned": 15,
    "totalPoints": 165,
    "previousLevel": 2,
    "newLevel": 2,
    "leveledUp": false,
    "previousTier": "bronze",
    "newTier": "bronze",
    "tierChanged": false,
    "badgesGranted": []
  }
}
```

#### 3. List All Users (Leaderboard)

```bash
curl http://localhost:3000/users/demo-rewards/list | jq
```

#### 4. View Program Configuration

```bash
curl http://localhost:3000/programs/demo-rewards | jq
```

#### 5. Use Admin UI

1. Open http://localhost:3001
2. Click on "Demo Rewards Program"
3. View:
   - **Events tab**: See all event definitions
   - **Badges tab**: See all badge definitions with earn counts
   - **Users tab**: See leaderboard with points, levels, and tiers
4. Create a new event or badge to see the system in action

### End-to-End Flow Demo

```bash
# 1. Create a new user by triggering an event
curl -X POST http://localhost:3000/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "programKey": "demo-rewards",
    "externalUserId": "new_user_123",
    "eventKey": "purchase",
    "meta": { "amount": 50 }
  }'

# 2. Check the user was created with points
curl http://localhost:3000/users/demo-rewards/new_user_123

# 3. Trigger more events to earn a badge
for i in {1..5}; do
  curl -X POST http://localhost:3000/events/ingest \
    -H "Content-Type: application/json" \
    -d "{
      \"programKey\": \"demo-rewards\",
      \"externalUserId\": \"new_user_123\",
      \"eventKey\": \"daily_login\",
      \"meta\": {}
    }"
done

# 4. View updated user with badges
curl http://localhost:3000/users/demo-rewards/new_user_123

# 5. Check event history
curl "http://localhost:3000/users/demo-rewards/new_user_123/history?limit=10"
```

## 🔧 Development

### Available Scripts

**Root level:**
```bash
npm run dev              # Start databases + backend
npm run build            # Build all packages
npm run test             # Run all tests
npm run lint             # Lint all packages
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed demo data
npm run docker:up        # Start databases
npm run docker:down      # Stop databases
npm run prisma:studio    # Open Prisma Studio
```

**Backend:**
```bash
cd backend
npm run dev              # Start with hot reload
npm run build            # Build for production
npm run start:prod       # Start production build
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run lint             # Lint and auto-fix
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
npm run prisma:studio    # Database GUI
```

**Admin:**
```bash
cd admin
npm run dev              # Start with hot reload
npm run build            # Build for production
npm run start            # Start production build
npm run lint             # Lint code
npm run type-check       # Type check without emit
```

### Database Migrations

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npm run db:reset
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
cd backend
npx jest rules-engine.service.spec.ts
```

### Linting and Formatting

```bash
# Lint all packages
npm run lint

# Format backend code
cd backend
npm run format
```

## 🧪 Testing

The backend includes comprehensive unit tests for core business logic:

- **Rules Engine Tests** (`rules-engine.service.spec.ts`)
  - Basic point calculation
  - Level progression
  - Tier changes
  - Point multipliers based on conditions
  - Automatic badge granting
  - Event count badge criteria
  - Total points badge criteria

Run tests:
```bash
cd backend
npm test
```

Coverage report:
```bash
npm run test:cov
open coverage/lcov-report/index.html
```

## 🌐 API Reference

### Core Endpoints

#### Ingest Event
```
POST /events/ingest
```

Award points and process user progression.

**Request:**
```json
{
  "programKey": "my-program",
  "externalUserId": "user_123",
  "eventKey": "purchase",
  "meta": {
    "amount": 150,
    "productId": "prod_abc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "pointsEarned": 15,
    "totalPoints": 165,
    "leveledUp": true,
    "newLevel": 3,
    "tierChanged": false,
    "badgesGranted": [
      {
        "badgeKey": "points_100",
        "badgeName": "100 Points"
      }
    ]
  }
}
```

#### Get User Account
```
GET /users/:programKey/:externalUserId
```

#### List Users (Leaderboard)
```
GET /users/:programKey/list?limit=50&offset=0
```

#### Get User History
```
GET /users/:programKey/:externalUserId/history?limit=50
```

#### Program Management
```
GET    /programs
POST   /programs
GET    /programs/:key
PUT    /programs/:key
GET    /programs/:key/events
POST   /programs/:key/events
```

#### Badge Management
```
GET    /badges/:programKey
POST   /badges/:programKey
```

Full API documentation: http://localhost:3000/api/docs

## 📦 Integration Examples

### Node.js/TypeScript

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Track a purchase event
async function trackPurchase(userId: string, amount: number) {
  const response = await axios.post(`${API_URL}/events/ingest`, {
    programKey: 'marketplace-rewards',
    externalUserId: userId,
    eventKey: 'purchase',
    meta: { amount },
  });

  const result = response.data.result;

  // Handle leveling up
  if (result.leveledUp) {
    console.log(`User leveled up to level ${result.newLevel}!`);
  }

  // Handle new badges
  for (const badge of result.badgesGranted) {
    console.log(`User earned badge: ${badge.badgeName}`);
  }

  return result;
}

// Get user stats
async function getUserStats(userId: string) {
  const response = await axios.get(
    `${API_URL}/users/marketplace-rewards/${userId}`
  );
  return response.data.data;
}
```

### React Component

```typescript
import { useEffect, useState } from 'react';
import axios from 'axios';

export function UserLoyaltyCard({ userId }: { userId: string }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/users/demo-rewards/${userId}`)
      .then(res => setStats(res.data.data));
  }, [userId]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="loyalty-card">
      <h3>Your Rewards</h3>
      <div className="stats">
        <div>Points: {stats.points}</div>
        <div>Level: {stats.level}</div>
        <div>Tier: {stats.tier}</div>
      </div>
      <div className="badges">
        <h4>Badges ({stats.badges.length})</h4>
        {stats.badges.map(badge => (
          <div key={badge.key}>{badge.name}</div>
        ))}
      </div>
    </div>
  );
}
```

See `/examples/integration-example.ts` for more detailed examples.

## 🚢 Production Deployment

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
REDIS_HOST=redis.example.com
REDIS_PORT=6379
PORT=3000
NODE_ENV=production
ADMIN_URL=https://admin.example.com
```

**Admin (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker exec gamification-backend npx prisma migrate deploy

# Seed initial data (optional)
docker exec gamification-backend npm run db:seed
```

### Manual Deployment

1. **Build Backend:**
```bash
cd backend
npm run build
```

2. **Build Admin:**
```bash
cd admin
npm run build
```

3. **Deploy to hosting:**
   - Backend: Node.js platform (AWS ECS, DigitalOcean Apps, Railway, etc.)
   - Admin: Static hosting or Node.js (Vercel, Netlify, etc.)
   - Database: Managed PostgreSQL (AWS RDS, DigitalOcean, Supabase, etc.)
   - Cache: Managed Redis (AWS ElastiCache, Redis Cloud, Upstash, etc.)

## 🔮 Future Extensions

### Short Term
- [ ] Webhook notifications for level-ups and badge grants
- [ ] Streak tracking (consecutive days)
- [ ] Point expiration rules
- [ ] Badge images/icons support
- [ ] Leaderboard with time ranges (daily/weekly/monthly)

### Medium Term
- [ ] GraphQL API alongside REST
- [ ] Challenge system (time-limited goals)
- [ ] Team/group competitions
- [ ] Point redemption/rewards catalog
- [ ] Analytics dashboard

### Long Term
- [ ] AI-powered personalized challenges
- [ ] Social features (share badges, compete with friends)
- [ ] Mobile SDK (iOS/Android)
- [ ] Real-time websocket updates
- [ ] Multi-language support

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

---

**Built with:** NestJS • Prisma • PostgreSQL • Redis • Next.js • TypeScript • Docker
