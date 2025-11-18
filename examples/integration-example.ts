/**
 * Example Integration - Gamification & Loyalty Engine
 *
 * This file demonstrates how to integrate the gamification engine
 * into your application.
 */

import axios from 'axios';

// Configuration
const GAMIFICATION_API_URL = 'http://localhost:3000';
const PROGRAM_KEY = 'my-app-rewards';

// ============================================================================
// SETUP: First-time configuration
// ============================================================================

export async function setupProgram() {
  // 1. Create your program
  await axios.post(`${GAMIFICATION_API_URL}/programs`, {
    key: PROGRAM_KEY,
    name: 'My App Rewards',
    description: 'Loyalty program for My App users',
    config: {
      levelThresholds: [
        { level: 1, minPoints: 0 },
        { level: 2, minPoints: 100 },
        { level: 3, minPoints: 250 },
        { level: 4, minPoints: 500 },
        { level: 5, minPoints: 1000 },
      ],
      tierThresholds: [
        { tier: 'bronze', minPoints: 0 },
        { tier: 'silver', minPoints: 500 },
        { tier: 'gold', minPoints: 1500 },
        { tier: 'platinum', minPoints: 3000 },
      ],
    },
  });

  // 2. Define events
  const events = [
    {
      key: 'signup',
      description: 'User signed up',
      rules: { basePoints: 50 },
    },
    {
      key: 'purchase',
      description: 'User made a purchase',
      rules: {
        basePoints: 10,
        multipliers: [
          { condition: 'amount > 100', multiplier: 1.5 },
          { condition: 'amount > 500', multiplier: 2.0 },
        ],
      },
    },
    {
      key: 'daily_login',
      description: 'User logged in',
      rules: { basePoints: 5 },
    },
    {
      key: 'referral',
      description: 'User referred a friend',
      rules: { basePoints: 100 },
    },
    {
      key: 'profile_complete',
      description: 'User completed profile',
      rules: { basePoints: 25 },
    },
  ];

  for (const event of events) {
    await axios.post(
      `${GAMIFICATION_API_URL}/programs/${PROGRAM_KEY}/events`,
      event
    );
  }

  // 3. Define badges
  const badges = [
    {
      key: 'early_adopter',
      name: 'Early Adopter',
      description: 'Signed up in the first month',
      criteria: { type: 'event_count', eventKey: 'signup', count: 1 },
    },
    {
      key: 'first_purchase',
      name: 'First Purchase',
      description: 'Made your first purchase',
      criteria: { type: 'event_count', eventKey: 'purchase', count: 1 },
    },
    {
      key: 'loyal_customer',
      name: 'Loyal Customer',
      description: 'Made 10 purchases',
      criteria: { type: 'event_count', eventKey: 'purchase', count: 10 },
    },
    {
      key: 'super_shopper',
      name: 'Super Shopper',
      description: 'Made 50 purchases',
      criteria: { type: 'event_count', eventKey: 'purchase', count: 50 },
    },
    {
      key: 'points_master',
      name: 'Points Master',
      description: 'Earned 1000 points',
      criteria: { type: 'total_points', threshold: 1000 },
    },
    {
      key: 'referral_champion',
      name: 'Referral Champion',
      description: 'Referred 5 friends',
      criteria: { type: 'event_count', eventKey: 'referral', count: 5 },
    },
  ];

  for (const badge of badges) {
    await axios.post(`${GAMIFICATION_API_URL}/badges/${PROGRAM_KEY}`, badge);
  }

  console.log('✅ Program setup complete!');
}

// ============================================================================
// USAGE: Track user events
// ============================================================================

export class GamificationClient {
  private apiUrl: string;
  private programKey: string;

  constructor(apiUrl: string = GAMIFICATION_API_URL, programKey: string = PROGRAM_KEY) {
    this.apiUrl = apiUrl;
    this.programKey = programKey;
  }

  /**
   * Track when a user signs up
   */
  async trackSignup(userId: string, metadata?: Record<string, any>) {
    return this.trackEvent(userId, 'signup', metadata);
  }

  /**
   * Track when a user makes a purchase
   */
  async trackPurchase(userId: string, amount: number, metadata?: Record<string, any>) {
    const result = await this.trackEvent(userId, 'purchase', {
      amount,
      ...metadata,
    });

    // You can handle special cases here
    if (result.leveledUp) {
      await this.sendNotification(userId, {
        title: '🎉 Level Up!',
        message: `Congratulations! You've reached level ${result.newLevel}!`,
      });
    }

    if (result.tierChanged) {
      await this.sendNotification(userId, {
        title: '⭐ New Tier!',
        message: `You've been promoted to ${result.newTier} tier!`,
      });
    }

    for (const badge of result.badgesGranted) {
      await this.sendNotification(userId, {
        title: '🏆 New Badge!',
        message: `You earned the "${badge.badgeName}" badge!`,
      });
    }

    return result;
  }

