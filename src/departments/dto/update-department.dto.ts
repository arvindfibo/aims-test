import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'Department name',
    example: 'Software Engineering',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Department name must be a string' })
  @MaxLength(255, { message: 'Department name must not exceed 255 characters' })
  name?: string;

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
    description: 'Department admin ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Department admin ID must be a valid UUID' })
  department_admin_id?: string;

  @ApiPropertyOptional({
    description: 'Is department active',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}
