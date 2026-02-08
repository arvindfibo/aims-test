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
import { Company } from '../entities/company.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Division } from '../entities/division.entity';
import { Department } from '../entities/department.entity';
import { CreateCompanyDto, CompanyResponseDto, CompanyType } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { DeleteCompanyResponseDto } from './dto/delete-company.dto';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto';
import { PaginatedCompaniesResponseDto } from './dto/paginated-companies-response.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string): Promise<CompanyResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const companyGroup = await queryRunner.manager.findOne(CompanyGroup, {
        where: { id: createCompanyDto.company_group_id },
      });

      if (!companyGroup) {
        throw new NotFoundException(
          `Company group with ID ${createCompanyDto.company_group_id} not found`,
        );
      }
      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }
      const existingCompany = await queryRunner.manager.findOne(Company, {
        where: {
          company_group_id: createCompanyDto.company_group_id,
          name: createCompanyDto.name,
        },
      });

      if (existingCompany) {
        throw new ConflictException(
          `Company with name "${createCompanyDto.name}" already exists in this company group`,
        );
      }
      if (createCompanyDto.registration_number) {
        const existingByRegistration = await queryRunner.manager.findOne(Company, {
          where: {
            registration_number: createCompanyDto.registration_number,
          },
        });

        if (existingByRegistration) {
          throw new ConflictException(
            `Company with registration number "${createCompanyDto.registration_number}" already exists`,
          );
        }
      }
      if (createCompanyDto.pan) {
        const existingByPan = await queryRunner.manager.findOne(Company, {
          where: {
            pan: createCompanyDto.pan.toUpperCase(),
          },
        });

        if (existingByPan) {
          throw new ConflictException(`Company with PAN "${createCompanyDto.pan}" already exists`);
        }
      }
      if (createCompanyDto.gstin) {
        const existingByGstin = await queryRunner.manager.findOne(Company, {
          where: {
            gstin: createCompanyDto.gstin.toUpperCase(),
          },
        });

        if (existingByGstin) {
          throw new ConflictException(
            `Company with GSTIN "${createCompanyDto.gstin}" already exists`,
          );
        }
      }
      const company = this.companyRepository.create({
        company_group_id: createCompanyDto.company_group_id,
        name: createCompanyDto.name,
        legal_name: createCompanyDto.legal_name || null,
        company_type: createCompanyDto.company_type || null,
        registration_number: createCompanyDto.registration_number || null,
        pan: createCompanyDto.pan ? createCompanyDto.pan.toUpperCase() : null,
        gstin: createCompanyDto.gstin ? createCompanyDto.gstin.toUpperCase() : null,
        email: createCompanyDto.email || null,
        website: createCompanyDto.website || null,
        phone: createCompanyDto.phone || null,
        address_line1: createCompanyDto.address_line1 || null,
        address_line2: createCompanyDto.address_line2 || null,
        city: createCompanyDto.city || null,
        state: createCompanyDto.state || null,
        country: createCompanyDto.country || null,
        pincode: createCompanyDto.pincode || null,
        is_active: createCompanyDto.is_active ?? true,
        is_verified: false,
        company_admin_id: createCompanyDto.company_admin_id || null,
        created_by: userId,
        updated_by: userId,
      });

      const savedCompany = await queryRunner.manager.save(Company, company);

      if (!savedCompany) {
        throw new InternalServerErrorException('Failed to create company');
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Company "${savedCompany.name}" created successfully by user ${userId} in company group ${createCompanyDto.company_group_id}`,
      );

      return this.mapToResponseDto(savedCompany, companyGroup);
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
        `Failed to create company: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to create company');
    } finally {
      await queryRunner.release();
    }
  }

  async findAllCompaniesByCompanyGroupId(
    companyGroupId: string,
    filters: GetCompaniesQueryDto = {} as GetCompaniesQueryDto,
  ): Promise<PaginatedCompaniesResponseDto> {
    try {
      const companyGroup = await this.companyGroupRepository.findOne({
        where: { id: companyGroupId },
      });

      if (!companyGroup) {
        throw new NotFoundException('Company group not found');
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }
      const {
        name,
        legal_name,
        registration_number,
        is_active,
        is_verified,
        sort_by,
        sort_order,
        offset,
        limit,
      } = filters;

      const qb = this.companyRepository.createQueryBuilder('company');
      qb.where('company.company_group_id = :companyGroupId', { companyGroupId });
      qb.andWhere('company.deleted_at IS NULL');
      if (name) {
        qb.andWhere('company.name = :name', { name });
      }
      if (legal_name) {
        qb.andWhere('company.legal_name = :legal_name', { legal_name });
      }
      if (registration_number) {
        qb.andWhere('company.registration_number = :registration_number', {
          registration_number,
        });
      }
      if (typeof is_active === 'boolean') {
        qb.andWhere('company.is_active = :is_active', { is_active });
      }
      if (typeof is_verified === 'boolean') {
        qb.andWhere('company.is_verified = :is_verified', { is_verified });
      }
      const sortFieldMap: Record<string, string> = {
        name: 'company.name',
        legal_name: 'company.legal_name',
        registration_number: 'company.registration_number',
        is_active: 'company.is_active',
        is_verified: 'company.is_verified',
        created_at: 'company.created_at',
        updated_at: 'company.updated_at',
      };
      const total = await qb.getCount();
      const sortBy =
        sort_by && sortFieldMap[sort_by] ? sortFieldMap[sort_by] : 'company.created_at';
      const sortOrder = sort_order === 'ASC' ? 'ASC' : 'DESC';
      qb.orderBy(sortBy, sortOrder);
      const safeLimit = Math.min(Math.max(limit ?? 10, 1), 100);
      const safeOffset = Math.max(offset ?? 0, 0);
      qb.skip(safeOffset).take(safeLimit);
      const companies = await qb.getMany();
      const hasMore = safeOffset + companies.length < total;
      this.logger.log(
        `Found ${companies.length} companies (offset: ${safeOffset}, limit: ${safeLimit}, total: ${total}, sortBy: ${sortBy}, sortOrder: ${sortOrder}) for company group ${companyGroupId}`,
      );
      return {
        data: companies.map((company) => this.mapToResponseDto(company, companyGroup)),
        pagination: {
          total,
          offset: safeOffset,
          limit: safeLimit,
          hasMore,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        `Failed to get companies for company group: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve companies');
    }
  }

  async findCompanyByCompanyId(companyId: string): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({
        where: {
          id: companyId,
          deleted_at: IsNull(),
        },
        relations: ['company_group'],
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      if (!company.company_group) {
        throw new NotFoundException(`Company group not found for company ${companyId}`);
      }

      const [usersCount, divisionsCount, departmentsCount] = await Promise.all([
        this.userRoleRepository
          .createQueryBuilder('ur')
          .select('COUNT(DISTINCT ur.user_id)', 'count')
          .where('ur.company_id = :companyId', { companyId })
          .andWhere('ur.deleted_at IS NULL')
          .getRawOne()
          .then((result: { count: string } | undefined) => parseInt(result?.count || '0', 10)),
        this.divisionRepository
          .createQueryBuilder('d')
          .where('d.company_id = :companyId', { companyId })
          .andWhere('d.deleted_at IS NULL')
          .getCount(),
        this.departmentRepository
          .createQueryBuilder('dept')
          .innerJoin('dept.division', 'd')
          .where('d.company_id = :companyId', { companyId })
          .andWhere('dept.deleted_at IS NULL')
          .andWhere('d.deleted_at IS NULL')
          .getCount(),
      ]);

      this.logger.log(`Company ${companyId} retrieved successfully`);

      return this.mapToResponseDto(
        company,
        company.company_group,
        usersCount,
        divisionsCount,
        departmentsCount,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to get company ${companyId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve company');
    }
  }

  async update(
    companyId: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<CompanyResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: companyId, deleted_at: IsNull() },
        relations: ['company_group'],
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      const companyGroup =
        company.company_group ||
        (await queryRunner.manager.findOne(CompanyGroup, {
          where: { id: company.company_group_id },
        }));

      if (!companyGroup) {
        throw new NotFoundException(`Company group with ID ${company.company_group_id} not found`);
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');

      if (!isGroupAdmin && company.company_admin_id !== userId) {
        throw new ForbiddenException('Access denied to update this company');
      }
      const updatableFields: (keyof UpdateCompanyDto)[] = [
        'name',
        'legal_name',
        'company_type',
        'registration_number',
        'pan',
        'gstin',
        'email',
        'website',
        'phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'country',
        'pincode',
        'company_admin_id',
        'is_active',
      ];

      const hasUpdates = updatableFields.some(
        (field) => typeof updateCompanyDto[field] !== 'undefined',
      );

      if (!hasUpdates) {
        throw new BadRequestException('No valid fields provided for update');
      }
      const normalizedPan = updateCompanyDto.pan?.toUpperCase();
      const normalizedGstin = updateCompanyDto.gstin?.toUpperCase();

      const uniquenessChecks = await Promise.all([
        updateCompanyDto.name !== undefined && updateCompanyDto.name !== company.name
          ? queryRunner.manager.findOne(Company, {
              where: {
                company_group_id: company.company_group_id,
                name: updateCompanyDto.name,
                id: Not(company.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
        updateCompanyDto.registration_number &&
        updateCompanyDto.registration_number !== company.registration_number
          ? queryRunner.manager.findOne(Company, {
              where: {
                registration_number: updateCompanyDto.registration_number,
                id: Not(company.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
        normalizedPan && normalizedPan !== company.pan
          ? queryRunner.manager.findOne(Company, {
              where: {
                pan: normalizedPan,
                id: Not(company.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
        normalizedGstin && normalizedGstin !== company.gstin
          ? queryRunner.manager.findOne(Company, {
              where: {
                gstin: normalizedGstin,
                id: Not(company.id),
                deleted_at: IsNull(),
              },
            })
          : Promise.resolve(null),
      ]);

      const [existingByName, existingByRegistration, existingByPan, existingByGstin] =
        uniquenessChecks;

      if (existingByName) {
        throw new ConflictException(
          `Company with name "${updateCompanyDto.name}" already exists in this company group`,
        );
      }

      if (existingByRegistration) {
        throw new ConflictException(
          `Company with registration number "${updateCompanyDto.registration_number}" already exists`,
        );
      }

      if (existingByPan) {
        throw new ConflictException(`Company with PAN "${updateCompanyDto.pan}" already exists`);
      }

      if (existingByGstin) {
        throw new ConflictException(
          `Company with GSTIN "${updateCompanyDto.gstin}" already exists`,
        );
      }
      if (updateCompanyDto.company_admin_id !== undefined) {
        const companyAdminId = updateCompanyDto.company_admin_id || null;
        if (companyAdminId) {
          const adminUser = await queryRunner.manager.findOne(User, {
            where: { id: companyAdminId, deleted_at: IsNull() },
          });

          if (!adminUser) {
            throw new NotFoundException(
              `User with ID ${companyAdminId} not found or has been deleted`,
            );
          }
        }
      }
      const updateFields: Partial<Company> = {};

      const setNullableField = <K extends keyof UpdateCompanyDto>(
        dtoKey: K,
        entityKey: keyof Company,
        value?: string | null,
      ) => {
        if (updateCompanyDto[dtoKey] !== undefined) {
          (updateFields as Record<string, unknown>)[entityKey] = value ?? null;
        }
      };
      if (updateCompanyDto.name !== undefined) {
        updateFields.name = updateCompanyDto.name;
      }
      if (updateCompanyDto.is_active !== undefined) {
        updateFields.is_active = updateCompanyDto.is_active;
      }
      setNullableField('legal_name', 'legal_name', updateCompanyDto.legal_name);
      setNullableField('company_type', 'company_type', updateCompanyDto.company_type);
      setNullableField(
        'registration_number',
        'registration_number',
        updateCompanyDto.registration_number,
      );
      setNullableField('email', 'email', updateCompanyDto.email);
      setNullableField('website', 'website', updateCompanyDto.website);
      setNullableField('phone', 'phone', updateCompanyDto.phone);
      setNullableField('address_line1', 'address_line1', updateCompanyDto.address_line1);
      setNullableField('address_line2', 'address_line2', updateCompanyDto.address_line2);
      setNullableField('city', 'city', updateCompanyDto.city);
      setNullableField('state', 'state', updateCompanyDto.state);
      setNullableField('country', 'country', updateCompanyDto.country);
      setNullableField('pincode', 'pincode', updateCompanyDto.pincode);
      if (updateCompanyDto.pan !== undefined) {
        updateFields.pan = normalizedPan || null;
      }
      if (updateCompanyDto.gstin !== undefined) {
        updateFields.gstin = normalizedGstin || null;
      }
      if (updateCompanyDto.company_admin_id !== undefined) {
        updateFields.company_admin_id = updateCompanyDto.company_admin_id || null;
      }

      Object.assign(company, updateFields);
      company.updated_by = userId;

      const savedCompany = await queryRunner.manager.save(Company, company);
      await queryRunner.commitTransaction();

      this.logger.log(`Company "${savedCompany.name}" updated successfully by user ${userId}`);

      return this.mapToResponseDto(savedCompany, companyGroup);
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
        `Failed to update company: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to update company');
    } finally {
      await queryRunner.release();
    }
  }

  async delete(
    companyId: string,
    userId: string,
    userRoles: string[] = [],
  ): Promise<DeleteCompanyResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: companyId, deleted_at: IsNull() },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }
      const companyGroup = await queryRunner.manager.findOne(CompanyGroup, {
        where: { id: company.company_group_id },
      });

      if (!companyGroup) {
        throw new NotFoundException(`Company group with ID ${company.company_group_id} not found`);
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');

      if (!isGroupAdmin && company.company_admin_id !== userId) {
        throw new ForbiddenException('Access denied to delete this company');
      }
      company.deleted_at = new Date();
      company.updated_by = userId;
      company.is_active = false;

      const savedCompany = await queryRunner.manager.save(Company, company);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Company "${savedCompany.name}" (ID: ${savedCompany.id}) soft deleted successfully by user ${userId}`,
      );

      return {
        id: savedCompany.id,
        message: 'Company deleted successfully',
        deleted_at: savedCompany.deleted_at as Date,
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
        `Failed to soft delete company: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to delete company');
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponseDto(
    company: Company,
    companyGroup: CompanyGroup,
    usersCount: number = 0,
    divisionsCount: number = 0,
    departmentsCount: number = 0,
  ): CompanyResponseDto {
    return {
      id: company.id,
      company_group_id: company.company_group_id,
      company_group: {
        id: companyGroup.id,
        name: companyGroup.name,
        code: companyGroup.code || undefined,
        description: companyGroup.description || undefined,
        is_active: companyGroup.is_active,
        created_at: companyGroup.created_at,
        updated_at: companyGroup.updated_at,
      },
      name: company.name,
      legal_name: company.legal_name || undefined,
      company_type: company.company_type as CompanyType | undefined,
      registration_number: company.registration_number || undefined,
      pan: company.pan || undefined,
      gstin: company.gstin || undefined,
      email: company.email || undefined,
      website: company.website || undefined,
      phone: company.phone || undefined,
      address_line1: company.address_line1 || undefined,
      address_line2: company.address_line2 || undefined,
      city: company.city || undefined,
      state: company.state || undefined,
      country: company.country || undefined,
      pincode: company.pincode || undefined,
      is_active: company.is_active,
      is_verified: company.is_verified,
      company_admin_id: company.company_admin_id || undefined,
      created_at: company.created_at,
      updated_at: company.updated_at,
      users_count: usersCount,
      divisions_count: divisionsCount,
      departments_count: departmentsCount,
    };
  }
}
