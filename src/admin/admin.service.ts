import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private ai: GoogleGenerativeAI;

  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MentalHealthEvaluation)
    private readonly mentalHealthEvaluationRepository: Repository<MentalHealthEvaluation>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.ai = new GoogleGenerativeAI(apiKey);
  }

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

  async analyzeUserStatistic(
    userId: number,
    query: MentalHealthStatisticQueryDto,
  ): Promise<DailyMentalHealthStatisticDto[]> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.getUserMentalHealthStatistics(userId, query);
  }

  async getUserMentalHealthStatistics(
    userId: number,
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

    // Query to get daily averages for specific user using raw SQL
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
      .where('mhe.user_id = :userId', { userId })
      .andWhere('mhe.created_at >= :startDate', { startDate })
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

  async getUserEmoStatistic(
    userId: number,
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

    // Query to get the latest emotion state for specific user on each date
    const result = await this.mentalHealthEvaluationRepository
      .createQueryBuilder('mhe')
      .select([
        'DATE(mhe.created_at) as date',
        'mhe.emotion_state as emotionState',
        'ROW_NUMBER() OVER (PARTITION BY DATE(mhe.created_at) ORDER BY mhe.created_at DESC) as rn',
      ])
      .where('mhe.user_id = :userId', { userId })
      .andWhere('mhe.created_at >= :startDate', { startDate })
      .andWhere('mhe.created_at <= :endDate', { endDate })
      .getRawMany();

    const latestRecords = result.filter((record) => record.rn === '1');

    const dataMap = new Map();
    latestRecords.forEach((item) => {
      const date = dayjs(item.date).format('YYYY-MM-DD');
      dataMap.set(date, item.emotionState);
    });

    // Generate complete result with all dates
    const formattedResult = allDates.map((date) => {
      const emotionState = dataMap.get(date);
      const emoData = {
        happy: emotionState === 'HAPPY' ? 1 : 0,
        sad: emotionState === 'SAD' ? 1 : 0,
        angry: emotionState === 'ANGRY' ? 1 : 0,
        neutral: emotionState === 'NEUTRAL' ? 1 : 0,
      };

      return {
        date,
        emo: emoData,
      };
    });

    return formattedResult;
  }

  async streamAnalyzeStatisticResponse(
    query: MentalHealthStatisticQueryDto,
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const mentalHealthStatistic = await this.getMentalHealthStatisitics(query);
    const emoStatistic = await this.GetADminDashboardEmo(query);
    const summary = await this.GetAdminDashboardSummary();

    const prompt = `
      You are an AI assistant specialized in analyzing aggregated mental health data for an educational admin dashboard.
      CONTEXT:
      The data represents aggregated mental health evaluations of students over the period from ${query?.startDate} to ${query?.endDate}. 
      All values are group-level averages or counts, not individual diagnoses.

      YOUR TASK:
      Analyze the provided data based on:
      1. Daily average psychological indicators:
        - Stress Level
        - GAD-7 (anxiety indicator)
        - PSS-10 (perceived stress)
        - MBI:
          - Emotional Exhaustion
          - Cynicism
          - Professional Efficacy
        - Number of records per day

      2. Daily emotional distribution:
        - happy, sad, angry, neutral

      3. Overall participation statistics:
        - Total members
        - Number of students who completed mental health evaluations

      ANALYSIS REQUIREMENTS:
      - Identify overall trends across ${query?.startDate} to ${query?.endDate} (increasing, decreasing, stabilizing).
      - Interpret indicator levels as low / moderate / high based on commonly accepted scale meanings, WITHOUT making medical or clinical diagnoses.
      - Compare psychological indicators with emotional distribution patterns.
      - Assess how the number of daily records affects data reliability.
      - Analyze participation rate and comment on data representativeness.
      - Only return in Vietnamese.

      OUTPUT GUIDELINES:
      - Write in clear, professional, and neutral English.
      - Structure the output into clear sections:
        1. Data Overview
        2. Mental Health Trends
        3. Emotional Pattern Analysis
        4. Potential Risk Signals
        5. Data Reliability & Participation
        6. System-Level Recommendations

      CONSTRAINTS:
      - Do NOT provide medical diagnoses or individual treatment advice.
      - Do NOT use judgmental or alarmist language.
      - Focus on population-level insights only.
      - 'totalRecords' is the number of users evaluated that day

      INPUT DATA:
      Mental Health Statistics: ${JSON.stringify(mentalHealthStatistic)}
      Emotional Statistics: ${JSON.stringify(emoStatistic)}
      Summary Statistics: ${JSON.stringify(summary)}

      Return a concise yet comprehensive analysis suitable for direct display on an admin dashboard.`;

    const model = this.ai.getGenerativeModel({
      model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash'),
    });
    const result = await model.generateContentStream(prompt);

    return this.streamGenerator(result.stream);
  }

  async streamAnalyzeUserStatisticResponse(
    userId: number,
    query: MentalHealthStatisticQueryDto,
  ): Promise<AsyncGenerator<string, void, unknown>> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const mentalHealthStatistic = await this.getUserMentalHealthStatistics(
      userId,
      query,
    );
    const emoStatistic = await this.getUserEmoStatistic(userId, query);

    const prompt = `
      You are an AI assistant specialized in analyzing individual mental health data for an educational admin dashboard.
      CONTEXT:
      The data represents mental health evaluations of a specific student (User ID: ${userId}, Name: ${user.name}) over the period from ${query?.startDate} to ${query?.endDate}. 
      This is individual-level data, not group averages.

      YOUR TASK:
      Analyze the provided data based on:
      1. Daily psychological indicators for this specific user:
        - Stress Level
        - GAD-7 (anxiety indicator)
        - PSS-10 (perceived stress)
        - MBI:
          - Emotional Exhaustion
          - Cynicism
          - Professional Efficacy
        - Number of records per day

      2. Daily emotional state for this user:
        - happy, sad, angry, neutral (0 or 1 for each day)

      ANALYSIS REQUIREMENTS:
      - Identify personal trends across ${query?.startDate} to ${query?.endDate} (improving, declining, fluctuating).
      - Interpret indicator levels as low / moderate / high based on commonly accepted scale meanings, WITHOUT making medical or clinical diagnoses.
      - Analyze patterns between psychological indicators and emotional states.
      - Assess data consistency and frequency of evaluations.
      - Identify concerning patterns or positive developments.
      - Chỉ trả lời bằng tiếng Việt.

      OUTPUT GUIDELINES:
      - Viết bằng tiếng Việt rõ ràng, chuyên nghiệp và trung tính.
      - Cấu trúc output thành các phần rõ ràng:
        1. Tổng quan dữ liệu cá nhân
        2. Xu hướng sức khỏe tâm thần
        3. Phân tích trạng thái cảm xúc
        4. Các tín hiệu cần chú ý
        5. Tính nhất quán dữ liệu
        6. Khuyến nghị hỗ trợ

      CONSTRAINTS:
      - KHÔNG đưa ra chẩn đoán y tế hay lời khuyên điều trị cá nhân.
      - KHÔNG sử dụng ngôn ngữ phán xét hoặc gây lo lắng.
      - Tập trung vào insights cá nhân nhưng phù hợp cho admin xem.
      - 'totalRecords' là số lần đánh giá của user trong ngày đó

      INPUT DATA:
      User Information: User ID ${userId}, Name: ${user.name}
      Mental Health Statistics: ${JSON.stringify(mentalHealthStatistic)}
      Emotional Statistics: ${JSON.stringify(emoStatistic)}

      Trả về một phân tích ngắn gọn nhưng toàn diện phù hợp để hiển thị trực tiếp trên dashboard admin.`;

    const model = this.ai.getGenerativeModel({
      model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash'),
    });
    const result = await model.generateContentStream(prompt);

    return this.streamGenerator(result.stream);
  }

  private async *streamGenerator(
    stream: AsyncIterable<any>,
  ): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream) {
      const text = chunk.text();
      yield text;
    }
  }
}
