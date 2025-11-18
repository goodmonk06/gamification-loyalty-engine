import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface ProcessEventResult {
  userAccountId: string;
  pointsEarned: number;
  totalPoints: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  previousTier: string;
  newTier: string;
  tierChanged: boolean;
  badgesGranted: Array<{
    badgeId: string;
    badgeKey: string;
    badgeName: string;
  }>;
}

@Injectable()
export class RulesEngineService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Main method: Process an event and update user state
   */
  async processEvent(
    programKey: string,
    externalUserId: string,
    eventKey: string,
    eventMeta: Record<string, any> = {},
  ): Promise<ProcessEventResult> {
    // 1. Get or create program
    const program = await this.getOrCreateProgram(programKey);

    // 2. Get event definition
    const eventDef = await this.prisma.eventDefinition.findUnique({
      where: { programId_key: { programId: program.id, key: eventKey } },
    });

    if (!eventDef) {
      throw new Error(`Event definition not found: ${eventKey}`);
    }

    // 3. Get or create user account
    let userAccount = await this.prisma.userAccount.findUnique({
      where: {
        programId_externalUserId: {
          programId: program.id,
          externalUserId,
        },
      },
    });

    if (!userAccount) {
      userAccount = await this.prisma.userAccount.create({
        data: {
          programId: program.id,
          externalUserId,
          points: 0,
          level: 1,
          tier: 'bronze',
          metaJson: {},
        },
      });
    }

    // 4. Calculate points to award
    const pointsDelta = this.calculatePoints(eventDef.rulesJson as any, eventMeta);

    // 5. Create earn event record
    await this.prisma.earnEvent.create({
      data: {
        programId: program.id,
        userAccountId: userAccount.id,
        eventKey,
        pointsDelta,
        metaJson: eventMeta,
      },
    });

    // 6. Update user points
    const previousPoints = userAccount.points;
    const newPoints = previousPoints + pointsDelta;

    // 7. Calculate new level
    const previousLevel = userAccount.level;
    const newLevel = this.calculateLevel(program.configJson as any, newPoints);
    const leveledUp = newLevel > previousLevel;

    // 8. Calculate new tier
    const previousTier = userAccount.tier;
    const newTier = this.calculateTier(program.configJson as any, newPoints);
    const tierChanged = newTier !== previousTier;

    // 9. Update user account
    const updatedUser = await this.prisma.userAccount.update({
      where: { id: userAccount.id },
      data: {
        points: newPoints,
        level: newLevel,
        tier: newTier,
      },
    });

    // 10. Check and grant badges
    const badgesGranted = await this.checkAndGrantBadges(
      program.id,
      userAccount.id,
      eventKey,
      newPoints,
    );

    // 11. Invalidate cache
    await this.invalidateUserCache(program.id, externalUserId);

    return {
      userAccountId: userAccount.id,
      pointsEarned: pointsDelta,
      totalPoints: newPoints,
      previousLevel,
      newLevel,
      leveledUp,
      previousTier,
      newTier,
      tierChanged,
      badgesGranted,
    };
  }

  /**
   * Calculate points based on event rules
   */
  private calculatePoints(
    rulesJson: { basePoints?: number; multipliers?: Array<{ condition: string; multiplier: number }> },
    eventMeta: Record<string, any>,
  ): number {
    let points = rulesJson.basePoints || 0;

    // Apply multipliers based on conditions
    if (rulesJson.multipliers && Array.isArray(rulesJson.multipliers)) {
      for (const mult of rulesJson.multipliers) {
        if (this.evaluateCondition(mult.condition, eventMeta)) {
          points *= mult.multiplier;
        }
      }
    }

    return Math.floor(points);
  }

  /**
   * Simple condition evaluator
   */
  private evaluateCondition(condition: string, eventMeta: Record<string, any>): boolean {
    try {
      // Simple conditions like "amount > 100"
      const match = condition.match(/(\w+)\s*([><=!]+)\s*(\d+)/);
      if (match) {
        const [, key, operator, valueStr] = match;
        const metaValue = eventMeta[key];
        const conditionValue = parseFloat(valueStr);

        switch (operator) {
          case '>':
            return metaValue > conditionValue;
          case '>=':
            return metaValue >= conditionValue;
          case '<':
            return metaValue < conditionValue;
          case '<=':
            return metaValue <= conditionValue;
          case '==':
          case '===':
            return metaValue == conditionValue;
          case '!=':
          case '!==':
            return metaValue != conditionValue;
          default:
            return false;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Calculate level based on points
   */
  private calculateLevel(
    configJson: { levelThresholds?: Array<{ level: number; minPoints: number }> },
    points: number,
  ): number {
    const thresholds = configJson.levelThresholds || [];
    if (thresholds.length === 0) return 1;

    // Sort by minPoints descending
    const sorted = [...thresholds].sort((a, b) => b.minPoints - a.minPoints);

    for (const threshold of sorted) {
      if (points >= threshold.minPoints) {
        return threshold.level;
      }
    }

    return 1;
  }

  /**
   * Calculate tier based on points
   */
  private calculateTier(
    configJson: { tierThresholds?: Array<{ tier: string; minPoints: number }> },
    points: number,
  ): string {
    const thresholds = configJson.tierThresholds || [];
    if (thresholds.length === 0) return 'bronze';

    // Sort by minPoints descending
    const sorted = [...thresholds].sort((a, b) => b.minPoints - a.minPoints);

    for (const threshold of sorted) {
      if (points >= threshold.minPoints) {
        return threshold.tier;
      }
    }

    return 'bronze';
  }

  /**
   * Check and grant badges based on user achievements
   */
  private async checkAndGrantBadges(
    programId: string,
    userAccountId: string,
    eventKey: string,
    totalPoints: number,
  ): Promise<Array<{ badgeId: string; badgeKey: string; badgeName: string }>> {
    const badgesGranted = [];

    // Get all badge definitions for this program
    const badgeDefs = await this.prisma.badgeDefinition.findMany({
      where: { programId },
    });

    // Get badges user already has
    const existingBadges = await this.prisma.userBadge.findMany({
      where: { userAccountId },
      select: { badgeId: true },
    });

    const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeId));

    for (const badgeDef of badgeDefs) {
      // Skip if user already has this badge
      if (existingBadgeIds.has(badgeDef.id)) continue;

      const criteria = badgeDef.criteriaJson as any;
      let shouldGrant = false;

      if (criteria.type === 'event_count') {
        // Count how many times user has triggered this event
        const count = await this.prisma.earnEvent.count({
          where: {
            userAccountId,
            eventKey: criteria.eventKey,
          },
        });

        shouldGrant = count >= criteria.count;
      } else if (criteria.type === 'total_points') {
        shouldGrant = totalPoints >= criteria.threshold;
      }

      if (shouldGrant) {
        await this.prisma.userBadge.create({
          data: {
            userAccountId,
            badgeId: badgeDef.id,
          },
        });

        badgesGranted.push({
          badgeId: badgeDef.id,
          badgeKey: badgeDef.key,
          badgeName: badgeDef.name,
        });
      }
    }

    return badgesGranted;
  }

  /**
   * Get or create program by key
   */
  private async getOrCreateProgram(programKey: string) {
    // Try cache first
    const cacheKey = this.redis.getCacheKey('program', programKey);
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    let program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      // Create default program
      program = await this.prisma.program.create({
        data: {
          key: programKey,
          name: programKey,
          description: `Auto-created program: ${programKey}`,
          configJson: {
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
        },
      });
    }

    // Cache for 5 minutes
    await this.redis.setJson(cacheKey, program, 300);
    return program;
  }

  /**
   * Invalidate user cache
   */
  private async invalidateUserCache(programId: string, externalUserId: string) {
    const cacheKey = this.redis.getCacheKey('user', programId, externalUserId);
    await this.redis.del(cacheKey);
  }
}
