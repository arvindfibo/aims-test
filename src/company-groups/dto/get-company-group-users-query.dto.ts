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

export class GetCompanyGroupUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by division ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Division ID must be a valid UUID' })
  division_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  department_id?: string;

  @ApiPropertyOptional({ description: 'Filter by user email (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by first name (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ description: 'Filter by last name (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

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

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: [
      'created_at',
      'updated_at',
      'email',
      'first_name',
      'last_name',
      'company_name',
      'division_name',
      'department_name',
      'role_name',
    ],
  })
  @IsOptional()
  @IsIn([
    'created_at',
    'updated_at',
    'email',
    'first_name',
    'last_name',
    'company_name',
    'division_name',
    'department_name',
    'role_name',
  ])
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Offset for pagination', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Limit for pagination (max 100)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
