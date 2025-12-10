import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Note } from '../../notes/entities/note.entity';
import { MentalHealthEvaluation } from './mental-health-evaluation.entity';
import { Test } from '../../tests/entities/test.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'User password (hashed)',
    example: '$2b$10$...',
  })
  @Column()
  password: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+84901234567',
    required: false,
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({
    description: 'User active status',
    example: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Refresh token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @Column({ nullable: true })
  refreshToken: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @OneToMany(() => MentalHealthEvaluation, (evaluation) => evaluation.user)
  mentalHealthEvaluations: MentalHealthEvaluation[];

  @ApiProperty({
    description: 'User notes',
    type: () => [Note],
  })
  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];

  @ApiProperty({
    description: 'User tests',
    type: () => [Test],
  })
  @OneToMany(() => Test, (test) => test.user)
  tests: Test[];

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
