import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as duckdb from 'duckdb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: duckdb.Database;
  private connection: duckdb.Connection;

  async onModuleInit() {
    await this.initializeDatabase();
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.closeConnection();
    }
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Tạo database file trong thư mục data
      this.db = new duckdb.Database('./data/vectordb.duckdb', (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.connection = this.db.connect();
        this.initializeSchema()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async initializeSchema(): Promise<void> {
    const queries = [
      // Install và load extension VSS cho vector similarity search
      `INSTALL vss;`,
      `LOAD vss;`,

      // Tạo bảng documents cho RAG
      `CREATE TABLE IF NOT EXISTS documents (
        doc_id TEXT,
        conversation_id TEXT,
        user_id BIGINT,
        text TEXT,
        embedding DOUBLE[]
      );`,

      // Tạo index cho tìm kiếm nhanh hơn
      `CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_documents_conv ON documents(conversation_id);`,
    ];

    for (const query of queries) {
      await this.run(query);
    }
  }

  private async closeConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Execute query không trả về kết quả (INSERT, UPDATE, DELETE, CREATE)
  async run(query: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.run(query, ...params, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Execute query và trả về tất cả kết quả
  async all<T = any>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.connection.all(query, ...params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows as T[]);
      });
    });
  }

  // Execute query và trả về 1 kết quả
  async get<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const rows = await this.all<T>(query, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // Insert document với embedding
  async insertDocument(
    docId: string,
    conversationId: string,
    userId: number,
    text: string,
    embedding: number[],
  ): Promise<void> {
    const embeddingStr = `[${embedding.join(',')}]`;
    const query = `
      INSERT INTO documents (doc_id, conversation_id, user_id, text, embedding)
      VALUES (?, ?, ?, ?, ${embeddingStr}::DOUBLE[])
    `;
    await this.run(query, [docId, conversationId, userId, text]);
  }

  // Query top K documents dựa trên vector similarity cho RAG
  async queryTopKForRAG(
    userId: number,
    queryEmbedding: number[],
    topK: number = 5,
  ): Promise<
    Array<{
      doc_id: string;
      conversation_id: string;
      text: string;
      similarity: number;
    }>
  > {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    const query = `
      SELECT 
        doc_id,
        conversation_id,
        text,
        list_cosine_similarity(embedding, ${embeddingStr}::DOUBLE[]) as similarity
      FROM documents
      WHERE user_id = ?
      ORDER BY similarity DESC
      LIMIT ?
    `;

    return await this.all(query, [userId, topK]);
  }

  // Lấy k câu hỏi gần nhất của user theo thời gian insert
  async getRecentQuestionsByUserId(
    userId: number,
    k: number = 10,
  ): Promise<
    Array<{
      doc_id: string;
      conversation_id: string;
      text: string;
    }>
  > {
    const query = `
      SELECT 
        doc_id,
        conversation_id,
        text,
        rowid
      FROM documents
      WHERE user_id = ?
      ORDER BY rowid DESC
      LIMIT ?
    `;

    return await this.all(query, [userId, k]);
  }
}
