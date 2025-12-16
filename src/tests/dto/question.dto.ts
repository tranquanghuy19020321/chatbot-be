import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';

export class QuestionDto {
  @ApiProperty({
    description: 'Question content',
    example: 'What is your favorite color?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Answer to the question',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  answer: number;

  @ApiProperty({
    description: 'Type of question',
    example: 'gad',
    enum: ['gad', 'mbi', 'phq', 'pss'],
  })
  @IsEnum(['gad', 'mbi', 'phq', 'pss'])
  @IsNotEmpty()
  questionType: 'gad' | 'mbi' | 'phq' | 'pss';
}
