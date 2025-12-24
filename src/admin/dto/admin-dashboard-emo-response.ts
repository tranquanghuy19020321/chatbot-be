import { ApiProperty } from '@nestjs/swagger';

export class DashboardEmoDto {
  @ApiProperty({
    description: 'Number of users feeling happy',
    example: 180,
    type: 'number',
  })
  happy: number;

  @ApiProperty({
    description: 'Number of users feeling sad',
    example: 100,
    type: 'number',
  })
  sad: number;

  @ApiProperty({
    description: 'Number of users feeling neutral',
    example: 50,
    type: 'number',
  })
  neutral: number;

  @ApiProperty({
    description: 'Number of users feeling angry',
    example: 100,
    type: 'number',
  })
  angry: number;
}

export class DailyEmoStatisticDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2024-12-23',
    type: 'string',
  })
  date: string;

  @ApiProperty({
    description:
      'Total number of mental health evaluations recorded on this date',
    type: DashboardEmoDto,
  })
  emo: DashboardEmoDto;
}
