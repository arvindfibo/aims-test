import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  MaxLength,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProjectStatus {
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED',
  RUNNING = 'RUNNING',
}

export enum ProjectCurrency {
  INR = 'INR',
  USD = 'USD',
}

export class CreateProjectDto {
  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id: string;

  @ApiProperty({
    description: 'Project code',
    example: 'PRJ-001',
    maxLength: 100,
  })
  @IsString({ message: 'Project code must be a string' })
  @MaxLength(100, { message: 'Project code must not exceed 100 characters' })
  project_code: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Highway Expansion Phase 1',
    maxLength: 255,
  })
  @IsString({ message: 'Project name must be a string' })
  @MaxLength(255, { message: 'Project name must not exceed 255 characters' })
  project_name: string;

  @ApiPropertyOptional({
    description: 'Work order number/date',
    example: 'WO-2025-01 / 2025-01-15',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Work order number/date must be a string' })
  @MaxLength(100, { message: 'Work order number/date must not exceed 100 characters' })
  work_order_number_date?: string;

  @ApiPropertyOptional({
    description: 'Name of work',
    example: 'Construction of flyover',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Name of work must be a string' })
  @MaxLength(255, { message: 'Name of work must not exceed 255 characters' })
  name_of_work?: string;

  @ApiPropertyOptional({
    description: 'Stipulated commencement date',
    example: '2025-02-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Stipulated commencement date must be a valid date' })
  stipulated_comencement_date?: string;

  @ApiPropertyOptional({
    description: 'Actual commencement date',
    example: '2025-02-05',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Actual commencement date must be a valid date' })
  actual_comencement_date?: string;

  @ApiPropertyOptional({
    description: 'Stipulated completion date',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Stipulated completion date must be a valid date' })
  stipulated_completion_date?: string;

  @ApiPropertyOptional({
    description: 'Actual completion date',
    example: '2026-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Actual completion date must be a valid date' })
  actual_completion_date?: string;

  @ApiPropertyOptional({
    description: 'Initial contract value',
    example: 1250000.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Initial contract value must be a valid number with up to 2 decimals' },
  )
  initial_contract_value?: number;

  @ApiPropertyOptional({
    description: 'Completion contract value',
    example: 1500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Completion contract value must be a valid number with up to 2 decimals' },
  )
  completion_contract_value?: number;

  @ApiPropertyOptional({
    description: 'Project manager',
    example: 'Amit Sharma',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Project manager must be a string' })
  @MaxLength(255, { message: 'Project manager must not exceed 255 characters' })
  project_manager?: string;

  @ApiProperty({
    description: 'Project status',
    enum: ProjectStatus,
    example: ProjectStatus.OPEN,
  })
  @IsEnum(ProjectStatus, { message: 'Status must be one of: OPEN, COMPLETED, RUNNING' })
  status: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Initial phase awarded',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @MaxLength(255, { message: 'Remarks must not exceed 255 characters' })
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Client representative name',
    example: 'Ravi Patel',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Client representative name must be a string' })
  @MaxLength(255, { message: 'Client representative name must not exceed 255 characters' })
  client_representative_name?: string;

  @ApiPropertyOptional({
    description: 'Client representative phone',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Client representative phone must be a string' })
  @MaxLength(20, { message: 'Client representative phone must not exceed 20 characters' })
  client_representative_phone?: string;

  @ApiPropertyOptional({
    description: 'Balance due against invoice',
    example: 250000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Balance due must be a valid number with up to 2 decimals' },
  )
  balance_due_against_invoice?: number;

  @ApiPropertyOptional({
    description: 'Holdover amount',
    example: 50000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Holdover must be a valid number' })
  holdover?: number;

  @ApiPropertyOptional({
    description: 'Security amount',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Security must be a valid number' })
  security?: number;

  @ApiProperty({
    description: 'Currency',
    enum: ProjectCurrency,
    example: ProjectCurrency.INR,
  })
  @IsEnum(ProjectCurrency, { message: 'Currency must be one of: INR, USD' })
  currency: ProjectCurrency;
}

export class ProjectResponseDto {
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  company_id: string;

  @ApiProperty({
    description: 'Project code',
    example: 'PRJ-001',
  })
  project_code: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Highway Expansion Phase 1',
  })
  project_name: string;

  @ApiPropertyOptional({
    description: 'Work order number/date',
  })
  work_order_number_date?: string;

  @ApiPropertyOptional({
    description: 'Name of work',
  })
  name_of_work?: string;

  @ApiPropertyOptional({
    description: 'Stipulated commencement date',
  })
  stipulated_comencement_date?: Date;

  @ApiPropertyOptional({
    description: 'Actual commencement date',
  })
  actual_comencement_date?: Date;

  @ApiPropertyOptional({
    description: 'Stipulated completion date',
  })
  stipulated_completion_date?: Date;

  @ApiPropertyOptional({
    description: 'Actual completion date',
  })
  actual_completion_date?: Date;

  @ApiPropertyOptional({
    description: 'Initial contract value',
  })
  initial_contract_value?: number;

  @ApiPropertyOptional({
    description: 'Completion contract value',
  })
  completion_contract_value?: number;

  @ApiPropertyOptional({
    description: 'Project manager',
  })
  project_manager?: string;

  @ApiProperty({
    description: 'Project status',
    enum: ProjectStatus,
  })
  status: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Remarks',
  })
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Client representative name',
  })
  client_representative_name?: string;

  @ApiPropertyOptional({
    description: 'Client representative phone',
  })
  client_representative_phone?: string;

  @ApiPropertyOptional({
    description: 'Balance due against invoice',
  })
  balance_due_against_invoice?: number;

  @ApiPropertyOptional({
    description: 'Holdover amount',
  })
  holdover?: number;

  @ApiPropertyOptional({
    description: 'Security amount',
  })
  security?: number;

  @ApiProperty({
    description: 'Currency',
    enum: ProjectCurrency,
  })
  currency: ProjectCurrency;

  @ApiProperty({
    description: 'Created at',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}
