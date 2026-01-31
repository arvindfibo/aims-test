import { ApiProperty } from '@nestjs/swagger';
import { CompanyResponseDto } from './create-company.dto';

export class PaginatedCompaniesResponseDto {
  @ApiProperty({
    description: 'List of companies',
    type: [CompanyResponseDto],
  })
  data: CompanyResponseDto[];

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
