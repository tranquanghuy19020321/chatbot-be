import { GoogleGenerativeAI } from '@google/generative-ai';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { DatabaseService } from '../database/database.service';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { MentalHealthEvaluationDto } from './dto/mental-health-evaluation.dto';

@Injectable()
export class ChatService {
  private ai: GoogleGenerativeAI;
  private readonly TWO_HOURS_IN_MS = 4 * 60 * 60 * 1000; // 2 tiếng
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 giờ (seconds)

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
    @InjectRepository(MentalHealthEvaluation)
    private mentalHealthEvaluationRepository: Repository<MentalHealthEvaluation>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async createEmbedding(
    user_id: number,
    conversation_id: string,
    input: string,
  ): Promise<null> {
    const response = await this.ai
      .getGenerativeModel({ model: 'gemini-embedding-001' })
      .embedContent(input);

    const embedding = response?.embedding?.values;
    const { v4: uuidv4 } = await import('uuid');
    const docId = uuidv4();
    await this.databaseService.insertDocument(
      docId,
      conversation_id,
      user_id,
      input,
      embedding,
    );

    return null;
  }

  async streamChatResponse(
    query: string,
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const model = this.ai.getGenerativeModel({
      model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash'),
    });
    const result = await model.generateContentStream(query);

    return this.streamGenerator(result.stream);
  }

  /**
   * Query top-k documents gần nhất cho RAG (optimized version)
   * @param userId - User ID để filter documents
   * @param conversationId - Conversation ID để filter và lưu query
   * @param query - Query string
   * @param k - Số lượng documents cần lấy (default: 5)
   * @param minSimilarity - Ngưỡng similarity tối thiểu (default: 0.5)
   * @returns Array of top-k nearest documents với similarity > threshold
   */
  async queryTopKForRAG(
    userId: number,
    conversationId: string,
    query: string,
    k: number = 5,
  ): Promise<
    Array<{
      doc_id: string;
      conversation_id: string;
      text: string;
      similarity: number;
    }>
  > {
    // Generate embedding cho query
    const embeddingResponse = await this.ai
      .getGenerativeModel({ model: 'gemini-embedding-001' })
      .embedContent(query);

    const queryEmbedding = embeddingResponse?.embedding?.values;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      throw new Error('Failed to generate valid embedding for query');
    }

    // Query top-k documents với similarity filtering
    const results = await this.databaseService.queryTopKForRAG(
      userId,
      queryEmbedding,
      k,
    );

    // Lưu query vào database cho tracking history
    const { v4: uuidv4 } = await import('uuid');
    const docId = uuidv4();

    await this.databaseService.insertDocument(
      docId,
      conversationId,
      userId,
      query,
      queryEmbedding,
    );

