import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateDivisionDto {
  @ApiProperty({
    description: 'Company ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id: string;

  @ApiProperty({
    description: 'Division name',
    example: 'Engineering Division',
    maxLength: 255,
  })
  @IsString({ message: 'Division name must be a string' })
  @MaxLength(255, { message: 'Division name must not exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Division code',
    example: 'ENG',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Division code must be a string' })
  @MaxLength(50, { message: 'Division code must not exceed 50 characters' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Division description',
    example: 'Engineering and development division',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Division admin ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Division admin ID must be a valid UUID' })
  division_admin_id?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

export class DivisionResponseDto {
  @ApiProperty({
    description: 'Division ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  company_id: string;

  @ApiProperty({
    description: 'Division name',
    example: 'Engineering Division',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Division code',
    example: 'ENG',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Division description',
    example: 'Engineering and development division',
  })
  description?: string;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  is_active: boolean;

  @ApiPropertyOptional({
    description: 'Division admin ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  division_admin_id?: string;

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

  @ApiProperty({
    description: 'Total number of distinct users in the division',
    example: 25,
    minimum: 0,
  })
  users_count: number;

  @ApiProperty({
    description: 'Total number of departments in the division',
    example: 8,
    minimum: 0,
  })
  departments_count: number;
}
