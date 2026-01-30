import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TenderStatus, EmdStatus, Currency } from '../../entities/tender.entity';

class FinancialFieldDto {
  @ApiPropertyOptional({
    description: 'Amount value',
    example: 1000.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount must be greater than or equal to 0' })
  value?: number;

  @ApiPropertyOptional({
    description: 'Currency',
    enum: Currency,
    default: Currency.INR,
    example: Currency.INR,
  })
  @IsOptional()
  @IsEnum(Currency, { message: 'Currency must be INR or USD' })
  currency?: Currency;
}

export class CreateTenderDto {
  @ApiProperty({
    description: 'Company ID that is filing this tender',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id: string;

  @ApiProperty({
    description: 'Unique tender code',
    example: 'ABPLT_TE_001',
    maxLength: 100,
  })
  @IsString({ message: 'Tender code must be a string' })
  @MaxLength(100, { message: 'Tender code must not exceed 100 characters' })
  tender_code: string;

  @ApiProperty({
    description: 'Issuing authority',
    example: 'MUMBAI PORT',
    maxLength: 255,
  })
  @IsString({ message: 'Authority must be a string' })
  @MaxLength(255, { message: 'Authority must not exceed 255 characters' })
  authority: string;

  @ApiProperty({
    description: 'Client name and address',
    example: '3rdfloor, Port House, Shoorji Vallabhdas Marg, 3rd Estate, Mumbai - 400',
  })
  @IsString({ message: 'Client name must be a string' })
  client_name: string;

  @ApiPropertyOptional({
    description: 'Notice Inviting Tender (NIT) number',
    example: 'E-28/2025',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'NIT number must be a string' })
  @MaxLength(255, { message: 'NIT number must not exceed 255 characters' })
  nit_number?: string;

  @ApiPropertyOptional({
    description: 'Miscellaneous charges',
    example: 'Additional charges for documentation',
  })
  @IsOptional()
  @IsString({ message: 'Misc charges must be a string' })
  misc_charges?: string;

  @ApiProperty({
    description: 'Name/description of work',
    example: 'Interior works of Vessel Traffic Management System Building BPX, Mumbai.',
  })
  @IsString({ message: 'Name of work must be a string' })
  name_of_work: string;

  @ApiPropertyOptional({
    description: 'Tender cost',
    type: FinancialFieldDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialFieldDto)
  tender_cost?: FinancialFieldDto;

  @ApiPropertyOptional({
    description: 'Processing fee',
    type: FinancialFieldDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialFieldDto)
  processing_fee?: FinancialFieldDto;

  @ApiPropertyOptional({
    description: 'Earnest Money Deposit (EMD)',
    type: FinancialFieldDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialFieldDto)
  emd?: FinancialFieldDto;

  @ApiPropertyOptional({
    description: 'Bank charges',
    type: FinancialFieldDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialFieldDto)
  bank_charges?: FinancialFieldDto;

  @ApiPropertyOptional({
    description: 'Documentation charges',
    type: FinancialFieldDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialFieldDto)
  documentation_charges?: FinancialFieldDto;

  @ApiPropertyOptional({
    description: 'Total tender value',
    type: FinancialFieldDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialFieldDto)
  total_tender_value?: FinancialFieldDto;

  @ApiPropertyOptional({
    description: 'Last date of submission',
    example: '2025-07-15T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Last date of submission must be a valid date string' })
  last_date_of_submission?: string;

  @ApiPropertyOptional({
    description: 'Mode of EMD submission',
    example: 'EMD Paid through SR Corporation',
  })
  @IsOptional()
  @IsString({ message: 'Mode of EMD must be a string' })
  mode_of_emd?: string;

  @ApiPropertyOptional({
    description: 'Tender status',
    enum: TenderStatus,
    example: TenderStatus.NOT_FILLED,
  })
  @IsOptional()
  @IsEnum(TenderStatus, { message: 'Tender status must be a valid enum value' })
  tender_status?: TenderStatus;

  @ApiPropertyOptional({
    description: 'EMD status',
    enum: EmdStatus,
    example: EmdStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(EmdStatus, { message: 'EMD status must be a valid enum value' })
  emd_status?: EmdStatus;

  @ApiPropertyOptional({
    description: 'Whether EMD has been returned',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'EMD returned must be a boolean' })
  emd_returned?: boolean;
}

class CompanyResponseDto {
  @ApiProperty({ description: 'Company ID' })
  id: string;

  @ApiProperty({ description: 'Company name' })
  name: string;
}

export class TenderResponseDto {
  @ApiProperty({
    description: 'Tender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  company_id: string;

  @ApiProperty({
    description: 'Company object',
    type: CompanyResponseDto,
  })
  company: CompanyResponseDto;

  @ApiProperty({
    description: 'Tender code',
    example: 'ABPLT_TE_001',
  })
  tender_code: string;

  @ApiProperty({
    description: 'Authority',
    example: 'MUMBAI PORT',
  })
  authority: string;

  @ApiProperty({
    description: 'Client name',
    example: '3rdfloor, Port House, Mumbai',
  })
  client_name: string;

  @ApiPropertyOptional({
    description: 'NIT number',
    example: 'E-28/2025',
  })
  nit_number?: string | null;

  @ApiPropertyOptional({
    description: 'Miscellaneous charges',
  })
  misc_charges?: string | null;

  @ApiProperty({
    description: 'Name of work',
    example: 'Interior works of Vessel Traffic Management System Building',
  })
  name_of_work: string;

  @ApiPropertyOptional({
    description: 'Tender cost',
    type: Number,
  })
  tender_cost?: number | null;

  @ApiPropertyOptional({
    description: 'Tender cost currency',
    enum: Currency,
  })
  tender_cost_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Processing fee',
    type: Number,
  })
  processing_fee?: number | null;

  @ApiPropertyOptional({
    description: 'Processing fee currency',
    enum: Currency,
  })
  processing_fee_currency?: Currency;

  @ApiPropertyOptional({
    description: 'EMD amount',
    type: Number,
  })
  emd?: number | null;

  @ApiPropertyOptional({
    description: 'EMD currency',
    enum: Currency,
  })
  emd_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Bank charges',
    type: Number,
  })
  bank_charges?: number | null;

  @ApiPropertyOptional({
    description: 'Bank charges currency',
    enum: Currency,
  })
  bank_charges_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Documentation charges',
    type: Number,
  })
  documentation_charges?: number | null;

  @ApiPropertyOptional({
    description: 'Documentation charges currency',
    enum: Currency,
  })
  documentation_charges_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Total tender value',
    type: Number,
  })
  total_tender_value?: number | null;

  @ApiPropertyOptional({
    description: 'Total tender value currency',
    enum: Currency,
  })
  total_tender_value_currency?: Currency;

  @ApiPropertyOptional({
    description: 'Last date of submission',
    example: '2025-07-15T15:00:00.000Z',
  })
  last_date_of_submission?: Date | null;

  @ApiPropertyOptional({
    description: 'Mode of EMD',
    example: 'EMD Paid through SR Corporation',
  })
  mode_of_emd?: string | null;

  @ApiPropertyOptional({
    description: 'Tender status',
    enum: TenderStatus,
  })
  tender_status?: TenderStatus | null;

  @ApiPropertyOptional({
    description: 'EMD status',
    enum: EmdStatus,
  })
  emd_status?: EmdStatus | null;

  @ApiProperty({
    description: 'EMD returned',
    example: false,
  })
  emd_returned: boolean;

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
