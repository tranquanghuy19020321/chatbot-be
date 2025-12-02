# DuckDB Vector Database Setup

## Installation

DuckDB đã được cài đặt và tích hợp vào NestJS project:

```bash
npm install duckdb
```

## Structure

```
src/
  database/
    database.module.ts    # DuckDB Module (Global)
    database.service.ts   # DuckDB Service với các helper methods
```

## Schema

### Table: `conversations`
Lưu trữ toàn bộ conversation history giữa user và bot.

| Column | Type | Description |
|--------|------|-------------|
| conversation_id | BIGINT | ID của conversation |
| user_id | BIGINT | ID của user |
| timestamp | TIMESTAMP | Thời gian message (auto) |
| role | VARCHAR | 'user' hoặc 'bot' |
| content | TEXT | Nội dung message |

**Indexes:**
- `idx_conversations_user` trên `user_id`
- `idx_conversations_conv` trên `conversation_id`

### Table: `documents`
Lưu trữ text documents với embeddings cho RAG (Retrieval Augmented Generation).

| Column | Type | Description |
|--------|------|-------------|
| doc_id | BIGINT | ID của document |
| conversation_id | BIGINT | ID conversation liên quan |
| user_id | BIGINT | ID của user |
| text | TEXT | Nội dung text |
| embedding | DOUBLE[] | Vector embedding |

**Indexes:**
- `idx_documents_user` trên `user_id`
- `idx_documents_conv` trên `conversation_id`

## Usage

### Inject DatabaseService

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class YourService {
  constructor(private readonly db: DatabaseService) {}

  async example() {
    // Your code here
  }
}
```

### Insert Conversation

```typescript
await this.db.insertConversation(
  conversationId,
  userId,
  'user',
  'Hello, how are you?'
);

await this.db.insertConversation(
  conversationId,
  userId,
  'bot',
  'I am doing well, thank you!'
);
```

### Get Conversation History

```typescript
const history = await this.db.getConversationHistory(conversationId, 50);
// Returns last 50 messages
```

### Insert Document với Embedding

```typescript
const embedding = [0.1, 0.2, 0.3, ...]; // Vector từ embedding model
await this.db.insertDocument(
  docId,
  conversationId,
  userId,
  'Document text content here',
  embedding
);
```

### Vector Similarity Search

```typescript
const queryEmbedding = [0.15, 0.25, 0.35, ...]; // Query embedding
const similar = await this.db.searchSimilarDocuments(
  queryEmbedding,
  userId,
  5 // top 5 results
);

// Returns documents sorted by cosine similarity
```

### Get User Conversations

```typescript
const conversations = await this.db.getUserConversations(userId, 10);
// Returns list of conversation IDs với timestamps
```

## Vector Similarity Search

DuckDB sử dụng VSS (Vector Similarity Search) extension với:
- **Cosine Similarity**: `array_cosine_similarity(embedding1, embedding2)`
- Automatic optimization cho vector operations
- Efficient storage cho DOUBLE[] arrays

## Database File

Database được lưu tại: `./data/vectordb.duckdb`

File này được tự động tạo khi app khởi động và đã được thêm vào `.gitignore`.

## Advanced Queries

DatabaseService cung cấp các low-level methods:

```typescript
// Execute query without returning results
await this.db.run('INSERT INTO ...', [params]);

// Get all results
const results = await this.db.all<YourType>('SELECT * FROM ...', [params]);

// Get single result
const result = await this.db.get<YourType>('SELECT * FROM ... LIMIT 1', [params]);
```

## Notes

- DatabaseModule được đánh dấu `@Global()` nên có thể inject ở bất kỳ đâu
- Connection tự động đóng khi app shutdown
- Schema tự động initialize khi app khởi động
- VSS extension được load automatically cho vector operations
