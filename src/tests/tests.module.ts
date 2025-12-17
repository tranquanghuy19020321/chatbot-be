import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { TestMentalHealthEvaluation } from './entities/test-mental-health-evaluation.entity';
import { Test } from './entities/test.entity';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Test, Question, TestMentalHealthEvaluation]),
  ],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