    return results;
  }

  /**
   * Stream RAG response với context từ top-k documents
   */
  async streamRAGResponse(
    userId: number,
    conversation_id: string,
    query: string,
    k: number = 10,
  ): Promise<AsyncGenerator<string, void, unknown>> {
    // Lấy top-k documents relevant
    const relevantDocs = await this.queryTopKForRAG(
      userId,
      conversation_id,
      query,
      k,
    );

    // Build context từ relevant documents
    const context = relevantDocs
      .map(
        (doc, idx) =>
          `[Document ${idx + 1}] (Similarity: ${doc.similarity.toFixed(3)})\n${doc.text}`,
      )
      .join('\n\n');

    // Build prompt với context
    const prompt = `Based on the following system, context, answer the question.

      System:
        You are a compassionate mental health support assistant.
        You must:
        - Remember the user's emotional journey
        - Be empathetic
        - Avoid medical diagnosis
        - Offer emotional support not clinical judgement
        - Answer in vietnamese
        - Context is the lastest question of the user
    
      Context:
      ${context}

      Question: ${query}

      Answer:`;

    // Generate streaming response
    const model = this.ai.getGenerativeModel({
      model: this.configService.get<string>(
        'GEMINI_SUPER_MODEL',
        'gemini-2.5-flash',
      ),
    });
    const result = await model.generateContentStream(prompt);

    return this.streamGenerator(result.stream);
  }

  async getMentalHeathEvaluation(
    userId: number,
    conversationId: string,
    query: string,
    k: number = 10,
  ): Promise<MentalHealthEvaluationDto> {
    // Lấy k câu hỏi gần nhất của user
    const recentQuestions =
      await this.databaseService.getRecentQuestionsByUserId(userId, k);

    // Build context từ recent questions
    const context = recentQuestions
      .map((doc, idx) => `[Message ${idx + 1}]\n${doc.text}`)
      .join('\n\n');

    const prompt = `
      Based on the following system and context, analyze the user's psychological state and return the required metrics.

      System:
        You are a compassionate virtual psychological assessment assistant.
        You must:
        - Provide emotional understanding, not clinical diagnosis
        - Use international psychological scales correctly (GAD-7, PSS-10, MBI-SS)
        - Be objective, concise, and avoid medical claims
        - Always answer in Vietnamese
        - Context below is the latest message from the user

      Context:
      ${context}

      Task:
      Based on the context, evaluate and return the following fields in JSON format, no more extra text outside the JSON:

      {
        "emotion_state": "<HAPPY | SAD | ANGRY | NEUTRAL>",
        "stress_level": <0-100>, 
        "gad7_score": <0-21>,
        "gad7_assessment": "<mức độ>",
        "pss10_score": <0-40>,
        "pss10_assessment": "<mức độ>",
        "mbi_ss_score": {
            "emotional_exhaustion": <0-30>,
            "cynicism": <0-30>,
            "professional_efficacy": <0-30>,
            "assessment": "<mức độ>"
        },
        "overall_mental_health": "<đánh giá ngắn gọn, tối đa 3 câu>"
      }

      Rules:
      - "emotion_state" must be EXACTLY one of: HAPPY, SAD, ANGRY, NEUTRAL
      - If context is unclear, infer the most *likely* state based on language/emotion patterns
      - Scale calculations must follow official scoring guidelines
      - "overall_mental_health" must be empathetic, non-judgmental, and non-medical
      - If context is insufficient, return 0 for all fields and message the user to provide more information.
      - ALWAYS respond in Vietnamese

      Question: ${query}

      Answer:
      `;

    // Generate evaluation response
    const model = this.ai.getGenerativeModel({
      model: this.configService.get<string>(
        'GEMINI_MODEL',
        'gemini-2.5-flash-lite',
      ),
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const clean = text
      .replace(/```json/i, '')
      .replace(/```/g, '')
      .trim();

    let data;
    try {
      data = JSON.parse(clean);
      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new Error(`Failed to generate evaluation JSON response: }`);
    }
  }

  async getMentalHealthEvaluationAndSave(
    userId: number,
    k: number = 10,
  ): Promise<MentalHealthEvaluationDto> {
    const cacheKey = `mental_health_eval:${userId}`;

    // Check cache
    const cachedData = await this.cacheManager.get<{
      evaluationId: number;
      lastUpdated: number;
    }>(cacheKey);

    const now = Date.now();

    // Tính toán evaluation mới
    const data = await this.getMentalHeathEvaluation(
      userId,
      '',
      'Đánh giá tình trạng sức khỏe tinh thần của tôi',
      k,
    );

    // Nếu có cache và chưa đủ 2 tiếng thì skip
    if (cachedData && now - cachedData.lastUpdated < this.TWO_HOURS_IN_MS) {
      return data;
    }

    let evaluation: MentalHealthEvaluation | null = null;

    // Nếu có cache, update record hiện tại
    if (cachedData) {
      evaluation = await this.mentalHealthEvaluationRepository.findOne({
        where: { id: cachedData.evaluationId },
      });

      if (evaluation) {
        // Update existing record
        evaluation.emotionState = data.emotion_state;
        evaluation.stressLevel = data.stress_level;
        evaluation.gad7Score = data.gad7_score;
        evaluation.gad7Assessment = data.gad7_assessment;
        evaluation.pss10Score = data.pss10_score;
        evaluation.pss10Assessment = data.pss10_assessment;
        evaluation.mbiEmotionalExhaustion =
          data.mbi_ss_score.emotional_exhaustion;
        evaluation.mbiCynicism = data.mbi_ss_score.cynicism;
        evaluation.mbiProfessionalEfficacy =
          data.mbi_ss_score.professional_efficacy;
        evaluation.mbiAssessment = data.mbi_ss_score.assessment;
        evaluation.overallMentalHealth = data.overall_mental_health;
      }
    }

    // nếu chưa có cache tạo record mới
    if (!evaluation) {
      // Tạo record mới
      evaluation = this.mentalHealthEvaluationRepository.create({
        userId,
        emotionState: data.emotion_state,
        stressLevel: data.stress_level,
        gad7Score: data.gad7_score,
        gad7Assessment: data.gad7_assessment,
        pss10Score: data.pss10_score,
        pss10Assessment: data.pss10_assessment,
        mbiEmotionalExhaustion: data.mbi_ss_score.emotional_exhaustion,
        mbiCynicism: data.mbi_ss_score.cynicism,
        mbiProfessionalEfficacy: data.mbi_ss_score.professional_efficacy,
        mbiAssessment: data.mbi_ss_score.assessment,
        overallMentalHealth: data.overall_mental_health,
      });
    }

    await this.mentalHealthEvaluationRepository.save(evaluation);

    // Update cache với TTL 24h
    await this.cacheManager.set(
      cacheKey,
      {
        evaluationId: evaluation.id,
        lastUpdated: now,
      },
      this.CACHE_TTL * 1000, // convert to milliseconds
    );

    return data;
  }

  async getMentalHealthEvaluationHistory(
    userId: number,
    limit: number = 10,
  ): Promise<MentalHealthEvaluation[]> {
    return this.mentalHealthEvaluationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
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
