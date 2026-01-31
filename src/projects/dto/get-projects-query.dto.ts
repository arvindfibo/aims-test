import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectCurrency, ProjectStatus } from './create-project.dto';

export class GetProjectsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Tender ID must be a valid UUID' })
  tender_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by project status',
    enum: ProjectStatus,
  })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Status must be one of: OPEN, COMPLETED, RUNNING' })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Filter by currency',
    enum: ProjectCurrency,
  })
  @IsOptional()
  @IsEnum(ProjectCurrency, { message: 'Currency must be one of: INR, USD' })
  currency?: ProjectCurrency;

  @ApiPropertyOptional({
    description: 'Filter by project ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  id?: string;

  @ApiPropertyOptional({ description: 'Filter by project code (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  project_code?: string;

  @ApiPropertyOptional({ description: 'Filter by project name (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  project_name?: string;

  @ApiPropertyOptional({ description: 'Filter by work order number/date (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  work_order_number_date?: string;

  @ApiPropertyOptional({ description: 'Filter by name of work (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name_of_work?: string;

  @ApiPropertyOptional({ description: 'Filter by project manager (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  project_manager?: string;

  @ApiPropertyOptional({ description: 'Filter by remarks (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;

  @ApiPropertyOptional({ description: 'Filter by client representative name (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_representative_name?: string;

  @ApiPropertyOptional({ description: 'Filter by client representative phone (exact match)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  client_representative_phone?: string;

  @ApiPropertyOptional({ description: 'Stipulated commencement date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  stipulated_comencement_date_from?: string;

  @ApiPropertyOptional({ description: 'Stipulated commencement date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  stipulated_comencement_date_to?: string;

  @ApiPropertyOptional({ description: 'Actual commencement date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  actual_comencement_date_from?: string;

  @ApiPropertyOptional({ description: 'Actual commencement date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  actual_comencement_date_to?: string;

  @ApiPropertyOptional({ description: 'Stipulated completion date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  stipulated_completion_date_from?: string;

  @ApiPropertyOptional({ description: 'Stipulated completion date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  stipulated_completion_date_to?: string;

  @ApiPropertyOptional({ description: 'Actual completion date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  actual_completion_date_from?: string;

  @ApiPropertyOptional({ description: 'Actual completion date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  actual_completion_date_to?: string;

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

  @ApiPropertyOptional({ description: 'Initial contract value min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  initial_contract_value_min?: number;

  @ApiPropertyOptional({ description: 'Initial contract value max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  initial_contract_value_max?: number;

  @ApiPropertyOptional({ description: 'Completion contract value min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  completion_contract_value_min?: number;

  @ApiPropertyOptional({ description: 'Completion contract value max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  completion_contract_value_max?: number;

  @ApiPropertyOptional({ description: 'Balance due against invoice min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  balance_due_against_invoice_min?: number;

  @ApiPropertyOptional({ description: 'Balance due against invoice max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  balance_due_against_invoice_max?: number;

  @ApiPropertyOptional({ description: 'Holdover min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  holdover_min?: number;

  @ApiPropertyOptional({ description: 'Holdover max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  holdover_max?: number;

  @ApiPropertyOptional({ description: 'Security min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  security_min?: number;

  @ApiPropertyOptional({ description: 'Security max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  security_max?: number;

  @ApiPropertyOptional({
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
  @IsOptional()
  @IsIn([
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
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
