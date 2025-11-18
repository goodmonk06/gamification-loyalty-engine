import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto, UpdateProgramDto, CreateEventDefinitionDto } from './dto';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async listPrograms() {
    return this.prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProgram(programKey: string) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
      include: {
        eventDefinitions: true,
        badgeDefinitions: true,
        _count: {
          select: {
            userAccounts: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  async createProgram(dto: CreateProgramDto) {
    const existing = await this.prisma.program.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException('Program key already exists');
    }

    return this.prisma.program.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        configJson: dto.config || {
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
  }

  async updateProgram(programKey: string, dto: UpdateProgramDto) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return this.prisma.program.update({
      where: { key: programKey },
      data: {
        name: dto.name,
        description: dto.description,
        configJson: dto.config,
      },
    });
  }

  async listEventDefinitions(programKey: string) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return this.prisma.eventDefinition.findMany({
      where: { programId: program.id },
      orderBy: { key: 'asc' },
    });
  }

  async createEventDefinition(programKey: string, dto: CreateEventDefinitionDto) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const existing = await this.prisma.eventDefinition.findUnique({
      where: {
        programId_key: {
          programId: program.id,
          key: dto.key,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Event key already exists in this program');
    }

    return this.prisma.eventDefinition.create({
      data: {
        programId: program.id,
        key: dto.key,
        description: dto.description,
        rulesJson: dto.rules,
      },
    });
  }
}
