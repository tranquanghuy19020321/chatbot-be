import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AddRefreshTokenToUser1733147000000 } from './migrations/1733147000000-AddRefreshTokenToUser';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT ?? '3306') || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'Tran@48113983',
  database: process.env.DATABASE_NAME || 'sample',
  entities: [User],
  migrations: [AddRefreshTokenToUser1733147000000],
  synchronize: false,
  logging: true,
});
