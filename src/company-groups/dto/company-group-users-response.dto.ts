import { ApiProperty } from '@nestjs/swagger';

export class CompanyGroupUserRowDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  user_id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  first_name: string;

  @ApiProperty({ description: 'User last name', example: 'Doe', nullable: true })
  last_name: string | null;

  @ApiProperty({ description: 'User phone number', example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Whether user is active', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'Whether user email is verified', example: true })
  is_verified: boolean;

  @ApiProperty({ description: 'Role ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  role_id: string;

  @ApiProperty({ description: 'Role name', example: 'COMPANY_ADMIN' })
  role_name: string;

  @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  company_id: string | null;

  @ApiProperty({ description: 'Company name', example: 'Acme Corporation', nullable: true })
  company_name: string | null;

  @ApiProperty({
    description: 'Division ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  division_id: string | null;

  @ApiProperty({ description: 'Division name', example: 'Engineering Division', nullable: true })
  division_name: string | null;

  @ApiProperty({
    description: 'Department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  department_id: string | null;

  @ApiProperty({ description: 'Department name', example: 'Software Engineering', nullable: true })
  department_name: string | null;

  @ApiProperty({
    description: 'Invitation status',
    example: 'accepted',
    enum: ['pending', 'accepted', 'rejected', 'expired', 'none'],
  })
  invitation_status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'none';

  @ApiProperty({
    description: 'Invitation expiry date',
    example: '2024-01-15T00:00:00.000Z',
    nullable: true,
  })
  invitation_expires_at: Date | null;

  @ApiProperty({
    description: 'User role assignment created at',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'User role assignment updated at',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}

export class PaginatedCompanyGroupUsersResponseDto {
  @ApiProperty({ description: 'List of users across companies', type: [CompanyGroupUserRowDto] })
  data: CompanyGroupUserRowDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 50,
      offset: 0,
      limit: 10,
      hasMore: true,
    },
  })
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}
