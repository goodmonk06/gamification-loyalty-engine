import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramDto, CreateEventDefinitionDto } from './dto';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'List all programs' })
  @ApiResponse({ status: 200, description: 'List of programs' })
  async listPrograms() {
    return this.programsService.listPrograms();
  }

  @Get(':programKey')
  @ApiOperation({ summary: 'Get program details' })
  @ApiResponse({ status: 200, description: 'Program details' })
  async getProgram(@Param('programKey') programKey: string) {
    return this.programsService.getProgram(programKey);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new program' })
  @ApiResponse({ status: 201, description: 'Program created' })
  async createProgram(@Body() dto: CreateProgramDto) {
    return this.programsService.createProgram(dto);
  }

  @Put(':programKey')
  @ApiOperation({ summary: 'Update program configuration' })
  @ApiResponse({ status: 200, description: 'Program updated' })
  async updateProgram(
    @Param('programKey') programKey: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programsService.updateProgram(programKey, dto);
  }

  @Get(':programKey/events')
  @ApiOperation({ summary: 'List event definitions for a program' })
  @ApiResponse({ status: 200, description: 'List of event definitions' })
  async listEventDefinitions(@Param('programKey') programKey: string) {
    return this.programsService.listEventDefinitions(programKey);
  }

  @Post(':programKey/events')
  @ApiOperation({ summary: 'Create event definition' })
  @ApiResponse({ status: 201, description: 'Event definition created' })
  async createEventDefinition(
    @Param('programKey') programKey: string,
    @Body() dto: CreateEventDefinitionDto,
  ) {
    return this.programsService.createEventDefinition(programKey, dto);
  }
}
