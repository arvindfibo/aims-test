import { ApiProperty } from '@nestjs/swagger';

export class DeleteTenderResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Tender deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Deleted tender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}
