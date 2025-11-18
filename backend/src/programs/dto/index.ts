import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateProgramDto {
  @ApiProperty({ example: 'marketplace-rewards' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Marketplace Rewards Program' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Loyalty program for marketplace users', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: {
      levelThresholds: [
        { level: 1, minPoints: 0 },
        { level: 2, minPoints: 100 },
      ],
      tierThresholds: [
        { tier: 'bronze', minPoints: 0 },
        { tier: 'silver', minPoints: 500 },
      ],
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  config?: any;
}

export class UpdateProgramDto {
  @ApiProperty({ example: 'Updated Program Name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  config?: any;
}

export class CreateEventDefinitionDto {
  @ApiProperty({ example: 'purchase' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'User made a purchase', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: {
      basePoints: 10,
      multipliers: [{ condition: 'amount > 100', multiplier: 1.5 }],
    },
  })
  @IsObject()
  @IsNotEmpty()
  rules: any;
}
