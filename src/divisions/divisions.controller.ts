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
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto, DivisionResponseDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { DeleteDivisionResponseDto } from './dto/delete-division.dto';
import { ListDivisionsQueryDto } from './dto/list-divisions-query.dto';
import { PaginatedDivisionsResponseDto } from './dto/paginated-divisions-response.dto';
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

@ApiTags('Divisions')
@Controller('divisions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Create a new division',
    description:
      'GROUP_ADMIN and COMPANY_ADMIN can create divisions. Creates a new division within a company. Returns division details with statistics fields (users_count, departments_count will be 0 for newly created divisions).',
  })
  @ApiResponse({
    status: 201,
    description:
      'Division created successfully. Response includes statistics fields (counts will be 0 for new divisions).',
    type: DivisionResponseDto,
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
    description: 'Forbidden - user does not have required role or company is inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - division name or code already exists in this company',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createDivisionDto: CreateDivisionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DivisionResponseDto> {
    return this.divisionsService.create(createDivisionDto, req.user.id, req.userRoles);
  }

  @Get('company/:companyId')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DIVISION_USER', 'COMPANY_USER')
  @ApiParam({
    name: 'companyId',
    description: 'Company ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get all divisions for a company',
    description:
      'Retrieves divisions for a company with pagination, sorting, and optional filters (name, code, is_active). Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by division name (partial, case-insensitive)',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Filter by division code (partial, case-insensitive)',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    description: 'Filter by active status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort by field',
    enum: ['name', 'code', 'is_active', 'created_at', 'updated_at'],
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
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit for pagination (max 100)',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description:
      'Divisions retrieved successfully (paginated). Each division includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
    type: PaginatedDivisionsResponseDto,
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
    description: 'Company not found',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAllByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() query: ListDivisionsQueryDto,
  ): Promise<PaginatedDivisionsResponseDto> {
    return this.divisionsService.findAllByCompany(companyId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DIVISION_USER', 'COMPANY_USER')
  @ApiParam({
    name: 'id',
    description: 'Division ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get a division by ID',
    description:
      'Retrieves a single division by its ID with statistics including total users and departments count. User must have appropriate role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Division retrieved successfully with statistics (users_count, departments_count)',
    type: DivisionResponseDto,
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
    description: 'Division not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DivisionResponseDto> {
    return this.divisionsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN')
  @ApiParam({
    name: 'id',
    description: 'Division ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Update a division',
    description:
      'GROUP_ADMIN can update any division. COMPANY_ADMIN can update divisions in their company. DIVISION_ADMIN can update only their division. Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Division updated successfully. Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
    type: DivisionResponseDto,
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
    description: 'Division not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - division name or code already exists in this company',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDivisionDto: UpdateDivisionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DivisionResponseDto> {
    return this.divisionsService.update(id, updateDivisionDto, req.user.id, req.userRoles);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN')
  @ApiParam({
    name: 'id',
    description: 'Division ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Delete a division (soft delete)',
    description:
      'Soft deletes a division. GROUP_ADMIN can delete any division. COMPANY_ADMIN can delete divisions in their company. DIVISION_ADMIN can delete only their division.',
  })
  @ApiResponse({
    status: 200,
    description: 'Division deleted successfully',
    type: DeleteDivisionResponseDto,
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
    description: 'Division not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteDivisionResponseDto> {
    return this.divisionsService.remove(id, req.user.id, req.userRoles);
  }
}
