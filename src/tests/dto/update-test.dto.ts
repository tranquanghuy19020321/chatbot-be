import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
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

  @ApiProperty({
    description: 'Whether the test has been completed',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
