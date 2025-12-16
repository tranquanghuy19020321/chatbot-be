import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { GeneratedQuestionsResponseDto } from './dto/generated-question.dto';
import { PaginationTestDto } from './dto/pagination-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Test } from './entities/test.entity';
import { TestsService } from './tests.service';

@ApiTags('Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new test' })
  @ApiResponse({
    status: 201,
    description: 'Test created successfully',
    type: Test,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@CurrentUser('sub') { userId }: { userId: number }): Promise<Test> {
    console.log('Creating test for user ID:', userId);
    return this.testsService.create(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tests for current user with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of tests',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Test' },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser('sub') { userId }: { userId: number },
    @Query() paginationDto: PaginationTestDto,
  ): Promise<PaginatedResult<Test>> {
    return this.testsService.findAll(userId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific test by ID' })
  @ApiResponse({
    status: 200,
    description: 'Test details',
    type: Test,
  })
  @ApiResponse({ status: 404, description: 'Test not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') { userId }: { userId: number },
  ): Promise<Test> {
    return this.testsService.findOne(+id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a test' })
  @ApiResponse({
    status: 200,
    description: 'Test updated successfully',
    type: Test,
  })
  @ApiResponse({ status: 404, description: 'Test not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') { userId }: { userId: number },
    @Body() updateTestDto: UpdateTestDto,
  ): Promise<Test> {
    return this.testsService.update(+id, userId, updateTestDto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a test as completed' })
  @ApiResponse({
    status: 200,
    description: 'Test marked as completed successfully',
    type: Test,
  })
  @ApiResponse({ status: 404, description: 'Test not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAsCompleted(
    @Param('id') id: string,
    @CurrentUser('sub') { userId }: { userId: number },
  ): Promise<Test> {
    return this.testsService.markAsCompleted(+id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a test' })
  @ApiResponse({ status: 200, description: 'Test deleted successfully' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') { userId }: { userId: number },
  ): Promise<void> {
    return this.testsService.remove(+id, userId);
  }

  @Get('generate/questions')
  @ApiOperation({ summary: 'Generate questions from AI without saving' })
  @ApiResponse({
    status: 200,
    description: 'AI-generated questions',
    type: GeneratedQuestionsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generateQuestions(): Promise<GeneratedQuestionsResponseDto> {
    return this.testsService.generateQuestionsWithAI();
  }
}
