import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { IngestEventDto } from './dto/ingest-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('ingest')
  @ApiOperation({
    summary: 'Ingest a user event',
    description: 'Process a user event, award points, update levels/tiers, and grant badges',
  })
  @ApiResponse({
    status: 201,
    description: 'Event processed successfully',
    schema: {
      example: {
        success: true,
        result: {
          userAccountId: 'clx123...',
          pointsEarned: 10,
          totalPoints: 110,
          previousLevel: 1,
          newLevel: 2,
          leveledUp: true,
          previousTier: 'bronze',
          newTier: 'bronze',
          tierChanged: false,
          badgesGranted: [
            {
              badgeId: 'clx456...',
              badgeKey: 'points_100',
              badgeName: '100 Points',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Event definition not found',
  })
  async ingest(@Body() dto: IngestEventDto) {
    const result = await this.eventsService.ingestEvent(dto);
    return {
      success: true,
      result,
    };
  }
}
