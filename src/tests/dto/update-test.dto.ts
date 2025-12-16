import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionDto } from './question.dto';

export class UpdateTestDto {
  @ApiProperty({
    description: 'Array of questions with answers',
    type: [QuestionDto],
    example: [
      {
        question: 'What is your favorite color?',
        answer: 3,
        questionType: 'gad',
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}
