import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyGroupResponseDto {
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
  code: string | null;

  @ApiPropertyOptional({
    description: 'Company group description',
    example: 'Leading technology solutions provider',
  })
  description: string | null;

  @ApiProperty({
    description: 'Is company group active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Super admin user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  company_group_admin_id: string;

  @ApiProperty({
    description: 'Company group creation timestamp',
    example: '2026-01-29T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Company group last update timestamp',
    example: '2026-01-29T10:00:00.000Z',
  })
  updated_at: Date;
}
