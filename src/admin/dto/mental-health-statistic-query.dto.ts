import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class MentalHealthStatisticQueryDto {
  @ApiProperty({
    example: '2025-12-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsISO8601()
  startDate: string;

  @ApiProperty({
    example: '2025-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  @IsISO8601()
  endDate: string;
}
