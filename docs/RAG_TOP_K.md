# RAG Top-K Query Functions

## Overview

Hệ thống cung cấp các functions để query top-k documents gần nhất cho RAG (Retrieval Augmented Generation) sử dụng DuckDB vector database.

## Functions Trong DatabaseService

### 1. `queryTopKForRAG` - Basic Top-K Query

Function cơ bản để query top-k documents gần nhất.

```typescript
async queryTopKForRAG(
  queryEmbedding: number[],
  k: number = 5,
  userId?: number,
  minSimilarity: number = 0.0,
): Promise<Array<{
  doc_id: string;
  conversation_id: string;
  user_id: number;
  text: string;
  similarity: number;  // Cosine similarity (0-1)
  distance: number;    // Euclidean distance
}>>
```

**Parameters:**
- `queryEmbedding`: Vector embedding của query
- `k`: Số lượng documents muốn lấy (default: 5)
- `userId`: Optional - Filter theo user_id
- `minSimilarity`: Optional - Ngưỡng similarity tối thiểu (0-1)

**Usage:**
```typescript
const results = await this.databaseService.queryTopKForRAG(
  queryEmbedding,
  5,          // top-5
  userId,
  0.5         // chỉ lấy docs có similarity >= 0.5
);
```

### 2. `queryTopKWithMetric` - Multiple Distance Metrics

Query top-k với các distance metrics khác nhau.

```typescript
async queryTopKWithMetric(
  queryEmbedding: number[],
  k: number = 5,
  metric: 'cosine' | 'euclidean' | 'manhattan' = 'cosine',
  userId?: number,
): Promise<any[]>
```

**Metrics:**
- `cosine`: Cosine similarity (higher = more similar)
- `euclidean`: Euclidean distance (lower = more similar)
- `manhattan`: Manhattan distance (lower = more similar)

**Usage:**
```typescript
// Cosine similarity
const results1 = await this.databaseService.queryTopKWithMetric(
  queryEmbedding,
  5,
  'cosine',
  userId
);

// Euclidean distance
const results2 = await this.databaseService.queryTopKWithMetric(
  queryEmbedding,
  5,
  'euclidean',
  userId
);
```

### 3. `hybridSearchTopK` - Hybrid Search

Kết hợp vector similarity với keyword search để tăng accuracy.

```typescript
async hybridSearchTopK(
  queryEmbedding: number[],
  keywords: string[],
  k: number = 5,
  userId?: number,
  alpha: number = 0.7,
): Promise<any[]>
```

**Parameters:**
- `queryEmbedding`: Vector embedding của query
- `keywords`: Array of keywords để search
- `k`: Top-k results
- `userId`: Optional user filter
- `alpha`: Weight cho vector vs keyword (0-1, default 0.7)
  - `alpha = 0.7`: 70% vector similarity, 30% keyword match
  - `alpha = 1.0`: 100% vector similarity
  - `alpha = 0.0`: 100% keyword match

**Usage:**
```typescript
const results = await this.databaseService.hybridSearchTopK(
  queryEmbedding,
  ['machine learning', 'AI', 'neural network'],
  5,
  userId,
  0.7  // 70% vector, 30% keyword
);
```

## Functions Trong ChatService

### 1. `queryTopKForRAG` - High-level RAG Query

Function cao cấp, tự động tạo embedding và query.

```typescript
async queryTopKForRAG(
  userId: number,
  query: string,
  k: number = 5,
): Promise<Array<{
  doc_id: string;
  conversation_id: string;
  user_id: number;
  text: string;
  similarity: number;
  distance: number;
}>>
```

**Usage:**
```typescript
const results = await this.chatService.queryTopKForRAG(
  userId,
  "What is machine learning?",
  5
);

results.forEach(doc => {
  console.log(`Similarity: ${doc.similarity.toFixed(3)}`);
  console.log(`Text: ${doc.text}`);
});
```

### 2. `generateRAGResponse` - RAG với Context

Generate response sử dụng top-k documents làm context.

```typescript
async generateRAGResponse(
  userId: number,
  query: string,
  k: number = 5,
): Promise<string>
```

**Usage:**
```typescript
const answer = await this.chatService.generateRAGResponse(
  userId,
  "Explain neural networks",
  5
);
console.log(answer);
```

### 3. `streamRAGResponse` - Streaming RAG

Stream response với RAG context.

```typescript
async streamRAGResponse(
  userId: number,
  query: string,
  k: number = 5,
): Promise<AsyncGenerator<string, void, unknown>>
```

