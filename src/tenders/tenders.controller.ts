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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { TendersService } from './tenders.service';
import { CreateTenderDto, TenderResponseDto } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import { DeleteTenderResponseDto } from './dto/delete-tender.dto';
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
  @ApiOperation({
    summary: 'Get all tenders',
    description:
      'Retrieves all tenders. Optionally filter by company_id. Users with COMPANY_ADMIN or GROUP_ADMIN roles can access this endpoint.',
  })
  @ApiQuery({
    name: 'company_id',
    required: false,
    description: 'Filter tenders by company ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenders retrieved successfully',
    type: [TenderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async findAll(@Query('company_id') companyId?: string): Promise<TenderResponseDto[]> {
    return this.tendersService.findAll(companyId);
  }

  @Get(':id')
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
  async findOne(@Param('id') id: string): Promise<TenderResponseDto> {
    return this.tendersService.findOne(id);
  }

  @Patch(':id')
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
    @Param('id') id: string,
    @Body() updateTenderDto: UpdateTenderDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TenderResponseDto> {
    return this.tendersService.update(id, updateTenderDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
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
  async remove(@Param('id') id: string): Promise<DeleteTenderResponseDto> {
    return this.tendersService.remove(id);
  }
}
