import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name?: string | null;
  is_verified: boolean;
  is_active: boolean;
}

interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
  userRoles?: string[];
}

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('GROUP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      "Returns aggregated counts for users, companies, divisions, and departments within the user's company group. " +
      'Only accessible by GROUP_ADMIN users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have required role',
  })
  @ApiResponse({
    status: 404,
    description: 'Company group not found for the user',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getDashboardStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getDashboardStats(req.user.id, req.userRoles ?? []);
  }
}
