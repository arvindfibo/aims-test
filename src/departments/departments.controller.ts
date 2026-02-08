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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, DepartmentResponseDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DeleteDepartmentResponseDto } from './dto/delete-department.dto';
import { ListDepartmentsQueryDto } from './dto/list-departments-query.dto';
import { PaginatedDepartmentsResponseDto } from './dto/paginated-departments-response.dto';
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

@ApiTags('Departments')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN')
  @ApiOperation({
    summary: 'Create a new department',
    description:
      'GROUP_ADMIN, COMPANY_ADMIN (of company), and DIVISION_ADMIN (of division) can create departments. Creates a new department within a division. Returns department details with statistics fields (users_count will be 0 for newly created departments).',
  })
  @ApiResponse({
    status: 201,
    description:
      'Department created successfully. Response includes statistics fields (counts will be 0 for new departments).',
    type: DepartmentResponseDto,
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
    description: 'Forbidden - user does not have required role or division/company is inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Division not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - department name or code already exists in this division',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.create(createDepartmentDto, req.user.id, req.userRoles);
  }

  @Get('division/:divisionId')
  @HttpCode(HttpStatus.OK)
  @Roles(
    'GROUP_ADMIN',
    'COMPANY_ADMIN',
    'DIVISION_ADMIN',
    'DEPARTMENT_ADMIN',
    'DEPARTMENT_USER',
    'DIVISION_USER',
    'COMPANY_USER',
  )
  @ApiParam({
    name: 'divisionId',
    description: 'Division ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get all departments for a division',
    description:
      'Retrieves departments for a division with pagination, sorting, and optional filters (name, code, is_active). Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by department name (partial, case-insensitive)',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Filter by department code (partial, case-insensitive)',
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
      'Departments retrieved successfully (paginated). Each department includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
    type: PaginatedDepartmentsResponseDto,
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
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAllByDivision(
    @Param('divisionId', ParseUUIDPipe) divisionId: string,
    @Query() query: ListDepartmentsQueryDto,
  ): Promise<PaginatedDepartmentsResponseDto> {
    return this.departmentsService.findAllByDivision(divisionId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(
    'GROUP_ADMIN',
    'COMPANY_ADMIN',
    'DIVISION_ADMIN',
    'DEPARTMENT_ADMIN',
    'DEPARTMENT_USER',
    'DIVISION_USER',
    'COMPANY_USER',
  )
  @ApiParam({
    name: 'id',
    description: 'Department ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get a department by ID',
    description:
      'Retrieves a single department by its ID with statistics including total users count. User must have appropriate role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully with statistics (users_count)',
    type: DepartmentResponseDto,
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
    description: 'Department not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DepartmentResponseDto> {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DEPARTMENT_ADMIN')
  @ApiParam({
    name: 'id',
    description: 'Department ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Update a department',
    description:
      'GROUP_ADMIN can update any department. COMPANY_ADMIN can update departments in their company. DIVISION_ADMIN can update departments in their division. DEPARTMENT_ADMIN can update only their department. Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Department updated successfully. Response includes statistics fields (counts will be 0 as they are not calculated in this endpoint).',
    type: DepartmentResponseDto,
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
    description: 'Department not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - department name or code already exists in this division',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.update(id, updateDepartmentDto, req.user.id, req.userRoles);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DEPARTMENT_ADMIN')
  @ApiParam({
    name: 'id',
    description: 'Department ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Delete a department (soft delete)',
    description:
      'Soft deletes a department. GROUP_ADMIN can delete any department. COMPANY_ADMIN can delete departments in their company. DIVISION_ADMIN can delete departments in their division. DEPARTMENT_ADMIN can delete only their department.',
  })
  @ApiResponse({
    status: 200,
    description: 'Department deleted successfully',
    type: DeleteDepartmentResponseDto,
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
    description: 'Department not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteDepartmentResponseDto> {
    return this.departmentsService.remove(id, req.user.id, req.userRoles);
  }
}
