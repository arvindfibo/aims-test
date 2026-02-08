import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
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
import { TendersService } from './tenders.service';
import { CreateTenderDto, TenderResponseDto } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import { DeleteTenderResponseDto } from './dto/delete-tender.dto';
import { GetTendersQueryDto } from './dto/get-tenders-query.dto';
import { PaginatedTendersResponseDto } from './dto/paginated-tenders-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

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

@ApiTags('Tenders')
@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TendersController {
  constructor(private readonly tendersService: TendersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new tender',
    description:
      'Creates a new tender associated with a company. Users with COMPANY_ADMIN or GROUP_ADMIN roles can create tenders.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tender created successfully',
    type: TenderResponseDto,
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
    description: 'Forbidden - company is not active',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - tender code already exists',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createTenderDto: CreateTenderDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TenderResponseDto> {
    return this.tendersService.create(createTenderDto, req.user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all tenders with pagination, filtering, and sorting',
    description:
      'Returns paginated tenders with support for filtering by all tender fields, sorting by multiple fields, and offset-based pagination. Default: 10 items per page, sorted by created_at DESC. Users with COMPANY_ADMIN or GROUP_ADMIN roles can access this endpoint.',
  })
  @ApiQuery({ name: 'id', required: false, description: 'Filter by tender ID' })
  @ApiQuery({ name: 'company_id', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'tender_code', required: false, description: 'Filter by tender code' })
  @ApiQuery({ name: 'authority', required: false, description: 'Filter by authority' })
  @ApiQuery({ name: 'client_name', required: false, description: 'Filter by client name' })
  @ApiQuery({
    name: 'tender_status',
    required: false,
    description: 'Filter by tender status',
    enum: [
      'Not Filled',
      'On Going',
      'L-1',
      'L-1(work alloted to Us)',
      'L-2',
      'L-3',
      'Quoted',
      'Submitted',
      'Won',
      'Lost',
      'Cancelled',
    ],
  })
  @ApiQuery({
    name: 'emd_status',
    required: false,
    description: 'Filter by EMD status',
    enum: ['Pending', 'Paid', 'Returned', 'Not Applicable'],
  })
  @ApiQuery({
    name: 'emd_returned',
    required: false,
    description: 'Filter by EMD returned',
    type: Boolean,
  })
  @ApiQuery({
    name: 'tender_cost_currency',
    required: false,
    description: 'Filter by tender cost currency',
    enum: ['INR', 'USD'],
  })
  @ApiQuery({
    name: 'processing_fee_currency',
    required: false,
    description: 'Filter by processing fee currency',
    enum: ['INR', 'USD'],
  })
  @ApiQuery({
    name: 'emd_currency',
    required: false,
    description: 'Filter by EMD currency',
    enum: ['INR', 'USD'],
  })
  @ApiQuery({
    name: 'bank_charges_currency',
    required: false,
    description: 'Filter by bank charges currency',
    enum: ['INR', 'USD'],
  })
  @ApiQuery({
    name: 'documentation_charges_currency',
    required: false,
    description: 'Filter by documentation charges currency',
    enum: ['INR', 'USD'],
  })
  @ApiQuery({
    name: 'total_tender_value_currency',
    required: false,
    description: 'Filter by total tender value currency',
    enum: ['INR', 'USD'],
  })
  @ApiQuery({ name: 'created_by', required: false, description: 'Filter by created_by user ID' })
  @ApiQuery({ name: 'updated_by', required: false, description: 'Filter by updated_by user ID' })
  @ApiQuery({
    name: 'last_date_of_submission_from',
    required: false,
    description: 'Filter by last date of submission from (ISO datetime)',
  })
  @ApiQuery({
    name: 'last_date_of_submission_to',
    required: false,
    description: 'Filter by last date of submission to (ISO datetime)',
  })
  @ApiQuery({
    name: 'created_at_from',
    required: false,
    description: 'Filter by created_at from (ISO datetime)',
  })
  @ApiQuery({
    name: 'created_at_to',
    required: false,
    description: 'Filter by created_at to (ISO datetime)',
  })
  @ApiQuery({
    name: 'updated_at_from',
    required: false,
    description: 'Filter by updated_at from (ISO datetime)',
  })
  @ApiQuery({
    name: 'updated_at_to',
    required: false,
    description: 'Filter by updated_at to (ISO datetime)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort by field',
    enum: [
      'tender_code',
      'authority',
      'client_name',
      'nit_number',
      'name_of_work',
      'tender_status',
      'emd_status',
      'emd_returned',
      'tender_cost',
      'processing_fee',
      'emd',
      'bank_charges',
      'documentation_charges',
      'total_tender_value',
      'last_date_of_submission',
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
    description: 'Paginated list of tenders retrieved successfully',
    type: PaginatedTendersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(@Query() query: GetTendersQueryDto): Promise<PaginatedTendersResponseDto> {
    return this.tendersService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    description: 'Tender ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get a tender by ID',
    description:
      'Retrieves a specific tender by its ID. Users with COMPANY_ADMIN or GROUP_ADMIN roles can access this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tender retrieved successfully',
    type: TenderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Tender not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TenderResponseDto> {
    return this.tendersService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    description: 'Tender ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Update a tender',
    description:
      'Updates an existing tender. Users with COMPANY_ADMIN or GROUP_ADMIN roles can update tenders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tender updated successfully',
    type: TenderResponseDto,
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
    status: 404,
    description: 'Tender not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - tender code already exists',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenderDto: UpdateTenderDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TenderResponseDto> {
    return this.tendersService.update(id, updateTenderDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    description: 'Tender ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Delete a tender',
    description:
      'Soft deletes a tender. Users with COMPANY_ADMIN or GROUP_ADMIN roles can delete tenders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tender deleted successfully',
    type: DeleteTenderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Tender not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteTenderResponseDto> {
    return this.tendersService.remove(id, req.user.id);
  }
}
