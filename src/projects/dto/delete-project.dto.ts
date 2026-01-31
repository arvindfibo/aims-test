import { ApiProperty } from '@nestjs/swagger';

export class DeleteProjectResponseDto {
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Deletion status message',
    example: 'Project deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Deleted at',
    example: '2024-01-01T00:00:00.000Z',
  })
  deleted_at: Date;
}
