import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

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
    example: 'Blue',
  })
  @IsString()
  @IsNotEmpty()
  answer: string;
}
