import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionDto } from './question.dto';

export class CreateTestDto {
  @ApiProperty({
    description: 'Array of questions with answers',
    type: [QuestionDto],
    example: [
      {
        question: 'What is your favorite color?',
        answer: 'Blue',
      },
      {
        question: 'What is your hobby?',
        answer: 'Reading',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
