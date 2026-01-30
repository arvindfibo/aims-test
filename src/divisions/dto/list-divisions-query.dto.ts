import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const ALLOWED_SORT_FIELDS = ['name', 'code', 'is_active', 'created_at', 'updated_at'] as const;

export type DivisionSortField = (typeof ALLOWED_SORT_FIELDS)[number];

export class ListDivisionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by division name (partial, case-insensitive)',
    example: 'Engineering',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by division code (partial, case-insensitive)',
    example: 'ENG',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ALLOWED_SORT_FIELDS,
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(ALLOWED_SORT_FIELDS)
  sortBy?: DivisionSortField = 'created_at';
}
