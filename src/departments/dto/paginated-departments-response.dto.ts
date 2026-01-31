import { ApiProperty } from '@nestjs/swagger';
import { DepartmentResponseDto } from './create-department.dto';

export class PaginatedDepartmentsResponseDto {
  @ApiProperty({
    description: 'List of departments',
    type: [DepartmentResponseDto],
  })
  data: DepartmentResponseDto[];

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
