import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from './test.entity';

@Entity('questions')
export class Question {
  @ApiProperty({
    description: 'Unique question identifier',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Question content',
    example: 'What is your favorite color?',
  })
  @Column({ type: 'text' })
  question: string;

  @ApiProperty({
    description: 'Answer to the question',
    example: 'Blue',
  })
  @Column({ type: 'text' })
  answer: string;

  @ApiProperty({
    description: 'Question creation date',
    example: '2023-12-03T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Question last update date',
    example: '2023-12-03T11:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: 'Test this question belongs to',
    type: () => Test,
  })
  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  test: Test;
}
