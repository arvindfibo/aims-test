import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyType } from './create-company.dto';

export class GetCompaniesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by company ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  id?: string;

  @ApiPropertyOptional({
    description: 'Filter by company group ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company group ID must be a valid UUID' })
  company_group_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by company name (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by legal name (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legal_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by company type',
    enum: CompanyType,
  })
  @IsOptional()
  @IsEnum(CompanyType)
  company_type?: CompanyType;

  @ApiPropertyOptional({
    description: 'Filter by registration number (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registration_number?: string;

  @ApiPropertyOptional({
    description: 'Filter by PAN (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pan?: string;

  @ApiPropertyOptional({
    description: 'Filter by GSTIN (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  gstin?: string;

  @ApiPropertyOptional({
    description: 'Filter by email (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by website (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    description: 'Filter by phone (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Filter by address line 1 (exact match)',
  })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiPropertyOptional({
    description: 'Filter by address line 2 (exact match)',
  })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional({
    description: 'Filter by city (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by state (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by country (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter by pincode (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @ApiPropertyOptional({
    description: 'Filter by company admin user ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company admin user ID must be a valid UUID' })
  company_admin_user_id?: string;

  @ApiPropertyOptional({ description: 'Filter by is_active' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Filter by is_verified' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by created_by user ID' })
  @IsOptional()
  @IsUUID('4', { message: 'Created by user ID must be a valid UUID' })
  created_by?: string;

  @ApiPropertyOptional({ description: 'Filter by updated_by user ID' })
  @IsOptional()
  @IsUUID('4', { message: 'Updated by user ID must be a valid UUID' })
  updated_by?: string;

  @ApiPropertyOptional({ description: 'Created at from (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  created_at_from?: string;

  @ApiPropertyOptional({ description: 'Created at to (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  created_at_to?: string;

  @ApiPropertyOptional({ description: 'Updated at from (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  updated_at_from?: string;

  @ApiPropertyOptional({ description: 'Updated at to (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  updated_at_to?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: [
      'name',
      'legal_name',
      'company_type',
      'registration_number',
      'pan',
      'gstin',
      'email',
      'website',
      'phone',
      'city',
      'state',
      'country',
      'pincode',
      'is_active',
      'is_verified',
      'created_at',
      'updated_at',
    ],
  })
  @IsOptional()
  @IsIn([
    'name',
    'legal_name',
    'company_type',
    'registration_number',
    'pan',
    'gstin',
    'email',
    'website',
    'phone',
    'city',
    'state',
    'country',
    'pincode',
    'is_active',
    'is_verified',
    'created_at',
    'updated_at',
  ])
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({
    description: 'Limit for pagination (max 100)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
