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
import { Division } from '../entities/division.entity';
import { Company } from '../entities/company.entity';
import { Department } from '../entities/department.entity';
import { UserRole } from '../entities/user-role.entity';
import { CreateDivisionDto, DivisionResponseDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { DeleteDivisionResponseDto } from './dto/delete-division.dto';
import { ListDivisionsQueryDto } from './dto/list-divisions-query.dto';
import { PaginatedDivisionsResponseDto } from './dto/paginated-divisions-response.dto';

@Injectable()
export class DivisionsService {
  private readonly logger = new Logger(DivisionsService.name);

  constructor(
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDivisionDto: CreateDivisionDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DivisionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: createDivisionDto.company_id, deleted_at: IsNull() },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${createDivisionDto.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const roleSet = new Set(normalizedRoles);
      const isGroupAdmin = roleSet.has('GROUP_ADMIN');
      const isCompanyAdmin = roleSet.has('COMPANY_ADMIN') && company.company_admin_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin) {
        throw new ForbiddenException(
          'Access denied. Only GROUP_ADMIN or COMPANY_ADMIN of this company can create divisions.',
        );
      }

      const uniquenessChecks = await Promise.all([
        queryRunner.manager.findOne(Division, {
          where: {
            company_id: createDivisionDto.company_id,
            name: createDivisionDto.name,
            deleted_at: IsNull(),
          },
        }),
        createDivisionDto.code
          ? queryRunner.manager.findOne(Division, {
              where: {
                company_id: createDivisionDto.company_id,
                code: createDivisionDto.code,
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
      ]);

      if (uniquenessChecks[0]) {
        throw new ConflictException(
          `Division with name "${createDivisionDto.name}" already exists in this company`,
        );
      }

      if (uniquenessChecks[1]) {
        throw new ConflictException(
          `Division with code "${createDivisionDto.code}" already exists in this company`,
        );
      }

      const division = queryRunner.manager.create(Division, {
        company_id: createDivisionDto.company_id,
        name: createDivisionDto.name,
        code: createDivisionDto.code || null,
        description: createDivisionDto.description || null,
        is_active: createDivisionDto.is_active ?? true,
        division_admin_id: createDivisionDto.division_admin_id || null,
        created_by: userId,
        updated_by: userId,
      });

      const savedDivision = await queryRunner.manager.save(Division, division);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Division "${savedDivision.name}" created successfully by user ${userId} in company ${createDivisionDto.company_id}`,
      );

      return this.mapToResponseDto(savedDivision);
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
        `Failed to create division: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to create division');
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(divisionId: string): Promise<DivisionResponseDto> {
    const division = await this.divisionRepository.findOne({
      where: { id: divisionId, deleted_at: IsNull() },
      relations: ['company'],
    });

    if (!division) {
      throw new NotFoundException(`Division with ID ${divisionId} not found`);
    }

    const [usersCount, departmentsCount] = await Promise.all([
      this.userRoleRepository
        .createQueryBuilder('ur')
        .select('COUNT(DISTINCT ur.user_id)', 'count')
        .where('ur.division_id = :divisionId', { divisionId })
        .andWhere('ur.deleted_at IS NULL')
        .getRawOne()
        .then((result: { count: string } | undefined) => parseInt(result?.count || '0', 10)),
      this.departmentRepository
        .createQueryBuilder('dept')
        .where('dept.division_id = :divisionId', { divisionId })
        .andWhere('dept.deleted_at IS NULL')
        .getCount(),
    ]);

    return this.mapToResponseDto(division, usersCount, departmentsCount);
  }

  async findAllByCompany(
    companyId: string,
    query: ListDivisionsQueryDto,
  ): Promise<PaginatedDivisionsResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId, deleted_at: IsNull() },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const safeOffset = Math.max(query.offset ?? 0, 0);
    const safeLimit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const sortBy = query.sort_by ?? 'created_at';
    const sortOrder = query.sort_order === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.divisionRepository.createQueryBuilder('division');
    qb.where('division.company_id = :companyId', { companyId });
    qb.andWhere('division.deleted_at IS NULL');

    if (query.name?.trim()) {
      qb.andWhere('division.name ILIKE :name', { name: `%${query.name.trim()}%` });
    }

    if (query.code?.trim()) {
      qb.andWhere('division.code ILIKE :code', { code: `%${query.code.trim()}%` });
    }

    if (query.is_active !== undefined) {
      qb.andWhere('division.is_active = :isActive', { isActive: query.is_active });
    }

    const sortFieldMap: Record<string, string> = {
      name: 'division.name',
      code: 'division.code',
      is_active: 'division.is_active',
      created_at: 'division.created_at',
      updated_at: 'division.updated_at',
    };

    const sortField = sortFieldMap[sortBy] || 'division.created_at';
    qb.orderBy(sortField, sortOrder);
    qb.skip(safeOffset);
    qb.take(safeLimit);

    const [divisions, total] = await qb.getManyAndCount();

    return {
      data: divisions.map((division) => this.mapToResponseDto(division)),
      pagination: {
        total,
        offset: safeOffset,
        limit: safeLimit,
        hasMore: safeOffset + divisions.length < total,
      },
    };
  }

  async update(
    divisionId: string,
    updateDivisionDto: UpdateDivisionDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DivisionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const division = await queryRunner.manager.findOne(Division, {
        where: { id: divisionId, deleted_at: IsNull() },
        relations: ['company'],
      });

      if (!division) {
        throw new NotFoundException(`Division with ID ${divisionId} not found`);
      }

      const companyForAuth = await queryRunner.manager.findOne(Company, {
        where: { id: division.company_id },
      });

      if (!companyForAuth) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!companyForAuth.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const roleSet = new Set(normalizedRoles);
      const isGroupAdmin = roleSet.has('GROUP_ADMIN');
      const isCompanyAdmin =
        roleSet.has('COMPANY_ADMIN') && companyForAuth.company_admin_id === userId;
      const isDivisionAdmin =
        roleSet.has('DIVISION_ADMIN') && division.division_admin_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin) {
        throw new ForbiddenException('Access denied to update this division');
      }

      const updatableFields: (keyof UpdateDivisionDto)[] = [
        'name',
        'code',
        'description',
        'division_admin_id',
        'is_active',
      ];

      const hasUpdates = updatableFields.some((field) => updateDivisionDto[field] !== undefined);

      if (!hasUpdates) {
        throw new BadRequestException('No valid fields provided for update');
      }

      const uniquenessChecks = await Promise.all([
        updateDivisionDto.name !== undefined
          ? queryRunner.manager.findOne(Division, {
              where: {
                company_id: division.company_id,
                name: updateDivisionDto.name,
                id: Not(division.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
        updateDivisionDto.code !== undefined && updateDivisionDto.code
          ? queryRunner.manager.findOne(Division, {
              where: {
                company_id: division.company_id,
                code: updateDivisionDto.code,
                id: Not(division.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
      ]);

      if (uniquenessChecks[0]) {
        throw new ConflictException(
          `Division with name "${updateDivisionDto.name}" already exists in this company`,
        );
      }

      if (uniquenessChecks[1]) {
        throw new ConflictException(
          `Division with code "${updateDivisionDto.code}" already exists in this company`,
        );
      }

      Object.assign(division, {
        ...(updateDivisionDto.name !== undefined && { name: updateDivisionDto.name }),
        ...(updateDivisionDto.code !== undefined && { code: updateDivisionDto.code || null }),
        ...(updateDivisionDto.description !== undefined && {
          description: updateDivisionDto.description || null,
        }),
        ...(updateDivisionDto.division_admin_id !== undefined && {
          division_admin_id: updateDivisionDto.division_admin_id || null,
        }),
        ...(updateDivisionDto.is_active !== undefined && {
          is_active: updateDivisionDto.is_active,
        }),
        updated_by: userId,
      });

      const savedDivision = await queryRunner.manager.save(Division, division);
      await queryRunner.commitTransaction();

      this.logger.log(`Division "${savedDivision.name}" updated successfully by user ${userId}`);

      return this.mapToResponseDto(savedDivision);
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
        `Failed to update division: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to update division');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(
    divisionId: string,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DeleteDivisionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const division = await queryRunner.manager.findOne(Division, {
        where: { id: divisionId, deleted_at: IsNull() },
        relations: ['company'],
      });

      if (!division) {
        throw new NotFoundException(`Division with ID ${divisionId} not found`);
      }

      const companyForAuth = await queryRunner.manager.findOne(Company, {
        where: { id: division.company_id },
      });

      if (!companyForAuth) {
        throw new NotFoundException(`Company with ID ${division.company_id} not found`);
      }

      if (!companyForAuth.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const roleSet = new Set(normalizedRoles);
      const isGroupAdmin = roleSet.has('GROUP_ADMIN');
      const isCompanyAdmin =
        roleSet.has('COMPANY_ADMIN') && companyForAuth.company_admin_id === userId;
      const isDivisionAdmin =
        roleSet.has('DIVISION_ADMIN') && division.division_admin_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin) {
        throw new ForbiddenException('Access denied to delete this division');
      }

      Object.assign(division, {
        deleted_at: new Date(),
        updated_by: userId,
        is_active: false,
      });

      const savedDivision = await queryRunner.manager.save(Division, division);
      await queryRunner.commitTransaction();

      this.logger.log(`Division "${savedDivision.name}" deleted successfully by user ${userId}`);

      return {
        id: savedDivision.id,
        message: 'Division deleted successfully',
        deleted_at: savedDivision.deleted_at as Date,
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
        `Failed to delete division: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to delete division');
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponseDto(
    division: Division,
    usersCount: number = 0,
    departmentsCount: number = 0,
  ): DivisionResponseDto {
    return {
      id: division.id,
      company_id: division.company_id,
      name: division.name,
      code: division.code || undefined,
      description: division.description || undefined,
      is_active: division.is_active,
      division_admin_id: division.division_admin_id || undefined,
      created_at: division.created_at,
      updated_at: division.updated_at,
      users_count: usersCount,
      departments_count: departmentsCount,
    };
  }
}
