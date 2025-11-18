import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { ProgramsModule } from './programs/programs.module';
import { BadgesModule } from './badges/badges.module';
import { RulesEngineModule } from './rules-engine/rules-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    RulesEngineModule,
    EventsModule,
    UsersModule,
    ProgramsModule,
    BadgesModule,
  ],
})
export class AppModule {}
