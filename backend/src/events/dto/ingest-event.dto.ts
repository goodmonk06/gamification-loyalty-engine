import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class IngestEventDto {
  @ApiProperty({
    description: 'Program key identifier',
    example: 'marketplace-rewards',
  })
  @IsString()
  @IsNotEmpty()
  programKey: string;

  @ApiProperty({
    description: 'External user ID from your application',
    example: 'user_12345',
  })
  @IsString()
  @IsNotEmpty()
  externalUserId: string;

  @ApiProperty({
    description: 'Event key that was triggered',
    example: 'purchase',
  })
  @IsString()
  @IsNotEmpty()
  eventKey: string;

  @ApiProperty({
    description: 'Additional event metadata',
    example: { amount: 150, productId: 'prod_abc' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
