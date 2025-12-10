import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { Note } from '../notes/entities/note.entity';
import { Test } from '../tests/entities/test.entity';
import { Question } from '../tests/entities/question.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT ?? '3306') || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'Tran@48113983',
  database: process.env.DATABASE_NAME || 'sample',
  entities: [User, MentalHealthEvaluation, Note, Test, Question],
  synchronize: process.env.NODE_ENV !== 'production', // Chỉ sync ở development
  logging: process.env.NODE_ENV === 'development',
};