**Usage:**
```typescript
const stream = await this.chatService.streamRAGResponse(
  userId,
  "What is deep learning?",
  5
);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

## Example: Complete RAG Flow

```typescript
import { Injectable } from '@nestjs/common';
import { ChatService } from './chat.service';
import { DatabaseService } from './database.service';

@Injectable()
export class RAGExample {
  constructor(
    private chatService: ChatService,
    private databaseService: DatabaseService,
  ) {}

  async example() {
    const userId = 1;
    const conversationId = 'conv-123';
    
    // 1. Insert documents vào database
    const documents = [
      "Machine learning is a subset of AI that enables computers to learn from data.",
      "Neural networks are computing systems inspired by biological neural networks.",
      "Deep learning uses multiple layers of neural networks for complex pattern recognition."
    ];
    
    for (const doc of documents) {
      await this.chatService.createEmbedding(userId, conversationId, doc);
    }
    
    // 2. Query top-k documents
    const query = "What is machine learning?";
    const topDocs = await this.chatService.queryTopKForRAG(userId, query, 3);
    
    console.log("Top-3 relevant documents:");
    topDocs.forEach((doc, idx) => {
      console.log(`${idx + 1}. [Similarity: ${doc.similarity.toFixed(3)}] ${doc.text}`);
    });
    
    // 3. Generate RAG response
    const answer = await this.chatService.generateRAGResponse(userId, query, 3);
    console.log("\nRAG Answer:", answer);
    
    // 4. Stream RAG response
    console.log("\nStreaming RAG Answer:");
    const stream = await this.chatService.streamRAGResponse(userId, query, 3);
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
  }
  
  async advancedExample() {
    const userId = 1;
    const query = "machine learning algorithms";
    
    // Tạo embedding
    const embeddingResponse = await this.chatService.ai
      .getGenerativeModel({ model: 'gemini-embedding-001' })
      .embedContent(query);
    const embedding = embeddingResponse.embedding.values;
    
    // Method 1: Basic top-k
    const results1 = await this.databaseService.queryTopKForRAG(
      embedding,
      5,
      userId,
      0.5
    );
    
    // Method 2: Different metric
    const results2 = await this.databaseService.queryTopKWithMetric(
      embedding,
      5,
      'euclidean',
      userId
    );
    
    // Method 3: Hybrid search
    const results3 = await this.databaseService.hybridSearchTopK(
      embedding,
      ['machine learning', 'algorithm', 'AI'],
      5,
      userId,
      0.7
    );
    
    return { results1, results2, results3 };
  }
}
```

## Performance Tips

1. **Index Optimization**: Database đã có indexes trên `user_id` và `conversation_id`
2. **Batch Processing**: Khi query nhiều documents, xem xét batch processing
3. **Caching**: Cache embeddings để tránh generate lại
4. **Similarity Threshold**: Dùng `minSimilarity` để filter out documents không relevant
5. **Hybrid Search**: Kết hợp vector + keyword cho accuracy tốt hơn

## Best Practices

### Chọn K
- **k = 3-5**: Cho most queries
- **k = 10**: Cho complex queries cần nhiều context
- **k = 1**: Khi chỉ cần document gần nhất

### Chọn Metric
- **Cosine**: Best cho text embeddings (default)
- **Euclidean**: Khi magnitude matters
- **Manhattan**: Fast approximate similarity

### Chọn Alpha (Hybrid Search)
- **alpha = 0.7-0.8**: Balanced (recommended)
- **alpha = 0.9-1.0**: Prefer semantic similarity
- **alpha = 0.0-0.5**: Prefer keyword matching

## API Endpoints Example

```typescript
// chat.controller.ts
@Post('query-rag')
async queryRAG(
  @Body() body: { query: string; k?: number },
  @CurrentUser() user: any,
) {
  return this.chatService.queryTopKForRAG(
    user.id,
    body.query,
    body.k || 5
  );
}

@Post('chat-rag')
async chatRAG(
  @Body() body: { query: string; k?: number },
  @CurrentUser() user: any,
) {
  return this.chatService.generateRAGResponse(
    user.id,
    body.query,
    body.k || 5
  );
}

@Post('chat-rag-stream')
async chatRAGStream(
  @Body() body: { query: string; k?: number },
  @CurrentUser() user: any,
  @Res() res: Response,
) {
  const stream = await this.chatService.streamRAGResponse(
    user.id,
    body.query,
    body.k || 5
  );
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
  }
  
  res.end();
}
```
