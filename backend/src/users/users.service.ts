import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getUserAccount(programKey: string, externalUserId: string) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Try cache first
    const cacheKey = this.redis.getCacheKey('user', program.id, externalUserId);
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const userAccount = await this.prisma.userAccount.findUnique({
      where: {
        programId_externalUserId: {
          programId: program.id,
          externalUserId,
        },
      },
      include: {
        badges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!userAccount) {
      throw new NotFoundException('User account not found');
    }

    const result = {
      id: userAccount.id,
      externalUserId: userAccount.externalUserId,
      points: userAccount.points,
      level: userAccount.level,
      tier: userAccount.tier,
      badges: userAccount.badges.map((ub) => ({
        key: ub.badge.key,
        name: ub.badge.name,
        description: ub.badge.description,
        imageUrl: ub.badge.imageUrl,
        grantedAt: ub.grantedAt,
      })),
      createdAt: userAccount.createdAt,
      updatedAt: userAccount.updatedAt,
    };

    // Cache for 1 minute
    await this.redis.setJson(cacheKey, result, 60);

    return result;
  }

  async getUserHistory(
    programKey: string,
    externalUserId: string,
    limit: number,
    offset: number,
  ) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const userAccount = await this.prisma.userAccount.findUnique({
      where: {
        programId_externalUserId: {
          programId: program.id,
          externalUserId,
        },
      },
    });

    if (!userAccount) {
      throw new NotFoundException('User account not found');
    }

    const events = await this.prisma.earnEvent.findMany({
      where: { userAccountId: userAccount.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.earnEvent.count({
      where: { userAccountId: userAccount.id },
    });

    return {
      events,
      total,
      limit,
      offset,
    };
  }

  async listUsers(programKey: string, limit: number, offset: number) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const users = await this.prisma.userAccount.findMany({
      where: { programId: program.id },
      orderBy: { points: 'desc' },
      take: limit,
      skip: offset,
      include: {
        badges: {
          include: {
            badge: true,
          },
        },
      },
    });

    const total = await this.prisma.userAccount.count({
      where: { programId: program.id },
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        externalUserId: u.externalUserId,
        points: u.points,
        level: u.level,
        tier: u.tier,
        badgeCount: u.badges.length,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total,
      limit,
      offset,
    };
  }
}