  /**
   * Track daily login
   */
  async trackDailyLogin(userId: string) {
    return this.trackEvent(userId, 'daily_login', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track referral
   */
  async trackReferral(referrerId: string, newUserId: string) {
    return this.trackEvent(referrerId, 'referral', {
      referredUserId: newUserId,
    });
  }

  /**
   * Track profile completion
   */
  async trackProfileComplete(userId: string) {
    return this.trackEvent(userId, 'profile_complete');
  }

  /**
   * Generic event tracking
   */
  private async trackEvent(
    userId: string,
    eventKey: string,
    meta: Record<string, any> = {}
  ) {
    try {
      const response = await axios.post(`${this.apiUrl}/events/ingest`, {
        programKey: this.programKey,
        externalUserId: userId,
        eventKey,
        meta,
      });

      return response.data.result;
    } catch (error) {
      console.error(`Failed to track event ${eventKey} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's current stats
   */
  async getUserStats(userId: string) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/users/${this.programKey}/${userId}`
      );

      return {
        points: response.data.points,
        level: response.data.level,
        tier: response.data.tier,
        badges: response.data.badges,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };
    } catch (error) {
      console.error(`Failed to get stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's event history
   */
  async getUserHistory(userId: string, limit = 50, offset = 0) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/users/${this.programKey}/${userId}/history?limit=${limit}&offset=${offset}`
      );

      return response.data;
    } catch (error) {
      console.error(`Failed to get history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100, offset = 0) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/users/${this.programKey}/list?limit=${limit}&offset=${offset}`
      );

      return response.data.users.map((user: any) => ({
        userId: user.externalUserId,
        points: user.points,
        level: user.level,
        tier: user.tier,
        badgeCount: user.badgeCount,
      }));
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Send notification (implement with your notification system)
   */
  private async sendNotification(userId: string, notification: { title: string; message: string }) {
    // TODO: Implement with your notification system
    console.log(`[Notification for ${userId}] ${notification.title}: ${notification.message}`);
  }
}

// ============================================================================
// EXAMPLE USAGE IN YOUR APP
// ============================================================================

async function exampleUsage() {
  const gamification = new GamificationClient();

  // When a user signs up
  await gamification.trackSignup('user_123', {
    signupMethod: 'email',
    source: 'landing_page',
  });

  // When a user makes a purchase
  const purchaseResult = await gamification.trackPurchase('user_123', 150, {
    orderId: 'order_456',
    productCount: 3,
  });

  console.log('Purchase tracked:', {
    pointsEarned: purchaseResult.pointsEarned,
    totalPoints: purchaseResult.totalPoints,
    newLevel: purchaseResult.newLevel,
  });

  // When a user logs in daily
  await gamification.trackDailyLogin('user_123');

  // Get user stats to display in UI
  const stats = await gamification.getUserStats('user_123');
  console.log('User stats:', stats);

  // Get leaderboard for rankings page
  const leaderboard = await gamification.getLeaderboard(10);
  console.log('Top 10 users:', leaderboard);

  // Get user history
  const history = await gamification.getUserHistory('user_123');
  console.log('User history:', history);
}

// ============================================================================
// REACT COMPONENT EXAMPLE
// ============================================================================

/*
import { useEffect, useState } from 'react';

export function UserLoyaltyCard({ userId }: { userId: string }) {
  const [stats, setStats] = useState(null);
  const gamification = new GamificationClient();

  useEffect(() => {
    gamification.getUserStats(userId).then(setStats);
  }, [userId]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="loyalty-card">
      <h3>Your Rewards</h3>
      <div className="stats">
        <div className="stat">
          <label>Points</label>
          <span>{stats.points}</span>
        </div>
        <div className="stat">
          <label>Level</label>
          <span>{stats.level}</span>
        </div>
        <div className="stat">
          <label>Tier</label>
          <span className={`tier-${stats.tier}`}>{stats.tier}</span>
        </div>
      </div>
      <div className="badges">
        <h4>Badges ({stats.badges.length})</h4>
        <div className="badge-grid">
          {stats.badges.map((badge) => (
            <div key={badge.key} className="badge" title={badge.description}>
              🏆 {badge.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
*/

export { setupProgram, GamificationClient };
