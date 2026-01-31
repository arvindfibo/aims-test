import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({
    description: 'Role ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'GROUP_ADMIN',
  })
  name: string;

  @ApiProperty({
    description: 'Role permissions as a JSON object',
    example: {
      companies: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
    },
    type: 'object',
    additionalProperties: true,
  })
  permissions: Record<string, string[]>;

  @ApiProperty({
    description: 'Role creation timestamp',
    example: '2026-01-29T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Role last update timestamp',
    example: '2026-01-29T10:00:00.000Z',
  })
  updated_at: Date;
}
