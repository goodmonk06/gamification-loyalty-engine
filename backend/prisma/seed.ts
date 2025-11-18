import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a demo program
  const program = await prisma.program.upsert({
    where: { key: 'demo-rewards' },
    update: {},
    create: {
      key: 'demo-rewards',
      name: 'Demo Rewards Program',
      description: 'A demonstration loyalty program',
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

  // Create event definitions
  await prisma.eventDefinition.upsert({
    where: { programId_key: { programId: program.id, key: 'purchase' } },
    update: {},
    create: {
      programId: program.id,
      key: 'purchase',
      description: 'User made a purchase',
      rulesJson: {
        basePoints: 10,
        multipliers: [
          { condition: 'amount > 100', multiplier: 1.5 },
          { condition: 'amount > 500', multiplier: 2.0 },
        ],
      },
    },
  });

  await prisma.eventDefinition.upsert({
    where: { programId_key: { programId: program.id, key: 'referral' } },
    update: {},
    create: {
      programId: program.id,
      key: 'referral',
      description: 'User referred a friend',
      rulesJson: {
        basePoints: 50,
      },
    },
  });

  await prisma.eventDefinition.upsert({
    where: { programId_key: { programId: program.id, key: 'daily_login' } },
    update: {},
    create: {
      programId: program.id,
      key: 'daily_login',
      description: 'User logged in',
      rulesJson: {
        basePoints: 5,
      },
    },
  });

  // Create badge definitions
  await prisma.badgeDefinition.upsert({
    where: { programId_key: { programId: program.id, key: 'first_purchase' } },
    update: {},
    create: {
      programId: program.id,
      key: 'first_purchase',
      name: 'First Purchase',
      description: 'Made your first purchase',
      criteriaJson: {
        type: 'event_count',
        eventKey: 'purchase',
        count: 1,
      },
    },
  });

  await prisma.badgeDefinition.upsert({
    where: { programId_key: { programId: program.id, key: 'points_100' } },
    update: {},
    create: {
      programId: program.id,
      key: 'points_100',
      name: '100 Points',
      description: 'Earned 100 points',
      criteriaJson: {
        type: 'total_points',
        threshold: 100,
      },
    },
  });

  await prisma.badgeDefinition.upsert({
    where: { programId_key: { programId: program.id, key: 'super_referrer' } },
    update: {},
    create: {
      programId: program.id,
      key: 'super_referrer',
      name: 'Super Referrer',
      description: 'Referred 5 friends',
      criteriaJson: {
        type: 'event_count',
        eventKey: 'referral',
        count: 5,
      },
    },
  });

  console.log('✅ Program, events, and badges created');

  // Create demo users with realistic data
  const demoUsers = [
    {
      externalUserId: 'demo_user_1',
      points: 150,
      level: 2,
      tier: 'bronze',
      events: [
        { eventKey: 'purchase', pointsDelta: 10, meta: { amount: 50, orderId: 'order_001' } },
        { eventKey: 'purchase', pointsDelta: 15, meta: { amount: 120, orderId: 'order_002' } },
        { eventKey: 'daily_login', pointsDelta: 5, meta: {} },
        { eventKey: 'referral', pointsDelta: 50, meta: { referredUser: 'user_xyz' } },
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 600, orderId: 'order_003' } },
        { eventKey: 'daily_login', pointsDelta: 5, meta: {} },
        { eventKey: 'purchase', pointsDelta: 10, meta: { amount: 75, orderId: 'order_004' } },
        { eventKey: 'daily_login', pointsDelta: 5, meta: {} },
        { eventKey: 'referral', pointsDelta: 50, meta: { referredUser: 'user_abc' } },
      ],
    },
    {
      externalUserId: 'demo_user_2',
      points: 620,
      level: 4,
      tier: 'silver',
      events: [
        { eventKey: 'purchase', pointsDelta: 10, meta: { amount: 45, orderId: 'order_101' } },
        { eventKey: 'daily_login', pointsDelta: 5, meta: {} },
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 550, orderId: 'order_102' } },
        { eventKey: 'referral', pointsDelta: 50, meta: { referredUser: 'user_def' } },
        { eventKey: 'purchase', pointsDelta: 15, meta: { amount: 150, orderId: 'order_103' } },
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 700, orderId: 'order_104' } },
        { eventKey: 'daily_login', pointsDelta: 5, meta: {} },
        { eventKey: 'purchase', pointsDelta: 10, meta: { amount: 80, orderId: 'order_105' } },
        { eventKey: 'referral', pointsDelta: 50, meta: { referredUser: 'user_ghi' } },
        { eventKey: 'purchase', pointsDelta: 15, meta: { amount: 200, orderId: 'order_106' } },
      ],
    },
    {
      externalUserId: 'demo_user_3',
      points: 1800,
      level: 5,
      tier: 'gold',
      events: [
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 600, orderId: 'order_201' } },
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 750, orderId: 'order_202' } },
        { eventKey: 'referral', pointsDelta: 50, meta: { referredUser: 'user_jkl' } },
        { eventKey: 'purchase', pointsDelta: 15, meta: { amount: 180, orderId: 'order_203' } },
        { eventKey: 'referral', pointsDelta: 50, meta: { referredUser: 'user_mno' } },
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 850, orderId: 'order_204' } },
        { eventKey: 'daily_login', pointsDelta: 5, meta: {} },
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 900, orderId: 'order_205' } },
        { eventKey: 'referral', pointsDelta: 50, meta: { referredUser: 'user_pqr' } },
        { eventKey: 'purchase', pointsDelta: 20, meta: { amount: 1000, orderId: 'order_206' } },
      ],
    },
  ];

  for (const userData of demoUsers) {
    // Check if user already exists
    let user = await prisma.userAccount.findUnique({
      where: {
        programId_externalUserId: {
          programId: program.id,
          externalUserId: userData.externalUserId,
        },
      },
    });

    if (!user) {
      // Create user
      user = await prisma.userAccount.create({
        data: {
          programId: program.id,
          externalUserId: userData.externalUserId,
          points: userData.points,
          level: userData.level,
          tier: userData.tier,
          metaJson: {},
        },
      });

      // Create event history
      for (const event of userData.events) {
        await prisma.earnEvent.create({
          data: {
            programId: program.id,
            userAccountId: user.id,
            eventKey: event.eventKey,
            pointsDelta: event.pointsDelta,
            metaJson: event.meta,
          },
        });
      }

      // Grant badges based on points
      const badges = await prisma.badgeDefinition.findMany({
        where: { programId: program.id },
      });

      for (const badge of badges) {
        let shouldGrant = false;

        if (badge.criteriaJson['type'] === 'total_points') {
          shouldGrant = userData.points >= badge.criteriaJson['threshold'];
        } else if (badge.criteriaJson['type'] === 'event_count') {
          const eventCount = userData.events.filter(
            (e) => e.eventKey === badge.criteriaJson['eventKey'],
          ).length;
          shouldGrant = eventCount >= badge.criteriaJson['count'];
        }

        if (shouldGrant) {
          await prisma.userBadge.create({
            data: {
              userAccountId: user.id,
              badgeId: badge.id,
              metaJson: {},
            },
          });
        }
      }

      console.log(
        `✅ Created user: ${userData.externalUserId} (${userData.points} points, level ${userData.level}, ${userData.tier} tier)`,
      );
    }
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Demo Data Summary:');
  console.log('   - Program: demo-rewards');
  console.log('   - Users: 3 demo users with realistic activity');
  console.log('   - Events: purchase, referral, daily_login');
  console.log('   - Badges: first_purchase, points_100, super_referrer');
  console.log('\n🚀 Try the API:');
  console.log('   - POST http://localhost:3000/events/ingest');
  console.log('   - GET  http://localhost:3000/users/demo-rewards/demo_user_1');
  console.log('   - GET  http://localhost:3000/programs/demo-rewards');
  console.log('\n💻 Open Admin UI: http://localhost:3001');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
