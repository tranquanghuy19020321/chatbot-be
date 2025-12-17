import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Test } from './test.entity';

@Entity('test_mental_health_evaluations')
export class TestMentalHealthEvaluation {
  @ApiProperty({
    description: 'Unique evaluation identifier',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Test ID this evaluation belongs to',
    example: 1,
  })
  @Column({ name: 'test_id' })
  testId: number;

  @ApiProperty({
    description: 'Associated test',
    type: () => Test,
  })
  @OneToOne(() => Test, (test) => test.mentalHealthEvaluation)
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @ApiProperty({
    description: 'Emotion state derived from test responses',
    example: 'ANXIOUS',
    enum: ['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'STRESSED', 'NEUTRAL'],
  })
  @Column({
    type: 'enum',
    enum: ['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'STRESSED', 'NEUTRAL'],
    name: 'emotion_state',
  })
  emotionState: 'HAPPY' | 'SAD' | 'ANGRY' | 'ANXIOUS' | 'STRESSED' | 'NEUTRAL';

  @ApiProperty({
    description: 'Overall stress level (0-100)',
    example: 65,
  })
  @Column({ type: 'tinyint', unsigned: true, name: 'stress_level' })
  stressLevel: number; // 0-100

  @ApiProperty({
    description: 'GAD-7 score for anxiety assessment (0-21)',
    example: 12,
  })
  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'gad7_score',
    nullable: true,
  })
  gad7Score?: number; // 0-21

  @ApiProperty({
    description: 'GAD-7 assessment interpretation',
    example: 'Moderate anxiety',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'gad7_assessment',
    nullable: true,
  })
  gad7Assessment?: string;

  @ApiProperty({
    description: 'PSS-10 score for perceived stress (0-40)',
    example: 25,
  })
  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'pss10_score',
    nullable: true,
  })
  pss10Score?: number; // 0-40

  @ApiProperty({
    description: 'PSS-10 assessment interpretation',
    example: 'High perceived stress',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'pss10_assessment',
    nullable: true,
  })
  pss10Assessment?: string;

  @ApiProperty({
    description: 'PHQ-9 score for depression screening (0-27)',
    example: 8,
  })
  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'phq9_score',
    nullable: true,
  })
  phq9Score?: number; // 0-27

  @ApiProperty({
    description: 'PHQ-9 assessment interpretation',
    example: 'Mild depression',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'phq9_assessment',
    nullable: true,
  })
  phq9Assessment?: string;

  // MBI-SS scores
  @ApiProperty({
    description: 'MBI emotional exhaustion score (0-30)',
    example: 18,
  })
  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'mbi_emotional_exhaustion',
    nullable: true,
  })
  mbiEmotionalExhaustion?: number; // 0-30

  @ApiProperty({
    description: 'MBI cynicism score (0-30)',
    example: 12,
  })
  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'mbi_cynicism',
    nullable: true,
  })
  mbiCynicism?: number; // 0-30

  @ApiProperty({
    description: 'MBI professional efficacy score (0-30)',
    example: 22,
  })
  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'mbi_professional_efficacy',
    nullable: true,
  })
  mbiProfessionalEfficacy?: number; // 0-30

  @ApiProperty({
    description: 'MBI overall assessment',
    example: 'Moderate burnout risk',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'mbi_assessment',
    nullable: true,
  })
  mbiAssessment?: string;

  @ApiProperty({
    description: 'AI-generated overall mental health assessment',
    example:
      'Based on your responses, you show signs of moderate anxiety and stress. Consider seeking professional support.',
  })
  @Column({ type: 'text', name: 'overall_mental_health' })
  overallMentalHealth: string;

  @ApiProperty({
    description: 'Recommended actions or interventions',
    example:
      'Practice mindfulness meditation, regular exercise, consider therapy',
  })
  @Column({ type: 'text', name: 'recommendations', nullable: true })
  recommendations?: string;

  @ApiProperty({
    description: 'Risk level assessment',
    example: 'MODERATE',
    enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
  })
  @Column({
    type: 'enum',
    enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
    name: 'risk_level',
  })
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

  @ApiProperty({
    description: 'Evaluation creation date',
    example: '2023-12-03T10:30:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Evaluation last update date',
    example: '2023-12-03T11:30:00Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
