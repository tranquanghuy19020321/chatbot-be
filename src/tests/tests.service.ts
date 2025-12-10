import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { PaginationTestDto } from './dto/pagination-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Question } from './entities/question.entity';
import { Test } from './entities/test.entity';

@Injectable()
export class TestsService {
  private ai: GoogleGenerativeAI;

  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
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

  async create(userId: number): Promise<Test> {
    const test = this.testRepository.create({
      user: { id: userId },
    });

    return await this.testRepository.save(test);
  }

  async generateQuestionsWithAI(): Promise<any> {
    try {
      const model = this.ai.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });

      const prompt = `Create 5 mental health assessment questions for evaluating user's mental state.

        Task:
        Based on the context, generate 4 groups, each group have 5 questions and return them in JSON format, no more extra text outside the JSON:
        
        {
          "pss": [
            {
              "question": "PSS-style question (Stress)", // ex: Gần đây bạn cảm thấy khó kiểm soát những điều xảy ra xung quanh mình như thế nào
              "type": "pss",
              "answer_option": [0, 1, 2, 3], // 0: Không bao giờ, 1: Thỉnh thoảng, 2: Khá thường xuyên, 3: Rất thường xuyên
            }
          ],
          "gad": [
            {
              "question": "GAD-style question (Anxiety)", // ex: Gần đây bạn có cảm thấy lo lắng quá mức về nhiều điều không?
              "type": "gad",
              "answer_option": [0, 1, 2, 3], // 0: Không, 1: Vài ngày, 2: Hơn một nửa số ngày, 3: Gần như mỗi ngày
            }
          ],
          "phq": [
            {
              "question": "PHQ-style question (Depression)", // ex: Bạn có cảm thấy buồn bã hoặc mất hứng thú gần đây không?
              "type": "phq",
              "answer_option": [0, 1, 2, 3], // 0: Không, 1: Vài ngày, 2: Hơn một nửa số ngày, 3: Gần như mỗi ngày
            }
          ],
          "mbi": [
            {
              "question": "mbi-style question (Burnout)", // ex: Bạn có cảm thấy kiệt sức về mặt tinh thần hoặc cảm xúc?
              "type": "mbi",
              "answer_option": [0, 1, 2, 3], // 0: Không, 1: Vài ngày, 2: Hơn một nửa số ngày, 3: Gần như mỗi ngày
            } 
          ]
        }

        Requirements:
        - Questions should be concise and easy to understand
        - Related to emotions, mood, sleep, anxiety, stress
        - Suitable for Vietnamese culture
        - Always return valid JSON format (array of strings)
        - Always return content in Vietnamese
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse JSON response
      const clean = text
        .replace(/```json/i, '')
        .replace(/```/g, '')
        .trim();

      let questionsData: any;
      try {
        questionsData = JSON.parse(clean);
      } catch (error) {
        throw new Error(
          `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }

      // Validate response structure
      if (
        !questionsData ||
        typeof questionsData !== 'object' ||
        !questionsData.pss ||
        !questionsData.gad ||
        !questionsData.phq ||
        !questionsData.mbi
      ) {
        throw new Error('AI response does not have the expected structure');
      }

      return questionsData;
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      // Trả về câu hỏi mặc định nếu có lỗi
      return {
        pss: [
          {
            question:
              'Trong tháng qua, bạn có thường xuyên cảm thấy bực bội vì những điều xảy ra ngoài tầm kiểm soát của mình không?',
            type: 'pss',
            answer_option: [0, 1, 2, 3],
          },
          {
            question:
              'Trong tháng qua, bạn có cảm thấy khó khăn trong việc kiểm soát những điều quan trọng trong cuộc sống không?',
            type: 'pss',
            answer_option: [0, 1, 2, 3],
          },
          {
            question:
              'Trong tháng qua, bạn có thường xuyên cảm thấy căng thẳng không?',
            type: 'pss',
            answer_option: [0, 1, 2, 3],
          },
          {
            question:
              'Trong tháng qua, bạn có cảm thấy tự tin về khả năng xử lý các vấn đề cá nhân không?',
            type: 'pss',
            answer_option: [0, 1, 2, 3],
          },
          {
            question:
              'Trong tháng qua, bạn có cảm thấy mọi thứ đang diễn ra theo ý muốn của mình không?',
            type: 'pss',
            answer_option: [0, 1, 2, 3],
          },
        ],
        gad: [
          {
            question: 'Cảm thấy lo lắng, bồn chồn hoặc căng thẳng',
            type: 'gad',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Không thể ngừng lo lắng hoặc kiểm soát sự lo lắng',
            type: 'gad',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Lo lắng quá nhiều về nhiều thứ khác nhau',
            type: 'gad',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Gặp khó khăn trong việc thư giãn',
            type: 'gad',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Bồn chồn đến mức khó có thể ngồi yên tại một chỗ',
            type: 'gad',
            answer_option: [0, 1, 2, 3],
          },
        ],
        phq: [
          {
            question:
              'Ít hứng thú hoặc không tìm được niềm vui trong các hoạt động',
            type: 'phq',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Cảm thấy buồn chán, chán nản hoặc tuyệt vọng',
            type: 'phq',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Gặp vấn đề về giấc ngủ hoặc ngủ quá nhiều',
            type: 'phq',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Cảm thấy mệt mỏi hoặc ít năng lượng',
            type: 'phq',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Ăn kém hoặc ăn quá nhiều',
            type: 'phq',
            answer_option: [0, 1, 2, 3],
          },
        ],
        mbi: [
          {
            question: 'Cảm thấy kiệt sức về mặt cảm xúc từ công việc',
            type: 'mbi',
            answer_option: [0, 1, 2, 3],
          },
          {
            question:
              'Cảm thấy mệt mỏi khi thức dậy và phải đối mặt với một ngày làm việc mới',
            type: 'mbi',
            answer_option: [0, 1, 2, 3],
          },
          {
            question:
              'Cảm thấy công việc đang làm cho bạn trở nên cứng nhắc về mặt cảm xúc',
            type: 'mbi',
            answer_option: [0, 1, 2, 3],
          },
          {
            question:
              'Cảm thấy không còn quan tâm đến những gì xảy ra với một số người',
            type: 'mbi',
            answer_option: [0, 1, 2, 3],
          },
          {
            question: 'Cảm thấy thất vọng với công việc của mình',
            type: 'mbi',
            answer_option: [0, 1, 2, 3],
          },
        ],
      };
    }
  }

  async findAll(userId: number, paginationDto?: PaginationTestDto): Promise<PaginatedResult<Test>> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const [tests, total] = await this.testRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: tests,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: number, userId: number): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['questions'],
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    return test;
  }

  async update(
    id: number,
    userId: number,
    updateTestDto: UpdateTestDto,
  ): Promise<Test> {
    const test = await this.findOne(id, userId);

    if (updateTestDto.questions) {
      // Xóa tất cả câu hỏi cũ
      await this.questionRepository.delete({ test: { id } });

      // Tạo câu hỏi mới
      test.questions = updateTestDto.questions.map((q) => ({
        question: q.question,
        answer: q.answer,
        test,
      })) as Question[];
    }

    return await this.testRepository.save(test);
  }

  async remove(id: number, userId: number): Promise<void> {
    const test = await this.findOne(id, userId);
    await this.testRepository.remove(test);
  }
}
