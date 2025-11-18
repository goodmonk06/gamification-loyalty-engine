import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBadgeDto } from './dto/create-badge.dto';

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  async listBadges(programKey: string) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return this.prisma.badgeDefinition.findMany({
      where: { programId: program.id },
      orderBy: { key: 'asc' },
      include: {
        _count: {
          select: {
            userBadges: true,
          },
        },
      },
    });
  }

  async createBadge(programKey: string, dto: CreateBadgeDto) {
    const program = await this.prisma.program.findUnique({
      where: { key: programKey },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const existing = await this.prisma.badgeDefinition.findUnique({
      where: {
        programId_key: {
          programId: program.id,
          key: dto.key,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Badge key already exists in this program');
    }

    return this.prisma.badgeDefinition.create({
      data: {
        programId: program.id,
        key: dto.key,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        criteriaJson: dto.criteria,
      },
    });
  }
}
