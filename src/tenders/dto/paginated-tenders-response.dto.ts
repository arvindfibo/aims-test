import { ApiProperty } from '@nestjs/swagger';
import { TenderResponseDto } from './create-tender.dto';

export class PaginatedTendersResponseDto {
  @ApiProperty({
    description: 'List of tenders',
    type: [TenderResponseDto],
  })
  data: TenderResponseDto[];

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
