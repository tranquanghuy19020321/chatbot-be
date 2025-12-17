import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from './question.entity';
import { TestMentalHealthEvaluation } from './test-mental-health-evaluation.entity';

@Entity('tests')
export class Test {
  @ApiProperty({
    description: 'Unique test identifier',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Test creation date',
    example: '2023-12-03T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Test last update date',
    example: '2023-12-03T11:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether the test has been completed',
    example: false,
  })
  @Column({ default: false })
  isCompleted: boolean;

  @ApiProperty({
    description: 'User who created the test',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.tests, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'Questions in this test',
    type: () => [Question],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((question) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { test, ...questionWithoutTest } = question;
        return questionWithoutTest;
      });
    }
    return value;
  })
  @OneToMany(() => Question, (question) => question.test, { cascade: true })
  questions: Question[];

  @ApiProperty({
    description: 'Mental health evaluation for this test',
    type: () => TestMentalHealthEvaluation,
  })
  @OneToOne(() => TestMentalHealthEvaluation, (evaluation) => evaluation.test, {
    cascade: true,
  })
  mentalHealthEvaluation?: TestMentalHealthEvaluation;
}
