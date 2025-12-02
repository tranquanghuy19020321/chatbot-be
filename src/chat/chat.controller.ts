import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';

interface UserPayload {
  userId: number;
  email: string;
  name: string;
}

interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Chat AI' })
  @ApiBody({ type: ChatQueryDto })
  @ApiResponse({})
  async chat(
    @Body() chatQueryDto: ChatQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Check if user is authenticated
      const user = req.user;
      let stream: AsyncGenerator<string, void, unknown>;
      console.log('User info:', user);

      if (user && user.userId) {
        // Authenticated user - use RAG response
        stream = await this.chatService.streamRAGResponse(
          user.userId,
          chatQueryDto.conversation_id,
          chatQueryDto.query,
        );
      } else {
        // Public user - use normal chat response
        stream = await this.chatService.streamChatResponse(chatQueryDto.query);
      }

      // Stream response chunks to client
      for await (const text of stream) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Error proxying request to Gemini:', error);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to process request',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
}
