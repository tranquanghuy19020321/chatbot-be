import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Test } from '../tests/entities/test.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { User } from '../users/entities/user.entity';
import { AdminTestQueryDto } from './dto/admin-test-query.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MentalHealthEvaluation)
    private readonly mentalHealthEvaluationRepository: Repository<MentalHealthEvaluation>,
  ) {}

  async getTestsByUserId(
    query: AdminTestQueryDto,
  ): Promise<PaginatedResult<Test>> {
    const { userId, page = 1, limit = 10 } = query;

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const skip = (page - 1) * limit;

    const [tests, total] = await this.testRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['mentalHealthEvaluation'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTestDetailByUserId(testId: number, userId: number): Promise<Test> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const test = await this.testRepository.findOne({
      where: {
        id: testId,
        user: { id: userId },
      },
      relations: ['user', 'questions', 'mentalHealthEvaluation'],
    });

    if (!test) {
      throw new NotFoundException(
        `Test with ID ${testId} not found for user ${userId}`,
      );
    }

    return test;
  }

  async getLatestMentalHealthByUserId(
    userId: number,
  ): Promise<MentalHealthEvaluation> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const latestMentalHealth =
      await this.mentalHealthEvaluationRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

    if (!latestMentalHealth) {
      throw new NotFoundException(
        `No mental health evaluation found for user ${userId}`,
      );
    }

    return latestMentalHealth;
  }
}
