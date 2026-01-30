import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { CompanyGroupsService } from './company-groups.service';
import { CompanyGroupResponseDto } from './dto/company-group-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}

@ApiTags('Company Groups')
@Controller('company-groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CompanyGroupsController {
  constructor(private readonly companyGroupsService: CompanyGroupsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all company groups for super admin',
    description:
      'Returns all company groups where the authenticated user is the super admin. The super_admin_id is automatically extracted from the JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of company groups retrieved successfully',
    type: [CompanyGroupResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAll(@Request() req: AuthenticatedRequest): Promise<CompanyGroupResponseDto[]> {
    // Extract super_admin_id from JWT token (user.id)
    return this.companyGroupsService.findAllBySuperAdmin(req.user.id);
  }
}
