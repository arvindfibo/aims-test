import { ApiProperty } from '@nestjs/swagger';
import { DivisionResponseDto } from './create-division.dto';

export class PaginatedDivisionsResponseDto {
  @ApiProperty({
    description: 'List of divisions',
    type: [DivisionResponseDto],
  })
  data: DivisionResponseDto[];

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
