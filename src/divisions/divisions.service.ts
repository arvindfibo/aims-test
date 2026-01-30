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
import { Division } from '../entities/division.entity';
import { Company } from '../entities/company.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import { CreateDivisionDto, DivisionResponseDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { DeleteDivisionResponseDto } from './dto/delete-division.dto';
import { ListDivisionsQueryDto } from './dto/list-divisions-query.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class DivisionsService {
  private readonly logger = new Logger(DivisionsService.name);

  constructor(
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
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
      // Verify company exists and is active
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: createDivisionDto.company_id, deleted_at: IsNull() },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${createDivisionDto.company_id} not found`);
      }

      // Verify company is active
      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      // Authorization check: COMPANY_ADMIN must be admin of the company
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');
      const isCompanyAdmin =
        normalizedRoles.includes('COMPANY_ADMIN') && company.company_admin_user_id === userId;

      if (!isGroupAdmin && !isCompanyAdmin) {
        throw new ForbiddenException(
          'Access denied. Only GROUP_ADMIN or COMPANY_ADMIN of this company can create divisions.',
        );
      }

      // Check if division name already exists in the same company
      const existingDivisionByName = await queryRunner.manager.findOne(Division, {
        where: {
          company_id: createDivisionDto.company_id,
          name: createDivisionDto.name,
          deleted_at: IsNull(),
        },
      });

      if (existingDivisionByName) {
        throw new ConflictException(
          `Division with name "${createDivisionDto.name}" already exists in this company`,
        );
      }

      // Check if division code already exists in the same company (if provided)
      if (createDivisionDto.code) {
        const existingDivisionByCode = await queryRunner.manager.findOne(Division, {
          where: {
            company_id: createDivisionDto.company_id,
            code: createDivisionDto.code,
            deleted_at: IsNull(),
          },
        });

        if (existingDivisionByCode) {
          throw new ConflictException(
            `Division with code "${createDivisionDto.code}" already exists in this company`,
          );
        }
      }

      // Create division entity
      const division = this.divisionRepository.create({
        company_id: createDivisionDto.company_id,
        name: createDivisionDto.name,
        code: createDivisionDto.code || null,
        description: createDivisionDto.description || null,
        is_active: createDivisionDto.is_active ?? true,
        division_admin_user_id: createDivisionDto.division_admin_user_id || null,
        created_by: userId,
        updated_by: userId,
      });

      const savedDivision = await queryRunner.manager.save(Division, division);

      if (!savedDivision) {
        throw new InternalServerErrorException('Failed to create division');
      }

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

    return this.mapToResponseDto(division);
  }

  async findAllByCompany(
    companyId: string,
    query: ListDivisionsQueryDto,
  ): Promise<PaginatedResponseDto<DivisionResponseDto>> {
    // Verify company exists
    const company = await this.companyRepository.findOne({
      where: { id: companyId, deleted_at: IsNull() },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'created_at';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Record<string, unknown> = {
      company_id: companyId,
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

    const [divisions, total] = await this.divisionRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = divisions.map((division) => this.mapToResponseDto(division));
    return new PaginatedResponseDto(data, total, page, limit);
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

      // Get company and company group for authorization check
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: division.company_id },
        relations: ['company_group'],
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
        throw new ForbiddenException('Access denied to update this division');
      }

      const updatableFields: (keyof UpdateDivisionDto)[] = [
        'name',
        'code',
        'description',
        'division_admin_user_id',
        'is_active',
      ];

      const hasUpdates = updatableFields.some(
        (field) => typeof updateDivisionDto[field] !== 'undefined',
      );

      if (!hasUpdates) {
        throw new BadRequestException('No valid fields provided for update');
      }

      // Check for duplicate name if updating name
      if (updateDivisionDto.name !== undefined) {
        const existingDivision = await queryRunner.manager.findOne(Division, {
          where: {
            company_id: division.company_id,
            name: updateDivisionDto.name,
            id: Not(division.id),
            deleted_at: IsNull(),
          },
        });

        if (existingDivision) {
          throw new ConflictException(
            `Division with name "${updateDivisionDto.name}" already exists in this company`,
          );
        }
      }

      // Check for duplicate code if updating code
      if (updateDivisionDto.code !== undefined && updateDivisionDto.code) {
        const existingDivision = await queryRunner.manager.findOne(Division, {
          where: {
            company_id: division.company_id,
            code: updateDivisionDto.code,
            id: Not(division.id),
            deleted_at: IsNull(),
          },
        });

        if (existingDivision) {
          throw new ConflictException(
            `Division with code "${updateDivisionDto.code}" already exists in this company`,
          );
        }
      }

      // Update fields
      if (updateDivisionDto.name !== undefined) {
        division.name = updateDivisionDto.name;
      }

      if (updateDivisionDto.code !== undefined) {
        division.code = updateDivisionDto.code || null;
      }

      if (updateDivisionDto.description !== undefined) {
        division.description = updateDivisionDto.description || null;
      }

      if (updateDivisionDto.division_admin_user_id !== undefined) {
        division.division_admin_user_id = updateDivisionDto.division_admin_user_id || null;
      }

      if (updateDivisionDto.is_active !== undefined) {
        division.is_active = updateDivisionDto.is_active;
      }

      division.updated_by = userId;

      const savedDivision = await queryRunner.manager.save(Division, division);

      if (!savedDivision) {
        throw new InternalServerErrorException('Failed to update division');
      }

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
        throw new ForbiddenException('Access denied to delete this division');
      }

      // Soft delete
      division.deleted_at = new Date();
      division.updated_by = userId;
      division.is_active = false;

      const savedDivision = await queryRunner.manager.save(Division, division);

      if (!savedDivision) {
        throw new InternalServerErrorException('Failed to delete division');
      }

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
      );
      throw new InternalServerErrorException('Failed to delete division');
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponseDto(division: Division): DivisionResponseDto {
    return {
      id: division.id,
      company_id: division.company_id,
      name: division.name,
      code: division.code || undefined,
      description: division.description || undefined,
      is_active: division.is_active,
      division_admin_user_id: division.division_admin_user_id || undefined,
      created_at: division.created_at,
      updated_at: division.updated_at,
    };
  }
}
