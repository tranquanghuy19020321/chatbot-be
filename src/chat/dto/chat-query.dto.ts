import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatQueryDto {
  @ApiProperty({
    description: 'Query message from user',
    example: 'What is NestJS?',
  })
  @IsNotEmpty()
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: 'conv-123',
  })
  @IsNotEmpty()
  @IsString()
  conversation_id: string;
}
