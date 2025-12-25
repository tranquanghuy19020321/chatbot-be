import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Test } from '../tests/entities/test.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { DailyEmoStatisticDto } from './dto/admin-dashboard-emo-response';
import { AdminDashboardSummaryDto } from './dto/admin-dashboard-summary.dto';
import { AdminTestQueryDto } from './dto/admin-test-query.dto';
import { MentalHealthStatisticQueryDto } from './dto/mental-health-statistic-query.dto';
import { DailyMentalHealthStatisticDto } from './dto/mental-health-statistic-response.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users/:userId/tests')
  @ApiOperation({
    summary: 'Get all tests for a specific user (Admin only)',
    description:
      'Retrieve paginated list of tests for a given user ID. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user whose tests to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tests retrieved successfully',
    type: Test,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getTestsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: Omit<AdminTestQueryDto, 'userId'>,
  ): Promise<PaginatedResult<Test>> {
    const fullQuery: AdminTestQueryDto = { ...query, userId };
    return this.adminService.getTestsByUserId(fullQuery);
  }

  @Get('users/:userId/tests/:testId')
  @ApiOperation({
    summary: 'Get detailed test information for a specific user (Admin only)',
    description:
      'Retrieve detailed information about a specific test for a given user. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user who owns the test',
    example: 1,
  })
  @ApiParam({
    name: 'testId',
    description: 'ID of the test to retrieve',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Test details retrieved successfully',
    type: Test,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'User or test not found',
  })
  async getTestDetailByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('testId', ParseIntPipe) testId: number,
  ): Promise<Test> {
    return this.adminService.getTestDetailByUserId(testId, userId);
  }

  @Get('users/:userId/mental-health/latest')
  @ApiOperation({
    summary:
      'Get latest mental health evaluation for a specific user (Admin only)',
    description:
      'Retrieve the most recent mental health evaluation for a given user ID. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'userId',
    description:
      'ID of the user whose latest mental health evaluation to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Latest mental health evaluation retrieved successfully',
    type: MentalHealthEvaluation,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no mental health evaluation available',
  })
  async getLatestMentalHealthByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<MentalHealthEvaluation> {
    return this.adminService.getLatestMentalHealthByUserId(userId);
  }

  @Get('/dashboard/mental-health-statistic')
  @ApiOperation({
    summary: 'Get daily mental health statistics for all users (Admin only)',
    description:
      'Retrieve daily average mental health statistics for all users within a specified date range. Returns complete date range with zero values for days without data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily mental health statistics retrieved successfully',
    type: [DailyMentalHealthStatisticDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  async getMentalHealthStatistic(
    @Query() query: MentalHealthStatisticQueryDto,
  ): Promise<DailyMentalHealthStatisticDto[]> {
    return this.adminService.getMentalHealthStatisitics(query);
  }

  @Get('/dashboard/summary')
  @ApiOperation({
    summary: 'Get daily admin dashboard summary for all users (Admin only)',
    description:
      'Retrieve daily average admin dashboard summary for all users within a specified date range. Returns complete date range with zero values for days without data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily admin dashboard summary retrieved successfully',
    type: [AdminDashboardSummaryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  async getAdminDashboardSummary(): Promise<AdminDashboardSummaryDto> {
    return this.adminService.GetAdminDashboardSummary();
  }

  @Get('/dashboard/emo')
  @ApiOperation({
    summary: 'Get daily admin dashboard emo',
    description: '...',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily admin dashboard emo retrieved successfully',
    type: [DailyEmoStatisticDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  async getAdminDasboardEmoNow(
    @Query() query: MentalHealthStatisticQueryDto,
  ): Promise<DailyEmoStatisticDto[]> {
    return this.adminService.GetADminDashboardEmo(query);
  }

  @Get('/dashboard/analyze-statistic')
  @ApiOperation({
    summary: 'Get daily admin dashboard emo',
    description: '...',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily admin dashboard emo retrieved successfully',
    type: [DailyEmoStatisticDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  async analyzeStatistic(
    @Query() query: MentalHealthStatisticQueryDto,
  ): Promise<DailyEmoStatisticDto[]> {
    return this.adminService.GetADminDashboardEmo(query);
  }

  @Get('users/:userId/analyze-statistic')
  @ApiOperation({
    summary: 'Get analyze statistics for a specific user (Admin only)',
    description:
      'Retrieve detailed mental health and emotional statistics analysis for a specific user within a date range. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user whose statistics to analyze',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics analysis retrieved successfully',
    type: [DailyMentalHealthStatisticDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async analyzeUserStatistic(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: MentalHealthStatisticQueryDto,
  ): Promise<DailyMentalHealthStatisticDto[]> {
    return await this.adminService.analyzeUserStatistic(userId, query);
  }

  @Get('users/:userId/emo')
  @ApiOperation({
    summary: 'Get daily emotional statistics for a specific user (Admin only)',
    description:
      'Retrieve daily emotional statistics for a specific user within a date range. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user whose emotional statistics to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User daily emotional statistics retrieved successfully',
    type: [DailyEmoStatisticDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserDailyEmo(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: MentalHealthStatisticQueryDto,
  ): Promise<DailyEmoStatisticDto[]> {
    return await this.adminService.getUserEmoStatistic(userId, query);
  }

  @Post('/dashboard/analyze-statistic/stream')
  @ApiOperation({
    summary: 'Stream AI analysis of mental health statistics (Admin only)',
    description:
      'Get a streaming AI analysis of mental health and emotional statistics within a date range. Returns real-time AI-generated insights in Vietnamese.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI analysis stream started successfully',
    schema: {
      type: 'string',
      description: 'Streaming text analysis in Vietnamese',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  async streamAnalyzeStatistic(
    @Body() body: MentalHealthStatisticQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream =
        await this.adminService.streamAnalyzeStatisticResponse(body);

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

  @Post('users/:userId/analyze-statistic/stream')
  @ApiOperation({
    summary:
      'Stream AI analysis of user-specific mental health statistics (Admin only)',
    description:
      'Get a streaming AI analysis of mental health and emotional statistics for a specific user within a date range. Returns real-time AI-generated insights in Vietnamese.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user whose statistics to analyze',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'AI analysis stream for user started successfully',
    schema: {
      type: 'string',
      description: 'Streaming text analysis in Vietnamese',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async streamAnalyzeUserStatistic(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: MentalHealthStatisticQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await this.adminService.streamAnalyzeUserStatisticResponse(
        userId,
        body,
      );

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
