import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':programKey/:externalUserId')
  @ApiOperation({
    summary: 'Get user account details',
    description: 'Retrieve user points, level, tier, and badges for a specific program',
  })
  @ApiParam({ name: 'programKey', example: 'marketplace-rewards' })
  @ApiParam({ name: 'externalUserId', example: 'user_12345' })
  @ApiResponse({
    status: 200,
    description: 'User account details',
  })
  async getUserAccount(
    @Param('programKey') programKey: string,
    @Param('externalUserId') externalUserId: string,
  ) {
    return this.usersService.getUserAccount(programKey, externalUserId);
  }

  @Get(':programKey/:externalUserId/history')
  @ApiOperation({
    summary: 'Get user event history',
    description: 'Retrieve all earn events for a user',
  })
  @ApiParam({ name: 'programKey', example: 'marketplace-rewards' })
  @ApiParam({ name: 'externalUserId', example: 'user_12345' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiResponse({
    status: 200,
    description: 'User event history',
  })
  async getUserHistory(
    @Param('programKey') programKey: string,
    @Param('externalUserId') externalUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.usersService.getUserHistory(
      programKey,
      externalUserId,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  @Get(':programKey/list')
  @ApiOperation({
    summary: 'List all users in a program',
    description: 'Get paginated list of all user accounts',
  })
  @ApiParam({ name: 'programKey', example: 'marketplace-rewards' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiResponse({
    status: 200,
    description: 'List of user accounts',
  })
  async listUsers(
    @Param('programKey') programKey: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.usersService.listUsers(
      programKey,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }
}
