import {
  Controller,
  Post,
  Body,
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
}
