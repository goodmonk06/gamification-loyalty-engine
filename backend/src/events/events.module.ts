import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RulesEngineModule } from '../rules-engine/rules-engine.module';

@Module({
  imports: [RulesEngineModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
