import { ApiProperty } from '@nestjs/swagger';

export class DeleteDepartmentResponseDto {
  @ApiProperty({
    description: 'Department ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Deletion status message',
    example: 'Department deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Deleted at',
    example: '2024-01-01T00:00:00.000Z',
  })
  deleted_at: Date;
}
