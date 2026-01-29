import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, CompanyResponseDto } from './dto/create-company.dto';
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
      'Only GROUP_ADMIN can create companies. Creates a new company within a company group.',
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
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
    summary: 'Get all companies in the group',
    description:
      "Returns all companies within the authenticated group admin's company group. Only GROUP_ADMIN can access this endpoint. The endpoint automatically identifies the company group based on the authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: 'List of companies retrieved successfully',
    type: [CompanyResponseDto],
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
    description: 'Company group not found for the user',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAll(@Request() req: AuthenticatedRequest): Promise<CompanyResponseDto[]> {
    return this.companiesService.findAllByGroupAdmin(req.user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('GROUP_ADMIN')
  @ApiOperation({
    summary: 'Get a company by ID',
    description:
      "Returns a single company by its ID. Only GROUP_ADMIN can access this endpoint. The company must belong to the authenticated user's company group.",
  })
  @ApiResponse({
    status: 200,
    description: 'Company retrieved successfully',
    type: CompanyResponseDto,
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
    description: "Company not found or does not belong to user's company group",
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.findOneByGroupAdmin(id, req.user.id);
  }
}
