import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Note } from '../notes/entities/note.entity';
import { Question } from '../tests/entities/question.entity';
import { TestMentalHealthEvaluation } from '../tests/entities/test-mental-health-evaluation.entity';
import { Test } from '../tests/entities/test.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { User } from '../users/entities/user.entity';

// Load environment variables from .env file
config();
// import { AddRefreshTokenToUser1733147000000 } from './migrations/1733147000000-AddRefreshTokenToUser';
// import { CreateMentalHealthEvaluations1764736066229 } from './migrations/1764736066229-CreateMentalHealthEvaluations';
// import { CreateNotes1733205000000 } from './migrations/1733205000000-CreateNotes';
// import { AddIsAiGeneratedToNotes1733215000000 } from './migrations/1733215000000-AddIsAiGeneratedToNotes';
// import { CreateTests1733500000000 } from './migrations/1733500000000-CreateTests';
// import { UpdateQuestionEntity1765883141024 } from './migrations/1765883141024-UpdateQuestionEntity';
// import { AddIsCompletedToTest1765898825210 } from './migrations/1765898825210-AddIsCompletedToTest';
import { CreateTestMentalHealthEvaluations1734374400000 } from './migrations/1734374400000-CreateTestMentalHealthEvaluations';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT ?? '3306') || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'Tran@48113983',
  database: process.env.DATABASE_NAME || 'sample',
  entities: [
    User,
    MentalHealthEvaluation,
    Note,
    Test,
    Question,
    TestMentalHealthEvaluation,
  ],
  migrations: [
    // AddRefreshTokenToUser1733147000000,
    // CreateMentalHealthEvaluations1764736066229,
    // CreateNotes1733205000000,
    // AddIsAiGeneratedToNotes1733215000000,
    // CreateTests1733500000000,
    // UpdateQuestionEntity1765883141024,
    // AddIsCompletedToTest1765898825210,
    CreateTestMentalHealthEvaluations1734374400000,
  ],
  synchronize: false,
  logging: true,
});
