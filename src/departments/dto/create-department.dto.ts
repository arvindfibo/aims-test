import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Division ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Division ID must be a valid UUID' })
  division_id: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Software Engineering',
    maxLength: 255,
  })
  @IsString({ message: 'Department name must be a string' })
  @MaxLength(255, { message: 'Department name must not exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Department code',
    example: 'SWE',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Department code must be a string' })
  @MaxLength(50, { message: 'Department code must not exceed 50 characters' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Department description',
    example: 'Software engineering and development department',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Department admin user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Department admin user ID must be a valid UUID' })
  department_admin_user_id?: string;

  @ApiPropertyOptional({
    description: 'Is department active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

export class DepartmentResponseDto {
  @ApiProperty({
    description: 'Department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Division ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  division_id: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Software Engineering',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Department code',
    example: 'SWE',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Department description',
    example: 'Software engineering and development department',
  })
  description?: string;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  is_active: boolean;

  @ApiPropertyOptional({
    description: 'Department admin user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  department_admin_user_id?: string;

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
