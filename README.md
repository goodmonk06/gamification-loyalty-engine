# 🎮 Gamification & Loyalty Engine

A powerful, centralized gamification and loyalty system that any application can integrate to provide:
- **Points System** - Award points for user actions
- **Badges** - Unlock achievements based on criteria
- **Levels** - Progress through levels as points accumulate
- **Loyalty Tiers** - Bronze, Silver, Gold, Platinum tiers

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Your Applications                       │
│  (marketplace, learning-platform, guild-platform, etc)  │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP API Calls
                 ▼
┌─────────────────────────────────────────────────────────┐
│          Gamification & Loyalty Engine (NestJS)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Rules Engine │  │ Points Mgmt  │  │ Badge System │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────┬───────────────────────────────────┬───────────┘
          │                                   │
          ▼                                   ▼
    ┌──────────┐                         ┌────────┐
    │PostgreSQL│                         │ Redis  │
    └──────────┘                         └────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd gamification-loyalty-engine
npm install
```

2. **Start databases:**

```bash
npm run docker:up
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

3. **Set up the backend:**

```bash
cd backend
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. **Start the backend:**

```bash
npm run dev
```

Backend runs on http://localhost:3000
API Docs: http://localhost:3000/api/docs

5. **Start the admin UI:**

```bash
cd admin
cp .env.local.example .env.local
npm run dev
```

Admin UI runs on http://localhost:3001

## 📚 Core Concepts

### Programs

A **Program** is an isolated gamification instance. Each application can have its own program:
- `marketplace-rewards` - For your marketplace app
- `learning-camp-xp` - For your learning platform
- `guild-achievements` - For your guild platform

### Event Definitions

**Events** are actions users take that earn points. Examples:
- `purchase` - User makes a purchase (10 points)
- `course_completed` - User completes a course (50 points)
- `daily_login` - User logs in (5 points)
- `post_created` - User creates a post (15 points)

### Badge Definitions

**Badges** are achievements users unlock. Criteria types:
- `event_count` - Trigger an event N times (e.g., "5 purchases")
- `total_points` - Reach a points threshold (e.g., "1000 points")

### User Accounts

Each user in your app gets a **UserAccount** per program with:
- `points` - Total points earned
- `level` - Current level (1-5+ based on points)
- `tier` - Loyalty tier (bronze/silver/gold/platinum)
- `badges` - Array of earned badges

## 🔌 Integration Examples

### Example 1: Marketplace Integration

```typescript
// marketplace-backend/src/services/gamification.service.ts
import axios from 'axios';

const GAMIFICATION_API = 'http://localhost:3000';
const PROGRAM_KEY = 'marketplace-rewards';

