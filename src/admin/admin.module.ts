import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from '../tests/entities/test.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Test, User, MentalHealthEvaluation])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
