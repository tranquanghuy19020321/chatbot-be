import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ChatService {
  private ai: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
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
    const model = this.ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
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

    // Log kết quả để debug (có thể disable trong production)
    if (results.length > 0) {
      console.log(
        `Found ${results.length} relevant documents for query: "${query.substring(0, 50)}..."`,
      );
      console.log(
        `Similarity range: ${results[0]?.similarity.toFixed(3)} - ${results[results.length - 1]?.similarity.toFixed(3)}`,
      );
    } else {
      console.log(`No documents found with similarity  for user ${userId}`);
    }

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
    
      Context:
      ${context}

      Question: ${query}

      Answer:`;

    console.log(prompt);

    // Generate streaming response
    const model = this.ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
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
