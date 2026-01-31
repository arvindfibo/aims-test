import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, IsNull, ILike } from 'typeorm';
import { Department } from '../entities/department.entity';
import { Division } from '../entities/division.entity';
import { Company } from '../entities/company.entity';
import { CreateDepartmentDto, DepartmentResponseDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DeleteDepartmentResponseDto } from './dto/delete-department.dto';
import { ListDepartmentsQueryDto } from './dto/list-departments-query.dto';
import { PaginatedDepartmentsResponseDto } from './dto/paginated-departments-response.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DepartmentResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify division exists and is active
      const division = await queryRunner.manager.findOne(Division, {
        where: { id: createDepartmentDto.division_id, deleted_at: IsNull() },
        relations: ['company'],
      });

      if (!division) {
        throw new NotFoundException(
          `Division with ID ${createDepartmentDto.division_id} not found`,
        );
      }

      // Verify division is active
      if (!division.is_active) {
        throw new ForbiddenException('Division is not active');
      }

      // Get company for authorization check
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: division.company_id },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      // Authorization check
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');
      const isCompanyAdmin =
        normalizedRoles.includes('COMPANY_ADMIN') && company.company_admin_user_id === userId;
      const isDivisionAdmin =
        normalizedRoles.includes('DIVISION_ADMIN') && division.division_admin_user_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin) {
        throw new ForbiddenException(
          'Access denied. Only GROUP_ADMIN, COMPANY_ADMIN of this company, or DIVISION_ADMIN of this division can create departments.',
        );
      }

      // Check if department name already exists in the same division
      const existingDepartmentByName = await queryRunner.manager.findOne(Department, {
        where: {
          division_id: createDepartmentDto.division_id,
          name: createDepartmentDto.name,
          deleted_at: IsNull(),
        },
      });

      if (existingDepartmentByName) {
        throw new ConflictException(
          `Department with name "${createDepartmentDto.name}" already exists in this division`,
        );
      }

      // Check if department code already exists in the same division (if provided)
      if (createDepartmentDto.code) {
        const existingDepartmentByCode = await queryRunner.manager.findOne(Department, {
          where: {
            division_id: createDepartmentDto.division_id,
            code: createDepartmentDto.code,
            deleted_at: IsNull(),
          },
        });

        if (existingDepartmentByCode) {
          throw new ConflictException(
            `Department with code "${createDepartmentDto.code}" already exists in this division`,
          );
        }
      }

      // Create department entity
      const department = this.departmentRepository.create({
        division_id: createDepartmentDto.division_id,
        name: createDepartmentDto.name,
        code: createDepartmentDto.code || null,
        description: createDepartmentDto.description || null,
        is_active: createDepartmentDto.is_active ?? true,
        department_admin_user_id: createDepartmentDto.department_admin_user_id || null,
        created_by: userId,
        updated_by: userId,
      });

      const savedDepartment = await queryRunner.manager.save(Department, department);

      if (!savedDepartment) {
        throw new InternalServerErrorException('Failed to create department');
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Department "${savedDepartment.name}" created successfully by user ${userId} in division ${createDepartmentDto.division_id}`,
      );

      return this.mapToResponseDto(savedDepartment);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to create department: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to create department');
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(departmentId: string): Promise<DepartmentResponseDto> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId, deleted_at: IsNull() },
      relations: ['division'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${departmentId} not found`);
    }

    return this.mapToResponseDto(department);
  }

  async findAllByDivision(
    divisionId: string,
    query: ListDepartmentsQueryDto,
  ): Promise<PaginatedDepartmentsResponseDto> {
    // Verify division exists
    const division = await this.divisionRepository.findOne({
      where: { id: divisionId, deleted_at: IsNull() },
    });

    if (!division) {
      throw new NotFoundException(`Division with ID ${divisionId} not found`);
    }

    const safeOffset = Math.max(query.offset ?? 0, 0);
    const safeLimit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const sortBy = query.sort_by ?? 'created_at';
    const sortOrder = query.sort_order === 'ASC' ? 'ASC' : 'DESC';

    const where: Record<string, unknown> = {
      division_id: divisionId,
      deleted_at: IsNull(),
    };
    if (query.name?.trim()) {
      where.name = ILike(`%${query.name.trim()}%`);
    }
    if (query.code?.trim()) {
      where.code = ILike(`%${query.code.trim()}%`);
    }
    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    const [departments, total] = await this.departmentRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: safeOffset,
      take: safeLimit,
    });

    const data = departments.map((department) => this.mapToResponseDto(department));
    const hasMore = safeOffset + departments.length < total;

    return {
      data,
      pagination: {
        total,
        offset: safeOffset,
        limit: safeLimit,
        hasMore,
      },
    };
  }

  async update(
    departmentId: string,
    updateDepartmentDto: UpdateDepartmentDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DepartmentResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const department = await queryRunner.manager.findOne(Department, {
        where: { id: departmentId, deleted_at: IsNull() },
        relations: ['division'],
      });

      if (!department) {
        throw new NotFoundException(`Department with ID ${departmentId} not found`);
      }

      // Get division and company for authorization check
      const division = await queryRunner.manager.findOne(Division, {
        where: { id: department.division_id },
        relations: ['company'],
      });

      if (!division) {
        throw new NotFoundException(`Division with ID ${department.division_id} not found`);
      }

      if (!division.is_active) {
        throw new ForbiddenException('Division is not active');
      }

      const company = await queryRunner.manager.findOne(Company, {
        where: { id: division.company_id },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      // Authorization check
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');
      const isCompanyAdmin =
        normalizedRoles.includes('COMPANY_ADMIN') && company.company_admin_user_id === userId;
      const isDivisionAdmin =
        normalizedRoles.includes('DIVISION_ADMIN') && division.division_admin_user_id === userId;
      const isDepartmentAdmin =
        normalizedRoles.includes('DEPARTMENT_ADMIN') &&
        department.department_admin_user_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin && !isDepartmentAdmin) {
        throw new ForbiddenException('Access denied to update this department');
      }

      const updatableFields: (keyof UpdateDepartmentDto)[] = [
        'name',
        'code',
        'description',
        'department_admin_user_id',
        'is_active',
      ];

      const hasUpdates = updatableFields.some(
        (field) => typeof updateDepartmentDto[field] !== 'undefined',
      );

      if (!hasUpdates) {
        throw new BadRequestException('No valid fields provided for update');
      }

      // Check for duplicate name if updating name
      if (updateDepartmentDto.name !== undefined) {
        const existingDepartment = await queryRunner.manager.findOne(Department, {
          where: {
            division_id: department.division_id,
            name: updateDepartmentDto.name,
            id: Not(department.id),
            deleted_at: IsNull(),
          },
        });

        if (existingDepartment) {
          throw new ConflictException(
            `Department with name "${updateDepartmentDto.name}" already exists in this division`,
          );
        }
      }

      // Check for duplicate code if updating code
      if (updateDepartmentDto.code !== undefined && updateDepartmentDto.code) {
        const existingDepartment = await queryRunner.manager.findOne(Department, {
          where: {
            division_id: department.division_id,
            code: updateDepartmentDto.code,
            id: Not(department.id),
            deleted_at: IsNull(),
          },
        });

        if (existingDepartment) {
          throw new ConflictException(
            `Department with code "${updateDepartmentDto.code}" already exists in this division`,
          );
        }
      }

      // Update fields
      if (updateDepartmentDto.name !== undefined) {
        department.name = updateDepartmentDto.name;
      }

      if (updateDepartmentDto.code !== undefined) {
        department.code = updateDepartmentDto.code || null;
      }

      if (updateDepartmentDto.description !== undefined) {
        department.description = updateDepartmentDto.description || null;
      }

      if (updateDepartmentDto.department_admin_user_id !== undefined) {
        department.department_admin_user_id = updateDepartmentDto.department_admin_user_id || null;
      }

      if (updateDepartmentDto.is_active !== undefined) {
        department.is_active = updateDepartmentDto.is_active;
      }

      department.updated_by = userId;

      const savedDepartment = await queryRunner.manager.save(Department, department);

      if (!savedDepartment) {
        throw new InternalServerErrorException('Failed to update department');
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Department "${savedDepartment.name}" updated successfully by user ${userId}`,
      );

      return this.mapToResponseDto(savedDepartment);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update department: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to update department');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(
    departmentId: string,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DeleteDepartmentResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const department = await queryRunner.manager.findOne(Department, {
        where: { id: departmentId, deleted_at: IsNull() },
        relations: ['division'],
      });

      if (!department) {
        throw new NotFoundException(`Department with ID ${departmentId} not found`);
      }

      // Get division and company for authorization check
      const division = await queryRunner.manager.findOne(Division, {
        where: { id: department.division_id },
      });

      if (!division) {
        throw new NotFoundException(`Division with ID ${department.division_id} not found`);
      }

      const company = await queryRunner.manager.findOne(Company, {
        where: { id: division.company_id },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      if (!division.is_active) {
        throw new ForbiddenException('Division is not active');
      }

      // Authorization check
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');
      const isCompanyAdmin =
        normalizedRoles.includes('COMPANY_ADMIN') && company.company_admin_user_id === userId;
      const isDivisionAdmin =
        normalizedRoles.includes('DIVISION_ADMIN') && division.division_admin_user_id === userId;
      const isDepartmentAdmin =
        normalizedRoles.includes('DEPARTMENT_ADMIN') &&
        department.department_admin_user_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin && !isDepartmentAdmin) {
        throw new ForbiddenException('Access denied to delete this department');
      }

      // Soft delete
      department.deleted_at = new Date();
      department.updated_by = userId;
      department.is_active = false;

      const savedDepartment = await queryRunner.manager.save(Department, department);

      if (!savedDepartment) {
        throw new InternalServerErrorException('Failed to delete department');
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Department "${savedDepartment.name}" deleted successfully by user ${userId}`,
      );

      return {
        id: savedDepartment.id,
        message: 'Department deleted successfully',
        deleted_at: savedDepartment.deleted_at as Date,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to delete department: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to delete department');
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponseDto(department: Department): DepartmentResponseDto {
    return {
      id: department.id,
      division_id: department.division_id,
      name: department.name,
      code: department.code || undefined,
      description: department.description || undefined,
      is_active: department.is_active,
      department_admin_user_id: department.department_admin_user_id || undefined,
      created_at: department.created_at,
      updated_at: department.updated_at,
    };
  }
}
