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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto, DivisionResponseDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { DeleteDivisionResponseDto } from './dto/delete-division.dto';
import { ListDivisionsQueryDto } from './dto/list-divisions-query.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
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
      'GROUP_ADMIN and COMPANY_ADMIN can create divisions. Creates a new division within a company.',
  })
  @ApiResponse({
    status: 201,
    description: 'Division created successfully',
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
  @ApiOperation({
    summary: 'Get all divisions for a company',
    description:
      'Retrieves divisions for a company with pagination, sorting, and optional filters (name, code, is_active).',
  })
  @ApiResponse({
    status: 200,
    description: 'Divisions retrieved successfully (paginated)',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/DivisionResponseDto' } },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
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
    @Param('companyId') companyId: string,
    @Query() query: ListDivisionsQueryDto,
  ): Promise<PaginatedResponseDto<DivisionResponseDto>> {
    return this.divisionsService.findAllByCompany(companyId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DIVISION_USER', 'COMPANY_USER')
  @ApiOperation({
    summary: 'Get a division by ID',
    description: 'Retrieves a single division by its ID. User must have appropriate role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Division retrieved successfully',
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
  async findOne(@Param('id') id: string): Promise<DivisionResponseDto> {
    return this.divisionsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN')
  @ApiOperation({
    summary: 'Update a division',
    description:
      'GROUP_ADMIN can update any division. COMPANY_ADMIN can update divisions in their company. DIVISION_ADMIN can update only their division.',
  })
  @ApiResponse({
    status: 200,
    description: 'Division updated successfully',
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
    @Param('id') id: string,
    @Body() updateDivisionDto: UpdateDivisionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DivisionResponseDto> {
    return this.divisionsService.update(id, updateDivisionDto, req.user.id, req.userRoles);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN')
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
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteDivisionResponseDto> {
    return this.divisionsService.remove(id, req.user.id, req.userRoles);
  }
}
