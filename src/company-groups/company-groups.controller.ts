import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { CompanyGroupsService } from './company-groups.service';
import { CompanyGroupResponseDto } from './dto/company-group-response.dto';
import { UpdateCompanyGroupDto } from './dto/update-company-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCompanyGroupUsersQueryDto } from './dto/get-company-group-users-query.dto';
import { PaginatedCompanyGroupUsersResponseDto } from './dto/company-group-users-response.dto';

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

@ApiTags('Company Groups')
@Controller('company-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
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
    return this.companyGroupsService.findAllBySuperAdmin(req.user.id);
  }

  @Get('users')
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DEPARTMENT_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'company_id',
    required: false,
    description: 'Filter by company ID',
    type: String,
  })
  @ApiQuery({
    name: 'division_id',
    required: false,
    description: 'Filter by division ID',
    type: String,
  })
  @ApiQuery({
    name: 'department_id',
    required: false,
    description: 'Filter by department ID',
    type: String,
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filter by user email (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'first_name',
    required: false,
    description: 'Filter by user first name (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'last_name',
    required: false,
    description: 'Filter by user last name (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    description: 'Filter by user active status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'is_verified',
    required: false,
    description: 'Filter by user verified status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort by field',
    enum: [
      'created_at',
      'updated_at',
      'email',
      'first_name',
      'last_name',
      'company_name',
      'division_name',
      'department_name',
      'role_name',
    ],
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit for pagination (max 100)',
    type: Number,
  })
  @ApiOperation({
    summary: 'Get users across companies with scoped access',
    description:
      'Returns a flat list of user-role assignments across companies with filters, sorting, and pagination. Access is scoped by highest admin role: GROUP_ADMIN (group-wide), COMPANY_ADMIN (company-only), DIVISION_ADMIN (division-only), DEPARTMENT_ADMIN (department-only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedCompanyGroupUsersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have required role or scope',
  })
  @ApiResponse({
    status: 404,
    description: 'Company group not found for the user',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getCompanyGroupUsers(
    @Query() query: GetCompanyGroupUsersQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PaginatedCompanyGroupUsersResponseDto> {
    return this.companyGroupsService.getCompanyGroupUsers(req.user.id, req.userRoles ?? [], query);
  }

  @Patch(':id')
  @Roles('GROUP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiParam({
    name: 'id',
    description: 'Company group ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Update company group details',
    description:
      'Updates company group details including name, email, phone, address, city, and state. ' +
      'Email, phone, address, city, and state are stored in the metadata JSONB field. ' +
      'Only accessible by GROUP_ADMIN users who are the admin of the specified company group.',
  })
  @ApiResponse({
    status: 200,
    description: 'Company group updated successfully',
    type: CompanyGroupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input or no fields provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have required role or access',
  })
  @ApiResponse({
    status: 404,
    description: 'Company group not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async update(
    @Param('id', ParseUUIDPipe) companyGroupId: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateCompanyGroupDto,
  ): Promise<CompanyGroupResponseDto> {
    return this.companyGroupsService.update(
      companyGroupId,
      req.user.id,
      req.userRoles ?? [],
      updateDto,
    );
  }
}
