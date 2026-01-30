import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateDivisionDto {
  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
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
    description: 'Division admin user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Division admin user ID must be a valid UUID' })
  division_admin_user_id?: string;

  @ApiPropertyOptional({
    description: 'Is division active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

export class DivisionResponseDto {
  @ApiProperty({
    description: 'Division ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
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
    description: 'Division admin user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  division_admin_user_id?: string;

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
