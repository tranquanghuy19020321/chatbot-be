import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MentalHealthEvaluation]),
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
