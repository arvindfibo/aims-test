import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStatsResponseDto {
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
    example: '2024-01-15T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Company group last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Email address (stored in metadata)',
    example: 'contact@acme.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number (stored in metadata)',
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Address (stored in metadata)',
    example: '123 Main Street, Suite 100',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'City (stored in metadata)',
    example: 'New York',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'State (stored in metadata)',
    example: 'New York',
  })
  state?: string;

  @ApiProperty({
    description: 'Total number of distinct users in the company group',
    example: 150,
    minimum: 0,
  })
  users_count: number;

  @ApiProperty({
    description: 'Total number of companies in the company group',
    example: 12,
    minimum: 0,
  })
  companies_count: number;

  @ApiProperty({
    description: 'Total number of divisions across all companies in the company group',
    example: 45,
    minimum: 0,
  })
  divisions_count: number;

  @ApiProperty({
    description: 'Total number of departments across all divisions in the company group',
    example: 120,
    minimum: 0,
  })
  departments_count: number;

  @ApiProperty({
    description: 'Timestamp when the statistics were generated',
    example: '2024-01-15T10:30:00.000Z',
  })
  generated_at: Date;
}
