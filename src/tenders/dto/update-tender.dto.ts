import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
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
    example: Currency.INR,
  })
  @IsOptional()
  @IsEnum(Currency, { message: 'Currency must be INR or USD' })
  currency?: Currency;
}

export class UpdateTenderDto {
  @ApiPropertyOptional({
    description: 'Tender code',
    example: 'ABPLT_TE_001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Tender code must be a string' })
  @MaxLength(100, { message: 'Tender code must not exceed 100 characters' })
  tender_code?: string;

  @ApiPropertyOptional({
    description: 'Issuing authority',
    example: 'MUMBAI PORT',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Authority must be a string' })
  @MaxLength(255, { message: 'Authority must not exceed 255 characters' })
  authority?: string;

  @ApiPropertyOptional({
    description: 'Client name and address',
    example: '3rdfloor, Port House, Mumbai',
  })
  @IsOptional()
  @IsString({ message: 'Client name must be a string' })
  client_name?: string;

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

  @ApiPropertyOptional({
    description: 'Name/description of work',
    example: 'Interior works of Vessel Traffic Management System Building',
  })
  @IsOptional()
  @IsString({ message: 'Name of work must be a string' })
  name_of_work?: string;

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
    example: TenderStatus.ON_GOING,
  })
  @IsOptional()
  @IsEnum(TenderStatus, { message: 'Tender status must be a valid enum value' })
  tender_status?: TenderStatus;

  @ApiPropertyOptional({
    description: 'EMD status',
    enum: EmdStatus,
    example: EmdStatus.PAID,
  })
  @IsOptional()
  @IsEnum(EmdStatus, { message: 'EMD status must be a valid enum value' })
  emd_status?: EmdStatus;

  @ApiPropertyOptional({
    description: 'Whether EMD has been returned',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'EMD returned must be a boolean' })
  emd_returned?: boolean;
}
