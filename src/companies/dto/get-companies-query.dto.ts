import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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

export class GetCompaniesQueryDto {
  @ApiPropertyOptional({
    description: 'Company group ID (required for filtering)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company group ID must be a valid UUID' })
  company_group_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by company name (exact match)',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by legal name (exact match)',
    example: 'Acme Corporation Private Limited',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legal_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by registration number (exact match)',
    example: 'U12345AB2023PTC123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registration_number?: string;

  @ApiPropertyOptional({
    description: 'Filter by is_active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by is_verified status',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({
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
  @IsOptional()
  @IsIn([
    'name',
    'legal_name',
    'registration_number',
    'is_active',
    'is_verified',
    'created_at',
    'updated_at',
  ])
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'Sort order. Default: DESC',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Offset for pagination (default: 0)',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({
    description: 'Limit for pagination (min: 1, max: 100, default: 10)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
