import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export enum CompanyType {
  GOVT = 'govt',
  VENDOR = 'vendor',
  INTERNAL = 'internal',
}

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company group ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Company group ID must be a valid UUID' })
  company_group_id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
    maxLength: 255,
  })
  @IsString({ message: 'Company name must be a string' })
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  name: string;

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
    description:
      'Company admin user ID. Optional - can be set later when inviting users. If not provided, company admin can be assigned via user invitations.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Company admin user ID must be a valid UUID' })
  company_admin_user_id?: string;

  @ApiPropertyOptional({
    description: 'Is company active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

class CompanyGroupResponseDto {
  @ApiProperty({
    description: 'Company group ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company group name',
    example: 'Acme Corporation Group',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Company group code',
    example: 'ACME',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Company group description',
    example: 'Leading technology company group',
  })
  description?: string;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  is_active: boolean;

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

export class CompanyResponseDto {
  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company group ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  company_group_id: string;

  @ApiProperty({
    description: 'Company group object (parent company group)',
    type: CompanyGroupResponseDto,
  })
  company_group: CompanyGroupResponseDto;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Legal name',
    example: 'Acme Corporation Private Limited',
  })
  legal_name?: string;

  @ApiPropertyOptional({
    description: 'Company type',
    enum: CompanyType,
  })
  company_type?: CompanyType;

  @ApiPropertyOptional({
    description: 'Registration number',
  })
  registration_number?: string;

  @ApiPropertyOptional({
    description: 'PAN',
  })
  pan?: string;

  @ApiPropertyOptional({
    description: 'GSTIN',
  })
  gstin?: string;

  @ApiPropertyOptional({
    description: 'Email',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Website',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Phone',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
  })
  address_line1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
  })
  address_line2?: string;

  @ApiPropertyOptional({
    description: 'City',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'Pincode',
  })
  pincode?: string;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Is verified',
    example: false,
  })
  is_verified: boolean;

  @ApiPropertyOptional({
    description: 'Company admin user ID',
  })
  company_admin_user_id?: string;

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
