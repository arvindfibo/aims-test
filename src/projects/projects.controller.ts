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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  ProjectResponseDto,
  ProjectCurrency,
  ProjectStatus,
} from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DeleteProjectResponseDto } from './dto/delete-project.dto';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
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

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Create a new project',
    description:
      'Creates a project under a tender. GROUP_ADMIN can create for any tender in their group. COMPANY_ADMIN can create for tenders under their company.',
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectResponseDto,
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
    description: 'Forbidden - user does not have access to the company',
  })
  @ApiResponse({
    status: 404,
    description: 'Company or company group not found',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto, req.user.id, req.userRoles);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiQuery({
    name: 'tender_id',
    required: false,
    description: 'Filter by tender ID',
    type: String,
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Filter by project ID',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    enum: ProjectStatus,
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    description: 'Filter by currency',
    enum: ProjectCurrency,
  })
  @ApiQuery({
    name: 'project_code',
    required: false,
    description: 'Filter by project code (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'project_name',
    required: false,
    description: 'Filter by project name (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'work_order_number_date',
    required: false,
    description: 'Filter by work order number/date (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'name_of_work',
    required: false,
    description: 'Filter by name of work (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'project_manager',
    required: false,
    description: 'Filter by project manager (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'remarks',
    required: false,
    description: 'Filter by remarks (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'client_representative_name',
    required: false,
    description: 'Filter by client representative name (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'client_representative_phone',
    required: false,
    description: 'Filter by client representative phone (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'stipulated_comencement_date_from',
    required: false,
    description: 'Stipulated commencement date from (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'stipulated_comencement_date_to',
    required: false,
    description: 'Stipulated commencement date to (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'actual_comencement_date_from',
    required: false,
    description: 'Actual commencement date from (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'actual_comencement_date_to',
    required: false,
    description: 'Actual commencement date to (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'stipulated_completion_date_from',
    required: false,
    description: 'Stipulated completion date from (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'stipulated_completion_date_to',
    required: false,
    description: 'Stipulated completion date to (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'actual_completion_date_from',
    required: false,
    description: 'Actual completion date from (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'actual_completion_date_to',
    required: false,
    description: 'Actual completion date to (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'created_at_from',
    required: false,
    description: 'Created at from (ISO datetime)',
    type: String,
  })
  @ApiQuery({
    name: 'created_at_to',
    required: false,
    description: 'Created at to (ISO datetime)',
    type: String,
  })
  @ApiQuery({
    name: 'updated_at_from',
    required: false,
    description: 'Updated at from (ISO datetime)',
    type: String,
  })
  @ApiQuery({
    name: 'updated_at_to',
    required: false,
    description: 'Updated at to (ISO datetime)',
    type: String,
  })
  @ApiQuery({
    name: 'initial_contract_value_min',
    required: false,
    description: 'Initial contract value min',
    type: Number,
  })
  @ApiQuery({
    name: 'initial_contract_value_max',
    required: false,
    description: 'Initial contract value max',
    type: Number,
  })
  @ApiQuery({
    name: 'completion_contract_value_min',
    required: false,
    description: 'Completion contract value min',
    type: Number,
  })
  @ApiQuery({
    name: 'completion_contract_value_max',
    required: false,
    description: 'Completion contract value max',
    type: Number,
  })
  @ApiQuery({
    name: 'balance_due_against_invoice_min',
    required: false,
    description: 'Balance due against invoice min',
    type: Number,
  })
  @ApiQuery({
    name: 'balance_due_against_invoice_max',
    required: false,
    description: 'Balance due against invoice max',
    type: Number,
  })
  @ApiQuery({
    name: 'holdover_min',
    required: false,
    description: 'Holdover min',
    type: Number,
  })
  @ApiQuery({
    name: 'holdover_max',
    required: false,
    description: 'Holdover max',
    type: Number,
  })
  @ApiQuery({
    name: 'security_min',
    required: false,
    description: 'Security min',
    type: Number,
  })
  @ApiQuery({
    name: 'security_max',
    required: false,
    description: 'Security max',
    type: Number,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort by field',
    enum: [
      'project_name',
      'project_code',
      'status',
      'currency',
      'stipulated_comencement_date',
      'actual_comencement_date',
      'stipulated_completion_date',
      'actual_completion_date',
      'initial_contract_value',
      'completion_contract_value',
      'balance_due_against_invoice',
      'holdover',
      'security',
      'created_at',
      'updated_at',
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
    summary: 'Get all projects',
    description:
      'Returns all projects. Supports query filters and sorting. Access is limited to GROUP_ADMIN (within group) and COMPANY_ADMIN (within their company).',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    type: [ProjectResponseDto],
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
    description: 'Company or company group not found',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(
    @Query() query: GetProjectsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll(query, req.user.id, req.userRoles);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Get a project by ID',
    description:
      'Returns a single project by its ID. Access is limited to GROUP_ADMIN (within group) and COMPANY_ADMIN (within their company).',
  })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    type: ProjectResponseDto,
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
    description: 'Project not found',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id, req.user.id, req.userRoles);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Update a project',
    description:
      'Updates a project. GROUP_ADMIN can update any project within their group. COMPANY_ADMIN can update projects for their company only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    type: ProjectResponseDto,
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
    description: 'Project not found',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto, req.user.id, req.userRoles);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({
    summary: 'Delete a project',
    description:
      'Deletes a project. GROUP_ADMIN can delete any project within their group. COMPANY_ADMIN can delete projects for their company only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully',
    type: DeleteProjectResponseDto,
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
    description: 'Project not found',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteProjectResponseDto> {
    return this.projectsService.remove(id, req.user.id, req.userRoles);
  }
}
