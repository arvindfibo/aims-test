import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetCompanyUsersQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by division ID (optional). If provided, returns only users assigned to this division.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Division ID must be a valid UUID' })
  division_id?: string;

  @ApiPropertyOptional({
    description:
      'Filter by department ID (optional). If provided, returns only users assigned to this department. Requires division_id to be provided.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  department_id?: string;
}
