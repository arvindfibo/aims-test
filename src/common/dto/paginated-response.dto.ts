import { ApiProperty } from '@nestjs/swagger';

/**
 * Metadata for paginated list responses.
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items', example: 42 })
  total: number;

  @ApiProperty({ description: 'Current page (1-based)', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPreviousPage: boolean;
}

/**
 * Generic paginated response wrapper.
 * Use with PaginationMetaDto and your entity response DTO array.
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'List of items', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    const totalPages = Math.ceil(total / limit) || 1;
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
