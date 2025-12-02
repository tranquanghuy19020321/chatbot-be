import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT ?? '3306') || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'Tran@48113983',
  database: process.env.DATABASE_NAME || 'sample',
  entities: [User],
  synchronize: process.env.NODE_ENV !== 'production', // Chỉ sync ở development
  logging: process.env.NODE_ENV === 'development',
};
