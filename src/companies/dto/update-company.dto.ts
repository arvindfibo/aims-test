import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsUrl,
  IsBoolean,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { CompanyType } from './create-company.dto';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Acme Corporation',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Legal name of the company',
    example: 'Acme Corporation Private Limited',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Legal name must be a string' })
  @MaxLength(255, { message: 'Legal name must not exceed 255 characters' })
  legal_name?: string;

  @ApiPropertyOptional({
    description: 'Type of company',
    enum: CompanyType,
    example: CompanyType.INTERNAL,
  })
  @IsOptional()
  @IsEnum(CompanyType, { message: 'Company type must be one of: govt, vendor, internal' })
  company_type?: CompanyType;

  @ApiPropertyOptional({
    description: 'Company registration number',
    example: 'U12345AB2023PTC123456',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Registration number must be a string' })
  @MaxLength(100, { message: 'Registration number must not exceed 100 characters' })
  registration_number?: string;

  @ApiPropertyOptional({
    description: 'PAN (Permanent Account Number)',
    example: 'ABCDE1234F',
    maxLength: 10,
    minLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'PAN must be a string' })
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'PAN must be in format: ABCDE1234F',
  })
  @MaxLength(10, { message: 'PAN must be exactly 10 characters' })
  @MinLength(10, { message: 'PAN must be exactly 10 characters' })
  pan?: string;

  @ApiPropertyOptional({
    description: 'GSTIN (GST Identification Number)',
    example: '27ABCDE1234F1Z5',
    maxLength: 15,
    minLength: 15,
  })
  @IsOptional()
  @IsString({ message: 'GSTIN must be a string' })
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'GSTIN must be in valid format',
  })
  @MaxLength(15, { message: 'GSTIN must be exactly 15 characters' })
  @MinLength(15, { message: 'GSTIN must be exactly 15 characters' })
  gstin?: string;

  @ApiPropertyOptional({
    description: 'Company email address',
    example: 'contact@acme.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://www.acme.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @MaxLength(255, { message: 'Website must not exceed 255 characters' })
  website?: string;

  @ApiPropertyOptional({
    description: 'Company phone number',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
    example: '123 Business Park',
  })
  @IsOptional()
  @IsString({ message: 'Address line 1 must be a string' })
  address_line1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Sector 5',
  })
  @IsOptional()
  @IsString({ message: 'Address line 2 must be a string' })
  address_line2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'State must be a string' })
  @MaxLength(100, { message: 'State must not exceed 100 characters' })
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'India',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  country?: string;

  @ApiPropertyOptional({
    description: 'Pincode',
    example: '400001',
    maxLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'Pincode must be a string' })
  @MaxLength(10, { message: 'Pincode must not exceed 10 characters' })
  pincode?: string;

  @ApiPropertyOptional({
    description: 'Company admin user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company admin user ID must be a valid UUID' })
  company_admin_user_id?: string;

  @ApiPropertyOptional({
    description: 'Is company active',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}
