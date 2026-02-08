import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateDivisionDto {
  @ApiPropertyOptional({
    description: 'Division name',
    example: 'Engineering Division',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Division name must be a string' })
  @MaxLength(255, { message: 'Division name must not exceed 255 characters' })
  name?: string;

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

  @ApiPropertyOptional({
    description: 'Is division active',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}
