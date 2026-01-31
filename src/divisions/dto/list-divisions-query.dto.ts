import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_SORT_FIELDS = ['name', 'code', 'is_active', 'created_at', 'updated_at'] as const;

export type DivisionSortField = (typeof ALLOWED_SORT_FIELDS)[number];

export class ListDivisionsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by division name (partial, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by division code (partial, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ALLOWED_SORT_FIELDS,
  })
  @IsOptional()
  @IsIn(ALLOWED_SORT_FIELDS)
  sort_by?: DivisionSortField;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({
    description: 'Limit for pagination (max 100)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
