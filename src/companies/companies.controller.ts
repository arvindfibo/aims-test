import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, CompanyResponseDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { DeleteCompanyResponseDto } from './dto/delete-company.dto';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto';
import { PaginatedCompaniesResponseDto } from './dto/paginated-companies-response.dto';
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

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('GROUP_ADMIN')
  @ApiOperation({
    summary: 'Create a new company',
    description:
      'Only GROUP_ADMIN can create companies. Creates a new company within a company group. Returns company details with statistics (users_count, divisions_count, departments_count will be 0 for newly created companies).',
  })
  @ApiResponse({
    status: 201,
    description:
      'Company created successfully. Response includes statistics fields (counts will be 0 for new companies).',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have GROUP_ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'Company group not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - company name, registration number, PAN, or GSTIN already exists',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.create(createCompanyDto, req.user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN')
  @ApiOperation({
    summary: 'Get all companies by company group ID with pagination and filtering',
    description:
      'Returns paginated companies for a specific company group. Supports filtering by name, legal_name, registration_number, is_active, and is_verified. Default: 10 items per page, sorted by created_at DESC. Only GROUP_ADMIN can access this endpoint. Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
  })
  @ApiQuery({
    name: 'company_group_id',
    required: true,
    description: 'Company group ID (required)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by company name (exact match)',
    type: String,
    example: 'Acme Corporation',
  })
  @ApiQuery({
    name: 'legal_name',
    required: false,
    description: 'Filter by legal name (exact match)',
    type: String,
    example: 'Acme Corporation Private Limited',
  })
  @ApiQuery({
    name: 'registration_number',
    required: false,
    description: 'Filter by registration number (exact match)',
    type: String,
    example: 'U12345AB2023PTC123456',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    description: 'Filter by is_active status',
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'is_verified',
    required: false,
    description: 'Filter by is_verified status',
    type: Boolean,
    example: false,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description:
      'Sort by field. Allowed values: name, legal_name, registration_number, is_active, is_verified, created_at, updated_at. Default: created_at',
    enum: [
      'name',
      'legal_name',
      'registration_number',
      'is_active',
      'is_verified',
      'created_at',
      'updated_at',
    ],
    example: 'created_at',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order. Default: DESC',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination (default: 0)',
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit for pagination (min: 1, max: 100, default: 10)',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated list of companies retrieved successfully. Each company includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
    type: PaginatedCompaniesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - company_group_id is required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have GROUP_ADMIN role or company group is not active',
  })
  @ApiResponse({
    status: 404,
    description: 'Company group not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(@Query() query: GetCompaniesQueryDto): Promise<PaginatedCompaniesResponseDto> {
    if (!query.company_group_id) {
      throw new BadRequestException('company_group_id is required');
    }
    return this.companiesService.findAllCompaniesByCompanyGroupId(query.company_group_id, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a company by ID',
    description:
      'Returns a single company by its ID with statistics including total users, divisions, and departments count. Only GROUP_ADMIN can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Company retrieved successfully with statistics (users_count, divisions_count, departments_count)',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have GROUP_ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findOne(@Param('id') id: string): Promise<CompanyResponseDto> {
    return this.companiesService.findCompanyByCompanyId(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Update a company',
    description:
      'GROUP_ADMIN can update any company. COMPANY_ADMIN can update only their company. Company group ID cannot be changed. Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Company updated successfully. Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or no fields provided',
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
    description: 'Company not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - company name, registration number, PAN, or GSTIN already exists',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.update(id, updateCompanyDto, req.user.id, req.userRoles);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Delete a company (soft delete)',
    description:
      'Soft deletes a company. GROUP_ADMIN can delete any company. COMPANY_ADMIN can delete only their company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Company deleted successfully',
    type: DeleteCompanyResponseDto,
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
    description: 'Company not found',
  })
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteCompanyResponseDto> {
    return this.companiesService.delete(id, req.user.id, req.userRoles);
  }
}
