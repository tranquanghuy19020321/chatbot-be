# Auto Trigger Mental Health Evaluation

## Trigger After Every Chat Message

### Option 1: Non-blocking Background Update (Recommended)
Update evaluation sau mỗi lần user chat, nhưng không block response.

```typescript
// In chat.controller.ts - chat() method

@Post()
async chat(
  @Body() chatQueryDto: ChatQueryDto,
  @Req() req: AuthenticatedRequest,
  @Res() res: Response,
): Promise<void> {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const user = req.user;
    let stream: AsyncGenerator<string, void, unknown>;

    if (user && user.userId) {
      // Save user message to vectordb
      await this.chatService.createEmbedding(
        user.userId,
        chatQueryDto.conversation_id,
        chatQueryDto.query,
      );

      stream = await this.chatService.streamRAGResponse(
        user.userId,
        chatQueryDto.conversation_id,
        chatQueryDto.query,
      );

      // 🔥 TRIGGER EVALUATION UPDATE (non-blocking)
      // Chạy background, không đợi kết quả
      this.chatService
        .getMentalHealthEvaluationAndSave(user.userId)
        .catch((err) => {
          console.error('Background eval update failed:', err);
        });
    } else {
      stream = await this.chatService.streamChatResponse(chatQueryDto.query);
    }

    // Stream response
    for await (const text of stream) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in chat:', error);
    if (!res.headersSent) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to process request',
      });
    }
  }
}
```

### Option 2: After Stream Complete
Update sau khi stream chat hoàn tất:

```typescript
@Post()
async chat(...): Promise<void> {
  try {
    // ... setup stream ...

    // Stream response
    for await (const text of stream) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

    // 🔥 Update evaluation AFTER response sent
    if (user && user.userId) {
      this.chatService
        .getMentalHealthEvaluationAndSave(user.userId)
        .catch((err) => console.error('Eval update error:', err));
    }
  } catch (error) {
    // ... error handling ...
  }
}
```

### Option 3: Conditional Update (Smart)
Chỉ update khi có nhiều message mới:

```typescript
// Add counter in service
private userMessageCount = new Map<number, number>();

async chat(...): Promise<void> {
  if (user && user.userId) {
    // Increment message count
    const count = (this.userMessageCount.get(user.userId) || 0) + 1;
    this.userMessageCount.set(user.userId, count);

    // Update evaluation every 5 messages
    if (count % 5 === 0) {
      this.chatService
        .getMentalHealthEvaluationAndSave(user.userId)
        .catch((err) => console.error('Eval update error:', err));
    }
  }
}
```

## Scheduled Update (Cronjob)

### Install @nestjs/schedule
```bash
npm install @nestjs/schedule
```

### Create Task Service
```typescript
// src/tasks/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from '../chat/chat.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private chatService: ChatService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Run every 3 hours
  @Cron('0 */3 * * *')
  async updateActiveMentalHealthEvaluations() {
    this.logger.log('Starting mental health evaluation updates...');

    try {
      // Get users who have chatted in last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const activeUsers = await this.userRepository
        .createQueryBuilder('user')
        .select('DISTINCT user.id')
        .innerJoin('documents', 'doc', 'doc.user_id = user.id')
        .where('doc.created_at >= :yesterday', { yesterday })
        .getRawMany();

      this.logger.log(`Found ${activeUsers.length} active users`);

      // Update evaluations
      for (const { user_id } of activeUsers) {
        try {
          await this.chatService.getMentalHealthEvaluationAndSave(user_id);
          this.logger.debug(`Updated evaluation for user ${user_id}`);
        } catch (error) {
          this.logger.error(
            `Failed to update user ${user_id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      this.logger.log('Mental health evaluation updates completed');
    } catch (error) {
      this.logger.error('Cronjob failed:', error);
    }
  }

  // Daily summary at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailySummary() {
    this.logger.log('Generating daily mental health summary...');
    // TODO: Generate summary/report
  }
}
```

### Register Task Module
```typescript
// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from '../chat/chat.module';
import { User } from '../users/entities/user.entity';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ChatModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
```

```typescript
// src/app.module.ts
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // ... existing imports
    ScheduleModule.forRoot(),
    TasksModule,
  ],
  // ...
})
export class AppModule {}
```

## Webhook/Event-based Update

### Using EventEmitter
```typescript
// src/chat/chat.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

export class ChatService {
  constructor(
    // ... existing deps
    private eventEmitter: EventEmitter2,
  ) {}

  async streamRAGResponse(...): Promise<...> {
    // ... existing code ...

    // Emit event after response
    this.eventEmitter.emit('chat.completed', {
      userId,
      conversationId,
      messageCount: await this.getMessageCount(userId),
    });

    return stream;
  }
}

// src/chat/chat.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatService } from './chat.service';

@Injectable()
export class ChatListener {
  constructor(private chatService: ChatService) {}

  @OnEvent('chat.completed')
  async handleChatCompleted(payload: { userId: number }) {
    // Update evaluation after chat
    try {
      await this.chatService.getMentalHealthEvaluationAndSave(payload.userId);
    } catch (error) {
      console.error('Event-based eval update failed:', error);
    }
  }
}
```

## Recommendation

**Best Practice**: Combine multiple approaches

1. **After every 3-5 messages** (lightweight trigger)
2. **Cronjob every 3 hours** (catch missed updates)
3. **Manual endpoint** (on-demand for user/admin)

This ensures:
- Timely updates
- No overload on AI API
- Fault tolerance
- Flexibility
