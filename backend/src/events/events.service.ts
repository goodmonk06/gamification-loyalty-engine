import { Injectable } from '@nestjs/common';
import { RulesEngineService } from '../rules-engine/rules-engine.service';
import { IngestEventDto } from './dto/ingest-event.dto';

@Injectable()
export class EventsService {
  constructor(private rulesEngine: RulesEngineService) {}

  async ingestEvent(dto: IngestEventDto) {
    return this.rulesEngine.processEvent(
      dto.programKey,
      dto.externalUserId,
      dto.eventKey,
      dto.meta || {},
    );
  }
}
