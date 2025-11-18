import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get(':programKey')
  @ApiOperation({ summary: 'List all badge definitions for a program' })
  @ApiResponse({ status: 200, description: 'List of badge definitions' })
  async listBadges(@Param('programKey') programKey: string) {
    return this.badgesService.listBadges(programKey);
  }

  @Post(':programKey')
  @ApiOperation({ summary: 'Create a new badge definition' })
  @ApiResponse({ status: 201, description: 'Badge created' })
  async createBadge(
    @Param('programKey') programKey: string,
    @Body() dto: CreateBadgeDto,
  ) {
    return this.badgesService.createBadge(programKey, dto);
  }
}
