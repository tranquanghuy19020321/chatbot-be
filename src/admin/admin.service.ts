import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Test } from '../tests/entities/test.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { DailyEmoStatisticDto } from './dto/admin-dashboard-emo-response';
import { AdminDashboardSummaryDto } from './dto/admin-dashboard-summary.dto';
import { AdminTestQueryDto } from './dto/admin-test-query.dto';
import { MentalHealthStatisticQueryDto } from './dto/mental-health-statistic-query.dto';
import { DailyMentalHealthStatisticDto } from './dto/mental-health-statistic-response.dto';

dayjs.extend(isSameOrBefore);

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

  async getMentalHealthStatisitics(
    query: MentalHealthStatisticQueryDto,
  ): Promise<DailyMentalHealthStatisticDto[]> {
    const { startDate, endDate } = query;

    // Generate all dates between startDate and endDate using dayjs
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const allDates: string[] = [];

    let current = start;
    while (current.isSameOrBefore(end, 'day')) {
      allDates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }

    // Query to get daily averages using raw SQL
    const result = await this.mentalHealthEvaluationRepository
      .createQueryBuilder('mhe')
      .select([
        'DATE(mhe.created_at) as date',
        'AVG(mhe.stress_level) as avgStressLevel',
        'AVG(mhe.gad7_score) as avgGad7Score',
        'AVG(mhe.pss10_score) as avgPss10Score',
        'AVG(mhe.mbi_emotional_exhaustion) as avgMbiEmotionalExhaustion',
        'AVG(mhe.mbi_cynicism) as avgMbiCynicism',
        'AVG(mhe.mbi_professional_efficacy) as avgMbiProfessionalEfficacy',
        'COUNT(*) as totalRecords',
      ])
      .where('mhe.created_at >= :startDate', { startDate })
      .andWhere('mhe.created_at <= :endDate', { endDate })
      .groupBy('DATE(mhe.created_at)')
      .orderBy('DATE(mhe.created_at)', 'ASC')
      .getRawMany();

    // Create a map from the query results for quick lookup
    const dataMap = new Map();
    result.forEach((item) => {
      // Convert ISO date to YYYY-MM-DD format for consistency
      const date = dayjs(item.date).format('YYYY-MM-DD');
      dataMap.set(date, item);
    });

    // Generate complete result with all dates
    const formattedResult = allDates.map((date) => {
      const data = dataMap.get(date);

      if (data) {
        // If data exists for this date, calculate averages
        return {
          date,
          averages: {
            stressLevel:
              Math.round(parseFloat(data.avgStressLevel || '0') * 100) / 100,
            gad7Score:
              Math.round(parseFloat(data.avgGad7Score || '0') * 100) / 100,
            pss10Score:
              Math.round(parseFloat(data.avgPss10Score || '0') * 100) / 100,
            mbiEmotionalExhaustion:
              Math.round(
                parseFloat(data.avgMbiEmotionalExhaustion || '0') * 100,
              ) / 100,
            mbiCynicism:
              Math.round(parseFloat(data.avgMbiCynicism || '0') * 100) / 100,
            mbiProfessionalEfficacy:
              Math.round(
                parseFloat(data.avgMbiProfessionalEfficacy || '0') * 100,
              ) / 100,
          },
          totalRecords: parseInt(data.totalRecords),
        };
      } else {
        // If no data exists for this date, return zeros
        return {
          date,
          averages: {
            stressLevel: 0,
            gad7Score: 0,
            pss10Score: 0,
            mbiEmotionalExhaustion: 0,
            mbiCynicism: 0,
            mbiProfessionalEfficacy: 0,
          },
          totalRecords: 0,
        };
      }
    });

    return formattedResult;
  }

  async GetAdminDashboardSummary(): Promise<AdminDashboardSummaryDto> {
    const totalMember = await this.userRepository.count({
      where: {
        role: UserRole.USER,
      },
    });

    const memberEvaluateMentalHealth = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.mentalHealthEvaluations', 'mhe')
      .where('user.role = :role', { role: UserRole.USER })
      .getCount();

    return {
      totalMember,
      memberEvaluateMentalHealth,
    };
  }

  async GetADminDashboardEmo(
    query: MentalHealthStatisticQueryDto,
  ): Promise<DailyEmoStatisticDto[]> {
    const { startDate, endDate } = query;

    // Generate all dates between startDate and endDate using dayjs
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const allDates: string[] = [];

    let current = start;
    while (current.isSameOrBefore(end, 'day')) {
      allDates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }

    // Query to get the latest emotion state for each user on each date
    const result = await this.mentalHealthEvaluationRepository
      .createQueryBuilder('mhe')
      .select([
        'DATE(mhe.created_at) as date',
        'mhe.user_id as userId',
        'mhe.emotion_state as emotionState',
        'ROW_NUMBER() OVER (PARTITION BY DATE(mhe.created_at), mhe.user_id ORDER BY mhe.created_at DESC) as rn',
      ])
      .where('mhe.created_at >= :startDate', { startDate })
      .andWhere('mhe.created_at <= :endDate', { endDate })
      .innerJoin('mhe.user', 'user')
      .andWhere('user.role = :role', { role: UserRole.USER })
      .getRawMany();

    const latestRecords = result.filter((record) => record.rn === '1');

    const dataMap = new Map();
    latestRecords.forEach((item) => {
      const date = dayjs(item.date).format('YYYY-MM-DD');
      if (!dataMap.has(date)) {
        dataMap.set(date, {
          happy: 0,
          sad: 0,
          angry: 0,
          neutral: 0,
        });
      }

      const emoCount = dataMap.get(date);
      switch (item.emotionState) {
        case 'HAPPY':
          emoCount.happy++;
          break;
        case 'SAD':
          emoCount.sad++;
          break;
        case 'ANGRY':
          emoCount.angry++;
          break;
        case 'NEUTRAL':
          emoCount.neutral++;
          break;
      }
    });

    // Generate complete result with all dates
    const formattedResult = allDates.map((date) => {
      const emoData = dataMap.get(date) || {
        happy: 0,
        sad: 0,
        angry: 0,
        neutral: 0,
      };

      return {
        date,
        emo: emoData,
      };
    });

    return formattedResult;
  }
}
