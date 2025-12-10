import { ApiProperty } from '@nestjs/swagger';

export class MbiScoreDto {
  @ApiProperty({ example: 15, minimum: 0, maximum: 30 })
  emotional_exhaustion: number;

  @ApiProperty({ example: 10, minimum: 0, maximum: 30 })
  cynicism: number;

  @ApiProperty({ example: 20, minimum: 0, maximum: 30 })
  professional_efficacy: number;

  @ApiProperty({ example: 'Mức độ trung bình' })
  assessment: string;
}

export class MentalHealthEvaluationDto {
  @ApiProperty({
    example: 'HAPPY',
    enum: ['HAPPY', 'SAD', 'ANGRY', 'NEUTRAL'],
  })
  emotion_state: 'HAPPY' | 'SAD' | 'ANGRY' | 'NEUTRAL';

  @ApiProperty({ example: 45, minimum: 0, maximum: 100 })
  stress_level: number;

  @ApiProperty({ example: 8, minimum: 0, maximum: 21 })
  gad7_score: number;

  @ApiProperty({ example: 'Lo âu nhẹ' })
  gad7_assessment: string;

  @ApiProperty({ example: 15, minimum: 0, maximum: 40 })
  pss10_score: number;

  @ApiProperty({ example: 'Stress mức trung bình' })
  pss10_assessment: string;

  @ApiProperty({ type: MbiScoreDto })
  mbi_ss_score: MbiScoreDto;

  @ApiProperty({
    example:
      'Bạn đang trong tình trạng tinh thần tương đối ổn định. Hãy tiếp tục duy trì lối sống lành mạnh.',
  })
  overall_mental_health: string;
}

export class MentalHealthEvaluationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: MentalHealthEvaluationDto })
  data: MentalHealthEvaluationDto;
}
