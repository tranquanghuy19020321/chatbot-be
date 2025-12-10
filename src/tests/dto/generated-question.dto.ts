import { ApiProperty } from '@nestjs/swagger';

export class GeneratedQuestionDto {
  @ApiProperty({
    description: 'Question content in Vietnamese',
    example:
      'Gần đây bạn cảm thấy khó kiểm soát những điều xảy ra xung quanh mình như thế nào?',
  })
  question: string;

  @ApiProperty({
    description: 'Question type (pss, gad, phq, mbi)',
    example: 'pss',
    enum: ['pss', 'gad', 'phq', 'mbi'],
  })
  type: string;

  @ApiProperty({
    description: 'Answer options as numeric values',
    example: [0, 1, 2, 3],
    type: [Number],
  })
  answer_option: number[];
}

export class GeneratedQuestionsResponseDto {
  @ApiProperty({
    description: 'PSS (Perceived Stress Scale) questions for stress assessment',
    type: [GeneratedQuestionDto],
  })
  pss: GeneratedQuestionDto[];

  @ApiProperty({
    description:
      'GAD (Generalized Anxiety Disorder) questions for anxiety assessment',
    type: [GeneratedQuestionDto],
  })
  gad: GeneratedQuestionDto[];

  @ApiProperty({
    description:
      'PHQ (Patient Health Questionnaire) questions for depression assessment',
    type: [GeneratedQuestionDto],
  })
  phq: GeneratedQuestionDto[];

  @ApiProperty({
    description:
      'MBI (Maslach Burnout Inventory) questions for burnout assessment',
    type: [GeneratedQuestionDto],
  })
  mbi: GeneratedQuestionDto[];
}
