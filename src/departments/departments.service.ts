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
import { Repository, DataSource, Not, IsNull } from 'typeorm';
import { Department } from '../entities/department.entity';
import { Division } from '../entities/division.entity';
import { Company } from '../entities/company.entity';
import { UserRole } from '../entities/user-role.entity';
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
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
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
      const division = await queryRunner.manager.findOne(Division, {
        where: { id: createDepartmentDto.division_id, deleted_at: IsNull() },
        relations: ['company'],
      });

      if (!division) {
        throw new NotFoundException(
          `Division with ID ${createDepartmentDto.division_id} not found`,
        );
      }

      if (!division.is_active) {
        throw new ForbiddenException('Division is not active');
      }

      const company =
        division.company ||
        (await queryRunner.manager.findOne(Company, {
          where: { id: division.company_id },
        }));

      if (!company) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const roleSet = new Set(normalizedRoles);
      const isGroupAdmin = roleSet.has('GROUP_ADMIN');
      const isCompanyAdmin = roleSet.has('COMPANY_ADMIN') && company.company_admin_id === userId;
      const isDivisionAdmin =
        roleSet.has('DIVISION_ADMIN') && division.division_admin_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin) {
        throw new ForbiddenException(
          'Access denied. Only GROUP_ADMIN, COMPANY_ADMIN of this company, or DIVISION_ADMIN of this division can create departments.',
        );
      }

      const uniquenessChecks = await Promise.all([
        queryRunner.manager.findOne(Department, {
          where: {
            division_id: createDepartmentDto.division_id,
            name: createDepartmentDto.name,
            deleted_at: IsNull(),
          },
        }),
        createDepartmentDto.code
          ? queryRunner.manager.findOne(Department, {
              where: {
                division_id: createDepartmentDto.division_id,
                code: createDepartmentDto.code,
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
      ]);

      if (uniquenessChecks[0]) {
        throw new ConflictException(
          `Department with name "${createDepartmentDto.name}" already exists in this division`,
        );
      }

      if (uniquenessChecks[1]) {
        throw new ConflictException(
          `Department with code "${createDepartmentDto.code}" already exists in this division`,
        );
      }

      const department = queryRunner.manager.create(Department, {
        division_id: createDepartmentDto.division_id,
        name: createDepartmentDto.name,
        code: createDepartmentDto.code || null,
        description: createDepartmentDto.description || null,
        is_active: createDepartmentDto.is_active ?? true,
        department_admin_id: createDepartmentDto.department_admin_id || null,
        created_by: userId,
        updated_by: userId,
      });

      const savedDepartment = await queryRunner.manager.save(Department, department);
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
        error instanceof Error ? error.stack : undefined,
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

    const usersCount = await this.userRoleRepository
      .createQueryBuilder('ur')
      .select('COUNT(DISTINCT ur.user_id)', 'count')
      .where('ur.department_id = :departmentId', { departmentId })
      .andWhere('ur.deleted_at IS NULL')
      .getRawOne()
      .then((result: { count: string } | undefined) => parseInt(result?.count || '0', 10));

    return this.mapToResponseDto(department, usersCount);
  }

  async findAllByDivision(
    divisionId: string,
    query: ListDepartmentsQueryDto,
  ): Promise<PaginatedDepartmentsResponseDto> {
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

    const qb = this.departmentRepository.createQueryBuilder('department');
    qb.where('department.division_id = :divisionId', { divisionId });
    qb.andWhere('department.deleted_at IS NULL');

    if (query.name?.trim()) {
      qb.andWhere('department.name ILIKE :name', { name: `%${query.name.trim()}%` });
    }

    if (query.code?.trim()) {
      qb.andWhere('department.code ILIKE :code', { code: `%${query.code.trim()}%` });
    }

    if (query.is_active !== undefined) {
      qb.andWhere('department.is_active = :isActive', { isActive: query.is_active });
    }

    const sortFieldMap: Record<string, string> = {
      name: 'department.name',
      code: 'department.code',
      is_active: 'department.is_active',
      created_at: 'department.created_at',
      updated_at: 'department.updated_at',
    };

    const sortField = sortFieldMap[sortBy] || 'department.created_at';
    qb.orderBy(sortField, sortOrder);
    qb.skip(safeOffset);
    qb.take(safeLimit);

    const [departments, total] = await qb.getManyAndCount();

    return {
      data: departments.map((department) => this.mapToResponseDto(department)),
      pagination: {
        total,
        offset: safeOffset,
        limit: safeLimit,
        hasMore: safeOffset + departments.length < total,
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

      const company =
        division.company ||
        (await queryRunner.manager.findOne(Company, {
          where: { id: division.company_id },
        }));

      if (!company) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const roleSet = new Set(normalizedRoles);
      const isGroupAdmin = roleSet.has('GROUP_ADMIN');
      const isCompanyAdmin = roleSet.has('COMPANY_ADMIN') && company.company_admin_id === userId;
      const isDivisionAdmin =
        roleSet.has('DIVISION_ADMIN') && division.division_admin_id === userId;
      const isDepartmentAdmin =
        roleSet.has('DEPARTMENT_ADMIN') && department.department_admin_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin && !isDepartmentAdmin) {
        throw new ForbiddenException('Access denied to update this department');
      }

      const updatableFields: (keyof UpdateDepartmentDto)[] = [
        'name',
        'code',
        'description',
        'department_admin_id',
        'is_active',
      ];

      const hasUpdates = updatableFields.some((field) => updateDepartmentDto[field] !== undefined);

      if (!hasUpdates) {
        throw new BadRequestException('No valid fields provided for update');
      }

      const uniquenessChecks = await Promise.all([
        updateDepartmentDto.name !== undefined
          ? queryRunner.manager.findOne(Department, {
              where: {
                division_id: department.division_id,
                name: updateDepartmentDto.name,
                id: Not(department.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
        updateDepartmentDto.code !== undefined && updateDepartmentDto.code
          ? queryRunner.manager.findOne(Department, {
              where: {
                division_id: department.division_id,
                code: updateDepartmentDto.code,
                id: Not(department.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
      ]);

      if (uniquenessChecks[0]) {
        throw new ConflictException(
          `Department with name "${updateDepartmentDto.name}" already exists in this division`,
        );
      }

      if (uniquenessChecks[1]) {
        throw new ConflictException(
          `Department with code "${updateDepartmentDto.code}" already exists in this division`,
        );
      }

      Object.assign(department, {
        ...(updateDepartmentDto.name !== undefined && { name: updateDepartmentDto.name }),
        ...(updateDepartmentDto.code !== undefined && { code: updateDepartmentDto.code || null }),
        ...(updateDepartmentDto.description !== undefined && {
          description: updateDepartmentDto.description || null,
        }),
        ...(updateDepartmentDto.department_admin_id !== undefined && {
          department_admin_id: updateDepartmentDto.department_admin_id || null,
        }),
        ...(updateDepartmentDto.is_active !== undefined && {
          is_active: updateDepartmentDto.is_active,
        }),
        updated_by: userId,
      });

      const savedDepartment = await queryRunner.manager.save(Department, department);
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
        error instanceof Error ? error.stack : undefined,
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

      const division = await queryRunner.manager.findOne(Division, {
        where: { id: department.division_id },
        relations: ['company'],
      });

      if (!division) {
        throw new NotFoundException(`Division with ID ${department.division_id} not found`);
      }

      const companyForAuth =
        division.company ||
        (await queryRunner.manager.findOne(Company, { where: { id: division.company_id } }));

      if (!companyForAuth) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!companyForAuth.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      if (!division.is_active) {
        throw new ForbiddenException('Division is not active');
      }

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const roleSet = new Set(normalizedRoles);
      const isGroupAdmin = roleSet.has('GROUP_ADMIN');
      const isCompanyAdmin =
        roleSet.has('COMPANY_ADMIN') && companyForAuth.company_admin_id === userId;
      const isDivisionAdmin =
        roleSet.has('DIVISION_ADMIN') && division.division_admin_id === userId;
      const isDepartmentAdmin =
        roleSet.has('DEPARTMENT_ADMIN') && department.department_admin_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin && !isDepartmentAdmin) {
        throw new ForbiddenException('Access denied to delete this department');
      }

      Object.assign(department, {
        deleted_at: new Date(),
        updated_by: userId,
        is_active: false,
      });

      const savedDepartment = await queryRunner.manager.save(Department, department);
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
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to delete department');
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponseDto(department: Department, usersCount: number = 0): DepartmentResponseDto {
    return {
      id: department.id,
      division_id: department.division_id,
      name: department.name,
      code: department.code || undefined,
      description: department.description || undefined,
      is_active: department.is_active,
      department_admin_id: department.department_admin_id || undefined,
      created_at: department.created_at,
      updated_at: department.updated_at,
      users_count: usersCount,
    };
  }
}
