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
import { TenderStatus, EmdStatus, Currency } from '../../entities/tender.entity';

export class GetTendersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tender ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Tender ID must be a valid UUID' })
  id?: string;

  @ApiPropertyOptional({
    description: 'Filter by company ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by tender code (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tender_code?: string;

  @ApiPropertyOptional({
    description: 'Filter by authority (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authority?: string;

  @ApiPropertyOptional({
    description: 'Filter by client name (exact match)',
  })
  @IsOptional()
  @IsString()
  client_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by NIT number (exact match)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nit_number?: string;

  @ApiPropertyOptional({
    description: 'Filter by name of work (exact match)',
  })
  @IsOptional()
  @IsString()
  name_of_work?: string;

  @ApiPropertyOptional({
    description: 'Filter by tender status',
    enum: TenderStatus,
  })
  @IsOptional()
  @IsEnum(TenderStatus)
  tender_status?: TenderStatus;

  @ApiPropertyOptional({
    description: 'Filter by EMD status',
    enum: EmdStatus,
  })
  @IsOptional()
  @IsEnum(EmdStatus)
  emd_status?: EmdStatus;

  @ApiPropertyOptional({
    description: 'Filter by EMD returned',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  emd_returned?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by tender cost currency',
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  tender_cost_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Filter by processing fee currency',
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  processing_fee_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Filter by EMD currency',
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  emd_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Filter by bank charges currency',
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  bank_charges_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Filter by documentation charges currency',
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  documentation_charges_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Filter by total tender value currency',
    enum: Currency,
  })
  @IsOptional()
  @IsEnum(Currency)
  total_tender_value_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Filter by created_by user ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Created by user ID must be a valid UUID' })
  created_by?: string;

  @ApiPropertyOptional({
    description: 'Filter by updated_by user ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Updated by user ID must be a valid UUID' })
  updated_by?: string;

  @ApiPropertyOptional({
    description: 'Last date of submission from (ISO datetime)',
  })
  @IsOptional()
  @IsDateString()
  last_date_of_submission_from?: string;

  @ApiPropertyOptional({
    description: 'Last date of submission to (ISO datetime)',
  })
  @IsOptional()
  @IsDateString()
  last_date_of_submission_to?: string;

  @ApiPropertyOptional({
    description: 'Created at from (ISO datetime)',
  })
  @IsOptional()
  @IsDateString()
  created_at_from?: string;

  @ApiPropertyOptional({
    description: 'Created at to (ISO datetime)',
  })
  @IsOptional()
  @IsDateString()
  created_at_to?: string;

  @ApiPropertyOptional({
    description: 'Updated at from (ISO datetime)',
  })
  @IsOptional()
  @IsDateString()
  updated_at_from?: string;

  @ApiPropertyOptional({
    description: 'Updated at to (ISO datetime)',
  })
  @IsOptional()
  @IsDateString()
  updated_at_to?: string;

  @ApiPropertyOptional({
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
  @IsOptional()
  @IsIn([
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
  ])
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
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
