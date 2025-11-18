import { Test, TestingModule } from '@nestjs/testing';
import { RulesEngineService } from './rules-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('RulesEngineService', () => {
  let service: RulesEngineService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockPrismaService = {
    program: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventDefinition: {
      findUnique: jest.fn(),
    },
    earnEvent: {
      create: jest.fn(),
      count: jest.fn(),
    },
    badgeDefinition: {
      findMany: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockRedisService = {
    getCacheKey: jest.fn((type: string, ...args: string[]) => `gam:${type}:${args.join(':')}`),
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesEngineService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RulesEngineService>(RulesEngineService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processEvent', () => {
    it('should process a basic event and award points', async () => {
      const mockProgram = {
        id: 'program-1',
        key: 'test-program',
        name: 'Test Program',
        configJson: {
          levelThresholds: [
            { level: 1, minPoints: 0 },
            { level: 2, minPoints: 100 },
          ],
          tierThresholds: [
            { tier: 'bronze', minPoints: 0 },
            { tier: 'silver', minPoints: 500 },
          ],
        },
      };

      const mockEventDef = {
        id: 'event-1',
        key: 'purchase',
        rulesJson: { basePoints: 10 },
      };

      const mockUser = {
        id: 'user-1',
        externalUserId: 'ext-user-1',
        programId: 'program-1',
        points: 0,
        level: 1,
        tier: 'bronze',
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.program.findUnique.mockResolvedValue(mockProgram);
      mockPrismaService.eventDefinition.findUnique.mockResolvedValue(mockEventDef);
      mockPrismaService.userAccount.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.earnEvent.create.mockResolvedValue({});
      mockPrismaService.userAccount.update.mockResolvedValue({
        ...mockUser,
        points: 10,
      });
      mockPrismaService.badgeDefinition.findMany.mockResolvedValue([]);
      mockPrismaService.userBadge.findMany.mockResolvedValue([]);

      const result = await service.processEvent('test-program', 'ext-user-1', 'purchase', {});

      expect(result.pointsEarned).toBe(10);
      expect(result.totalPoints).toBe(10);
      expect(result.leveledUp).toBe(false);
      expect(mockPrismaService.earnEvent.create).toHaveBeenCalled();
      expect(mockPrismaService.userAccount.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          points: 10,
          level: 1,
          tier: 'bronze',
        },
      });
    });

    it('should level up user when points threshold is reached', async () => {
      const mockProgram = {
        id: 'program-1',
        key: 'test-program',
        name: 'Test Program',
        configJson: {
          levelThresholds: [
            { level: 1, minPoints: 0 },
            { level: 2, minPoints: 100 },
            { level: 3, minPoints: 250 },
          ],
          tierThresholds: [
            { tier: 'bronze', minPoints: 0 },
          ],
        },
      };

      const mockEventDef = {
        id: 'event-1',
        key: 'purchase',
        rulesJson: { basePoints: 50 },
      };

      const mockUser = {
        id: 'user-1',
        externalUserId: 'ext-user-1',
        programId: 'program-1',
        points: 90,
        level: 1,
        tier: 'bronze',
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.program.findUnique.mockResolvedValue(mockProgram);
      mockPrismaService.eventDefinition.findUnique.mockResolvedValue(mockEventDef);
      mockPrismaService.userAccount.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.earnEvent.create.mockResolvedValue({});
      mockPrismaService.userAccount.update.mockResolvedValue({
        ...mockUser,
        points: 140,
        level: 2,
      });
      mockPrismaService.badgeDefinition.findMany.mockResolvedValue([]);
      mockPrismaService.userBadge.findMany.mockResolvedValue([]);

      const result = await service.processEvent('test-program', 'ext-user-1', 'purchase', {});

      expect(result.pointsEarned).toBe(50);
      expect(result.totalPoints).toBe(140);
      expect(result.previousLevel).toBe(1);
      expect(result.newLevel).toBe(2);
      expect(result.leveledUp).toBe(true);
    });

    it('should apply point multipliers based on conditions', async () => {
      const mockProgram = {
        id: 'program-1',
        key: 'test-program',
        configJson: {
          levelThresholds: [{ level: 1, minPoints: 0 }],
          tierThresholds: [{ tier: 'bronze', minPoints: 0 }],
        },
      };

      const mockEventDef = {
        id: 'event-1',
        key: 'purchase',
        rulesJson: {
          basePoints: 10,
          multipliers: [
            { condition: 'amount > 100', multiplier: 1.5 },
            { condition: 'amount > 500', multiplier: 2.0 },
          ],
        },
      };

      const mockUser = {
        id: 'user-1',
        externalUserId: 'ext-user-1',
        programId: 'program-1',
        points: 0,
        level: 1,
        tier: 'bronze',
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.program.findUnique.mockResolvedValue(mockProgram);
      mockPrismaService.eventDefinition.findUnique.mockResolvedValue(mockEventDef);
      mockPrismaService.userAccount.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.earnEvent.create.mockResolvedValue({});
      mockPrismaService.userAccount.update.mockResolvedValue({
        ...mockUser,
        points: 15,
      });
      mockPrismaService.badgeDefinition.findMany.mockResolvedValue([]);
      mockPrismaService.userBadge.findMany.mockResolvedValue([]);

      // Test with amount > 100 (should apply 1.5x multiplier)
      const result = await service.processEvent('test-program', 'ext-user-1', 'purchase', {
        amount: 150,
      });

      expect(result.pointsEarned).toBe(15); // 10 * 1.5 = 15
    });

    it('should grant badges when criteria is met', async () => {
      const mockProgram = {
        id: 'program-1',
        key: 'test-program',
        configJson: {
          levelThresholds: [{ level: 1, minPoints: 0 }],
          tierThresholds: [{ tier: 'bronze', minPoints: 0 }],
        },
      };

      const mockEventDef = {
        id: 'event-1',
        key: 'purchase',
        rulesJson: { basePoints: 110 },
      };

      const mockUser = {
        id: 'user-1',
        externalUserId: 'ext-user-1',
        programId: 'program-1',
        points: 0,
        level: 1,
        tier: 'bronze',
      };

      const mockBadgeDef = {
        id: 'badge-1',
        key: 'points_100',
        name: '100 Points Badge',
        criteriaJson: {
          type: 'total_points',
          threshold: 100,
        },
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.program.findUnique.mockResolvedValue(mockProgram);
      mockPrismaService.eventDefinition.findUnique.mockResolvedValue(mockEventDef);
      mockPrismaService.userAccount.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.earnEvent.create.mockResolvedValue({});
      mockPrismaService.userAccount.update.mockResolvedValue({
        ...mockUser,
        points: 110,
      });
      mockPrismaService.badgeDefinition.findMany.mockResolvedValue([mockBadgeDef]);
      mockPrismaService.userBadge.findMany.mockResolvedValue([]);
      mockPrismaService.userBadge.create.mockResolvedValue({
        id: 'user-badge-1',
        userAccountId: 'user-1',
        badgeId: 'badge-1',
      });

      const result = await service.processEvent('test-program', 'ext-user-1', 'purchase', {});

      expect(result.badgesGranted).toHaveLength(1);
      expect(result.badgesGranted[0].badgeKey).toBe('points_100');
      expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
    });

    it('should change tier when points threshold is crossed', async () => {
      const mockProgram = {
        id: 'program-1',
        key: 'test-program',
        configJson: {
          levelThresholds: [{ level: 1, minPoints: 0 }],
          tierThresholds: [
            { tier: 'bronze', minPoints: 0 },
            { tier: 'silver', minPoints: 500 },
            { tier: 'gold', minPoints: 1500 },
          ],
        },
      };

      const mockEventDef = {
        id: 'event-1',
        key: 'purchase',
        rulesJson: { basePoints: 100 },
      };

      const mockUser = {
        id: 'user-1',
        externalUserId: 'ext-user-1',
        programId: 'program-1',
        points: 450,
        level: 1,
        tier: 'bronze',
      };

      mockRedisService.getJson.mockResolvedValue(null);
      mockPrismaService.program.findUnique.mockResolvedValue(mockProgram);
      mockPrismaService.eventDefinition.findUnique.mockResolvedValue(mockEventDef);
      mockPrismaService.userAccount.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.earnEvent.create.mockResolvedValue({});
      mockPrismaService.userAccount.update.mockResolvedValue({
        ...mockUser,
        points: 550,
        tier: 'silver',
      });
      mockPrismaService.badgeDefinition.findMany.mockResolvedValue([]);
      mockPrismaService.userBadge.findMany.mockResolvedValue([]);

      const result = await service.processEvent('test-program', 'ext-user-1', 'purchase', {});

      expect(result.previousTier).toBe('bronze');
      expect(result.newTier).toBe('silver');
      expect(result.tierChanged).toBe(true);
    });
  });
});