export class GamificationService {
  async trackPurchase(userId: string, orderAmount: number) {
    try {
      const response = await axios.post(`${GAMIFICATION_API}/events/ingest`, {
        programKey: PROGRAM_KEY,
        externalUserId: userId,
        eventKey: 'purchase',
        meta: {
          amount: orderAmount,
        },
      });

      const result = response.data.result;

      // Notify user if they leveled up or earned badges
      if (result.leveledUp) {
        await this.notifyUser(userId, `Congrats! You reached level ${result.newLevel}!`);
      }

      if (result.badgesGranted.length > 0) {
        for (const badge of result.badgesGranted) {
          await this.notifyUser(userId, `You earned the "${badge.badgeName}" badge! 🏆`);
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }

  async trackProductReview(userId: string) {
    await axios.post(`${GAMIFICATION_API}/events/ingest`, {
      programKey: PROGRAM_KEY,
      externalUserId: userId,
      eventKey: 'product_review',
      meta: {},
    });
  }

  async trackReferral(referrerId: string, newUserId: string) {
    await axios.post(`${GAMIFICATION_API}/events/ingest`, {
      programKey: PROGRAM_KEY,
      externalUserId: referrerId,
      eventKey: 'referral',
      meta: {
        referredUser: newUserId,
      },
    });
  }

  async getUserStats(userId: string) {
    const response = await axios.get(
      `${GAMIFICATION_API}/users/${PROGRAM_KEY}/${userId}`
    );
    return response.data;
  }
}
```

**Usage in your marketplace:**

```typescript
// When a user completes a purchase
await gamificationService.trackPurchase(user.id, order.totalAmount);

// When a user reviews a product
await gamificationService.trackProductReview(user.id);

// Display user's loyalty status
const userStats = await gamificationService.getUserStats(user.id);
console.log(`${user.name} has ${userStats.points} points (${userStats.tier} tier)`);
```

### Example 2: Learning Platform Integration

```typescript
// async-learning-camp-platform/src/lib/gamification.ts
import axios from 'axios';

const GAMIFICATION_API = 'http://localhost:3000';
const PROGRAM_KEY = 'learning-camp-xp';

export async function trackCourseCompletion(
  studentId: string,
  courseId: string,
  courseDifficulty: 'beginner' | 'intermediate' | 'advanced'
) {
  const response = await axios.post(`${GAMIFICATION_API}/events/ingest`, {
    programKey: PROGRAM_KEY,
    externalUserId: studentId,
    eventKey: 'course_completed',
    meta: {
      courseId,
      difficulty: courseDifficulty,
    },
  });

  return response.data.result;
}

export async function trackQuizPass(studentId: string, quizScore: number) {
  await axios.post(`${GAMIFICATION_API}/events/ingest`, {
    programKey: PROGRAM_KEY,
    externalUserId: studentId,
    eventKey: 'quiz_passed',
    meta: {
      score: quizScore,
    },
  });
}

export async function trackDailyLogin(studentId: string) {
  await axios.post(`${GAMIFICATION_API}/events/ingest`, {
    programKey: PROGRAM_KEY,
    externalUserId: studentId,
    eventKey: 'daily_login',
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getStudentProgress(studentId: string) {
  const response = await axios.get(
    `${GAMIFICATION_API}/users/${PROGRAM_KEY}/${studentId}`
  );

  return {
    xp: response.data.points,
    level: response.data.level,
    badges: response.data.badges,
    tier: response.data.tier,
  };
}

export async function getLeaderboard() {
  const response = await axios.get(
    `${GAMIFICATION_API}/users/${PROGRAM_KEY}/list?limit=100`
  );

  return response.data.users.map((user: any) => ({
    studentId: user.externalUserId,
    xp: user.points,
    level: user.level,
    badges: user.badgeCount,
  }));
}
```

**React Component Example:**

```typescript
// async-learning-camp-platform/src/components/StudentProfile.tsx
import { useEffect, useState } from 'react';
import { getStudentProgress } from '@/lib/gamification';

export function StudentProfile({ studentId }: { studentId: string }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    getStudentProgress(studentId).then(setProgress);
  }, [studentId]);

  if (!progress) return <div>Loading...</div>;

  return (
    <div className="student-gamification">
      <h3>Your Learning Progress</h3>
      <div className="stats">
        <div className="stat">
          <span className="label">XP</span>
          <span className="value">{progress.xp}</span>
        </div>
        <div className="stat">
          <span className="label">Level</span>
          <span className="value">{progress.level}</span>
        </div>
        <div className="stat">
          <span className="label">Tier</span>
          <span className="value">{progress.tier}</span>
        </div>
      </div>
      <div className="badges">
        <h4>Badges Earned ({progress.badges.length})</h4>
        {progress.badges.map((badge) => (
          <div key={badge.key} className="badge">
            {badge.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Guild Platform Integration

```typescript
// nova-agora-guild-platform/src/services/achievements.service.ts
import axios from 'axios';

const GAMIFICATION_API = 'http://localhost:3000';
const PROGRAM_KEY = 'guild-achievements';

export class AchievementsService {
  async trackPostCreated(userId: string, postId: string) {
    await axios.post(`${GAMIFICATION_API}/events/ingest`, {
      programKey: PROGRAM_KEY,
      externalUserId: userId,
      eventKey: 'post_created',
      meta: { postId },
    });
  }

  async trackCommentAdded(userId: string, commentId: string) {
    await axios.post(`${GAMIFICATION_API}/events/ingest`, {
      programKey: PROGRAM_KEY,
      externalUserId: userId,
      eventKey: 'comment_added',
      meta: { commentId },
    });
  }

  async trackQuestCompleted(userId: string, questId: string, difficulty: number) {
    const response = await axios.post(`${GAMIFICATION_API}/events/ingest`, {
      programKey: PROGRAM_KEY,
      externalUserId: userId,
      eventKey: 'quest_completed',
      meta: {
        questId,
        difficulty,
      },
    });

    return response.data.result;
  }

  async trackEventParticipation(userId: string, eventId: string) {
    await axios.post(`${GAMIFICATION_API}/events/ingest`, {
      programKey: PROGRAM_KEY,
      externalUserId: userId,
      eventKey: 'event_participated',
      meta: { eventId },
    });
  }

  async getMemberRank(userId: string) {
    const response = await axios.get(
      `${GAMIFICATION_API}/users/${PROGRAM_KEY}/${userId}`
    );

    return {
      honorPoints: response.data.points,
      rank: response.data.level,
      prestigeTier: response.data.tier,
      achievements: response.data.badges,
    };
  }

  async getGuildLeaderboard(limit = 50) {
    const response = await axios.get(
      `${GAMIFICATION_API}/users/${PROGRAM_KEY}/list?limit=${limit}`
    );

    return response.data.users;
  }
}
```

## 📊 Admin UI

The admin dashboard (http://localhost:3001) allows you to:

1. **Manage Programs**
   - Create new programs for different apps
   - Configure level thresholds
   - Set up tier requirements

2. **Define Events**
   - Create event types (purchase, login, etc.)
   - Set point rewards
   - Add multiplier rules

3. **Create Badges**
   - Design achievement badges
   - Set unlock criteria
   - Track badge earnings

4. **View Users**
   - See all user accounts
   - Check points, levels, tiers
   - View earned badges

## 🔧 API Endpoints

### Event Ingestion

```http
POST /events/ingest
Content-Type: application/json

{
  "programKey": "marketplace-rewards",
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
    "userAccountId": "clx...",
    "pointsEarned": 15,
    "totalPoints": 165,
    "previousLevel": 1,
    "newLevel": 2,
    "leveledUp": true,
    "previousTier": "bronze",
    "newTier": "bronze",
    "tierChanged": false,
    "badgesGranted": [
      {
        "badgeId": "clx...",
        "badgeKey": "first_purchase",
        "badgeName": "First Purchase"
      }
    ]
  }
}
```

### Get User Account

```http
GET /users/{programKey}/{externalUserId}
```

**Response:**
```json
{
  "id": "clx...",
  "externalUserId": "user_123",
  "points": 165,
  "level": 2,
  "tier": "bronze",
  "badges": [
    {
      "key": "first_purchase",
      "name": "First Purchase",
      "description": "Made your first purchase",
      "grantedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### List Users (Leaderboard)

```http
GET /users/{programKey}/list?limit=50&offset=0
```

### Create Program

```http
POST /programs
Content-Type: application/json

{
  "key": "my-app-rewards",
  "name": "My App Rewards",
  "description": "Loyalty program for My App",
  "config": {
    "levelThresholds": [
      { "level": 1, "minPoints": 0 },
      { "level": 2, "minPoints": 100 },
      { "level": 3, "minPoints": 250 }
    ],
    "tierThresholds": [
      { "tier": "bronze", "minPoints": 0 },
      { "tier": "silver", "minPoints": 500 },
      { "tier": "gold", "minPoints": 1500 }
    ]
  }
}
```

### Create Event Definition

```http
POST /programs/{programKey}/events
Content-Type: application/json

{
  "key": "purchase",
  "description": "User made a purchase",
  "rules": {
    "basePoints": 10,
    "multipliers": [
      {
        "condition": "amount > 100",
        "multiplier": 1.5
      }
    ]
  }
}
```

### Create Badge Definition

```http
POST /badges/{programKey}
Content-Type: application/json

{
  "key": "super_shopper",
  "name": "Super Shopper",
  "description": "Made 10 purchases",
  "criteria": {
    "type": "event_count",
    "eventKey": "purchase",
    "count": 10
  }
}
```

## 🧪 Testing

Example test script:

```bash
cd backend

# Create a test program
curl -X POST http://localhost:3000/programs \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test-program",
    "name": "Test Program",
    "description": "Testing the engine"
  }'

# Create an event definition
curl -X POST http://localhost:3000/programs/test-program/events \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test_action",
    "description": "Test action",
    "rules": { "basePoints": 20 }
  }'

# Ingest an event for a user
curl -X POST http://localhost:3000/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "programKey": "test-program",
    "externalUserId": "test_user_1",
    "eventKey": "test_action",
    "meta": {}
  }'

# Get user stats
curl http://localhost:3000/users/test-program/test_user_1
```

## 🗄️ Database Schema

```prisma
model Program {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  description String?
  configJson  Json     // Level/tier thresholds
}

model UserAccount {
  id             String   @id @default(cuid())
  externalUserId String
  programId      String
  points         Int      @default(0)
  level          Int      @default(1)
  tier           String   @default("bronze")
  metaJson       Json     @default("{}")
}

model EventDefinition {
  id          String   @id @default(cuid())
  programId   String
  key         String
  description String?
  rulesJson   Json     // Points rules
}

model EarnEvent {
  id            String   @id @default(cuid())
  programId     String
  userAccountId String
  eventKey      String
  pointsDelta   Int
  metaJson      Json
  createdAt     DateTime @default(now())
}

model BadgeDefinition {
  id           String   @id @default(cuid())
  programId    String
  key          String
  name         String
  description  String?
  criteriaJson Json     // Unlock criteria
}

model UserBadge {
  id            String   @id @default(cuid())
  userAccountId String
  badgeId       String
  grantedAt     DateTime @default(now())
}
```

## 🎯 Use Cases

### E-Commerce / Marketplace
- Points for purchases
- Badges for review milestones
- VIP tiers with benefits
- Referral rewards

### Learning Platforms
- XP for course completion
- Achievement badges
- Streak tracking
- Leaderboards

### Community / Social
- Karma points
- Contributor badges
- Reputation levels
- Quest completion

### SaaS Products
- Usage rewards
- Feature unlocks
- Engagement tracking
- Advocacy programs

## 🚀 Production Deployment

1. **Environment Variables:**

```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_HOST=redis-host
REDIS_PORT=6379
PORT=3000
NODE_ENV=production

# Admin (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

2. **Build & Deploy:**

```bash
# Build backend
cd backend
npm run build
npm run start:prod

# Build admin UI
cd admin
npm run build
npm run start
```

3. **Infrastructure:**
- Host backend on any Node.js platform (Heroku, AWS, DigitalOcean, etc.)
- Deploy admin UI to Vercel, Netlify, or similar
- Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
- Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with:** NestJS, Prisma, PostgreSQL, Redis, Next.js, TypeScript
