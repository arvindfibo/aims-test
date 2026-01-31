import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyGroupDto {
  @ApiProperty({
    description: 'Company group name',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Company group code (unique identifier)',
    example: 'ACME',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    description: 'Company group description',
    example: 'Leading technology company',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SignupDto {
  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  first_name: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  @ApiProperty({
    description: 'Company group information',
    type: CompanyGroupDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CompanyGroupDto)
  company_group: CompanyGroupDto;
}

class UserResponseDto {
  @ApiProperty({ description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  first_name: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  last_name?: string;

  @ApiProperty({ description: 'User active status', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'User verified status', example: false })
  is_verified: boolean;

  @ApiProperty({ description: 'User creation timestamp', example: '2026-01-28T10:00:00.000Z' })
  created_at: Date;
}

class CompanyGroupResponseDto {
  @ApiProperty({
    description: 'Company group UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: 'Company group name', example: 'Acme Corporation' })
  name: string;

  @ApiPropertyOptional({ description: 'Company group code', example: 'ACME' })
  code?: string;

  @ApiProperty({ description: 'Company group active status', example: true })
  is_active: boolean;

  @ApiProperty({
    description: 'Company group creation timestamp',
    example: '2026-01-28T10:00:00.000Z',
  })
  created_at: Date;
}

export class SignupResponseDto {
  @ApiProperty({ description: 'Created user information', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'Created company group information', type: CompanyGroupResponseDto })
  company_group: CompanyGroupResponseDto;

  @ApiProperty({
    description: 'Success message',
    example: 'Signup successful. Please verify your email to activate your account.',
  })
  message: string;
}
