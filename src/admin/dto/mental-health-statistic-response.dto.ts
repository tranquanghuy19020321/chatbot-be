import { ApiProperty } from '@nestjs/swagger';

export class MentalHealthAveragesDto {
  @ApiProperty({
    description: 'Average stress level (0-100)',
    example: 65.5,
    type: 'number',
  })
  stressLevel: number;

  @ApiProperty({
    description: 'Average GAD-7 score (0-21)',
    example: 8.75,
    type: 'number',
  })
  gad7Score: number;

  @ApiProperty({
    description: 'Average PSS-10 score (0-40)',
    example: 18.33,
    type: 'number',
  })
  pss10Score: number;

  @ApiProperty({
    description: 'Average MBI Emotional Exhaustion score (0-30)',
    example: 15.2,
    type: 'number',
  })
  mbiEmotionalExhaustion: number;

  @ApiProperty({
    description: 'Average MBI Cynicism score (0-30)',
    example: 12.8,
    type: 'number',
  })
  mbiCynicism: number;

  @ApiProperty({
    description: 'Average MBI Professional Efficacy score (0-30)',
    example: 22.4,
    type: 'number',
  })
  mbiProfessionalEfficacy: number;
}

export class DailyMentalHealthStatisticDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2024-12-23',
    type: 'string',
  })
  date: string;

  @ApiProperty({
    description: 'Average values for mental health metrics on this date',
    type: MentalHealthAveragesDto,
  })
  averages: MentalHealthAveragesDto;

  @ApiProperty({
    description:
      'Total number of mental health evaluations recorded on this date',
    example: 4,
    type: 'number',
  })
  totalRecords: number;
}

export class MentalHealthStatisticResponseDto {
  @ApiProperty({
    description: 'Array of daily mental health statistics',
    type: [DailyMentalHealthStatisticDto],
  })
  data: DailyMentalHealthStatisticDto[];
}
