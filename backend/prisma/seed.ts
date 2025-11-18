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

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
