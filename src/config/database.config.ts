import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Note } from '../notes/entities/note.entity';
import { Question } from '../tests/entities/question.entity';
import { Test } from '../tests/entities/test.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { User } from '../users/entities/user.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DATABASE_HOST', '127.0.0.1'),
  port: configService.get<number>('DATABASE_PORT', 3306),
  username: configService.get<string>('DATABASE_USERNAME', 'root'),
  password: configService.get<string>('DATABASE_PASSWORD', 'Tran@48113983'),
  database: configService.get<string>('DATABASE_NAME', 'sample'),
  entities: [User, MentalHealthEvaluation, Note, Test, Question],
  synchronize:
    configService.get<string>('NODE_ENV', 'development') !== 'production',
  logging:
    configService.get<string>('NODE_ENV', 'development') === 'development',
});
