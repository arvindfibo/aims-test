import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDto {
  @ApiProperty({
    description: 'Role ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'COMPANY_ADMIN',
  })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Company Administrator',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Role permissions',
    example: { companies: ['read', 'write'], users: ['read'] },
  })
  permissions: Record<string, unknown>;
}

export class CompanyUserDto {
  @ApiProperty({
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  last_name: string | null;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Whether user is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Whether user email is verified',
    example: true,
  })
  is_verified: boolean;

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
    description: 'User roles in this company',
    type: [UserRoleDto],
  })
  roles: UserRoleDto[];

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}

export class CompanyUsersResponseDto {
  @ApiProperty({
    description: 'Company ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  company_id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
  })
  company_name: string;

  @ApiProperty({
    description: 'Division ID (UUID) - present if filtered by division',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
    nullable: true,
  })
  division_id: string | null;

  @ApiProperty({
    description: 'Division name - present if filtered by division',
    example: 'Engineering Division',
    nullable: true,
  })
  division_name: string | null;

  @ApiProperty({
    description: 'Department ID (UUID) - present if filtered by department',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
    nullable: true,
  })
  department_id: string | null;

  @ApiProperty({
    description: 'Department name - present if filtered by department',
    example: 'Software Engineering',
    nullable: true,
  })
  department_name: string | null;

  @ApiProperty({
    description: 'Total number of users',
    example: 10,
  })
  total_users: number;

  @ApiProperty({
    description: 'List of users with their invitation status and roles',
    type: [CompanyUserDto],
  })
  users: CompanyUserDto[];
}
