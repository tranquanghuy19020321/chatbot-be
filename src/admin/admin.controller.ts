import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Test } from '../tests/entities/test.entity';
import { MentalHealthEvaluation } from '../users/entities/mental-health-evaluation.entity';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { AdminTestQueryDto } from './dto/admin-test-query.dto';

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
}
