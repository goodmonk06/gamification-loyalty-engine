import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateBadgeDto {
  @ApiProperty({ example: 'first_purchase' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'First Purchase' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Made your first purchase', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/badges/first-purchase.png', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    example: {
      type: 'event_count',
      eventKey: 'purchase',
      count: 1,
    },
  })
  @IsObject()
  @IsNotEmpty()
  criteria: any;
}
