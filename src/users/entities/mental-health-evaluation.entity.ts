import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('mental_health_evaluations')
export class MentalHealthEvaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.mentalHealthEvaluations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['HAPPY', 'SAD', 'ANGRY', 'NEUTRAL'],
    name: 'emotion_state',
  })
  emotionState: 'HAPPY' | 'SAD' | 'ANGRY' | 'NEUTRAL';

  @Column({ type: 'tinyint', unsigned: true, name: 'stress_level' })
  stressLevel: number; // 0-100

  @Column({ type: 'tinyint', unsigned: true, name: 'gad7_score' })
  gad7Score: number; // 0-21

  @Column({ type: 'varchar', length: 100, name: 'gad7_assessment' })
  gad7Assessment: string;

  @Column({ type: 'tinyint', unsigned: true, name: 'pss10_score' })
  pss10Score: number; // 0-40

  @Column({ type: 'varchar', length: 100, name: 'pss10_assessment' })
  pss10Assessment: string;

  // MBI-SS scores
  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'mbi_emotional_exhaustion',
  })
  mbiEmotionalExhaustion: number; // 0-30

  @Column({ type: 'tinyint', unsigned: true, name: 'mbi_cynicism' })
  mbiCynicism: number; // 0-30

  @Column({
    type: 'tinyint',
    unsigned: true,
    name: 'mbi_professional_efficacy',
  })
  mbiProfessionalEfficacy: number; // 0-30

  @Column({ type: 'varchar', length: 100, name: 'mbi_assessment' })
  mbiAssessment: string;

  @Column({ type: 'text', name: 'overall_mental_health' })
  overallMentalHealth: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
