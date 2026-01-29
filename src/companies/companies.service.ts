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
import { CreateCompanyDto, CompanyResponseDto, CompanyType } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { DeleteCompanyResponseDto } from './dto/delete-company.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string): Promise<CompanyResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify company group exists and user has access
      const companyGroup = await queryRunner.manager.findOne(CompanyGroup, {
        where: { id: createCompanyDto.company_group_id },
      });

      if (!companyGroup) {
        throw new NotFoundException(
          `Company group with ID ${createCompanyDto.company_group_id} not found`,
        );
      }

      // Verify company group is active
      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }

      // Check if company name already exists in the same company group
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

      // Check for duplicate registration number if provided
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

      // Check for duplicate PAN if provided
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

      // Check for duplicate GSTIN if provided
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

      // Create company entity
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
        company_admin_user_id: createCompanyDto.company_admin_user_id || null,
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

  async findAllByGroupAdmin(userId: string): Promise<CompanyResponseDto[]> {
    try {
      // Find the company group where user is the super admin
      const companyGroup = await this.companyGroupRepository.findOne({
        where: { super_admin_id: userId },
      });

      if (!companyGroup) {
        throw new NotFoundException(
          'Company group not found. User is not a super admin of any company group.',
        );
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }

      const companies = await this.companyRepository.find({
        where: {
          company_group_id: companyGroup.id,
          deleted_at: IsNull(),
        },
        order: {
          created_at: 'DESC',
        },
      });

      this.logger.log(
        `Found ${companies.length} companies for group admin ${userId} in company group ${companyGroup.id}`,
      );

      return companies.map((company) => this.mapToResponseDto(company, companyGroup));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Failed to get companies for group admin: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve companies');
    }
  }

  async findOneByGroupAdmin(companyId: string, userId: string): Promise<CompanyResponseDto> {
    try {
      // Find the company group where user is the super admin
      const companyGroup = await this.companyGroupRepository.findOne({
        where: { super_admin_id: userId },
      });

      if (!companyGroup) {
        throw new NotFoundException(
          'Company group not found. User is not a super admin of any company group.',
        );
      }

      // Verify company group is active
      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }

      // Find the company by ID
      const company = await this.companyRepository.findOne({
        where: {
          id: companyId,
          company_group_id: companyGroup.id,
          deleted_at: IsNull(),
        },
      });

      if (!company) {
        throw new NotFoundException(
          `Company with ID ${companyId} not found or does not belong to your company group`,
        );
      }

      this.logger.log(
        `Company ${companyId} retrieved successfully by group admin ${userId} from company group ${companyGroup.id}`,
      );

      return this.mapToResponseDto(company, companyGroup);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Failed to get company ${companyId} for group admin: ${error instanceof Error ? error.message : String(error)}`,
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

      if (!isGroupAdmin && company.company_admin_user_id !== userId) {
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
        'company_admin_user_id',
        'is_active',
      ];

      const hasUpdates = updatableFields.some(
        (field) => typeof updateCompanyDto[field] !== 'undefined',
      );

      if (!hasUpdates) {
        throw new BadRequestException('No valid fields provided for update');
      }

      if (updateCompanyDto.name !== undefined) {
        const existingCompany = await queryRunner.manager.findOne(Company, {
          where: {
            company_group_id: company.company_group_id,
            name: updateCompanyDto.name,
            id: Not(company.id),
          },
        });

        if (existingCompany) {
          throw new ConflictException(
            `Company with name "${updateCompanyDto.name}" already exists in this company group`,
          );
        }
      }

      if (updateCompanyDto.registration_number) {
        const existingByRegistration = await queryRunner.manager.findOne(Company, {
          where: {
            registration_number: updateCompanyDto.registration_number,
            id: Not(company.id),
          },
        });

        if (existingByRegistration) {
          throw new ConflictException(
            `Company with registration number "${updateCompanyDto.registration_number}" already exists`,
          );
        }
      }

      if (updateCompanyDto.pan) {
        const normalizedPan = updateCompanyDto.pan.toUpperCase();
        const existingByPan = await queryRunner.manager.findOne(Company, {
          where: {
            pan: normalizedPan,
            id: Not(company.id),
          },
        });

        if (existingByPan) {
          throw new ConflictException(`Company with PAN "${updateCompanyDto.pan}" already exists`);
        }
      }

      if (updateCompanyDto.gstin) {
        const normalizedGstin = updateCompanyDto.gstin.toUpperCase();
        const existingByGstin = await queryRunner.manager.findOne(Company, {
          where: {
            gstin: normalizedGstin,
            id: Not(company.id),
          },
        });

        if (existingByGstin) {
          throw new ConflictException(
            `Company with GSTIN "${updateCompanyDto.gstin}" already exists`,
          );
        }
      }

      if (updateCompanyDto.name !== undefined) {
        company.name = updateCompanyDto.name;
      }

      if (updateCompanyDto.legal_name !== undefined) {
        company.legal_name = updateCompanyDto.legal_name || null;
      }

      if (updateCompanyDto.company_type !== undefined) {
        company.company_type = updateCompanyDto.company_type || null;
      }

      if (updateCompanyDto.registration_number !== undefined) {
        company.registration_number = updateCompanyDto.registration_number || null;
      }

      if (updateCompanyDto.pan !== undefined) {
        company.pan = updateCompanyDto.pan ? updateCompanyDto.pan.toUpperCase() : null;
      }

      if (updateCompanyDto.gstin !== undefined) {
        company.gstin = updateCompanyDto.gstin ? updateCompanyDto.gstin.toUpperCase() : null;
      }

      if (updateCompanyDto.email !== undefined) {
        company.email = updateCompanyDto.email || null;
      }

      if (updateCompanyDto.website !== undefined) {
        company.website = updateCompanyDto.website || null;
      }

      if (updateCompanyDto.phone !== undefined) {
        company.phone = updateCompanyDto.phone || null;
      }

      if (updateCompanyDto.address_line1 !== undefined) {
        company.address_line1 = updateCompanyDto.address_line1 || null;
      }

      if (updateCompanyDto.address_line2 !== undefined) {
        company.address_line2 = updateCompanyDto.address_line2 || null;
      }

      if (updateCompanyDto.city !== undefined) {
        company.city = updateCompanyDto.city || null;
      }

      if (updateCompanyDto.state !== undefined) {
        company.state = updateCompanyDto.state || null;
      }

      if (updateCompanyDto.country !== undefined) {
        company.country = updateCompanyDto.country || null;
      }

      if (updateCompanyDto.pincode !== undefined) {
        company.pincode = updateCompanyDto.pincode || null;
      }

      if (updateCompanyDto.company_admin_user_id !== undefined) {
        company.company_admin_user_id = updateCompanyDto.company_admin_user_id || null;
      }

      if (updateCompanyDto.is_active !== undefined) {
        company.is_active = updateCompanyDto.is_active;
      }

      company.updated_by = userId;

      const savedCompany = await queryRunner.manager.save(Company, company);

      if (!savedCompany) {
        throw new InternalServerErrorException('Failed to update company');
      }

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

  async remove(
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

      if (!isGroupAdmin && company.company_admin_user_id !== userId) {
        throw new ForbiddenException('Access denied to delete this company');
      }

      company.deleted_at = new Date();
      company.updated_by = userId;
      company.is_active = false;

      const savedCompany = await queryRunner.manager.save(Company, company);

      if (!savedCompany) {
        throw new InternalServerErrorException('Failed to delete company');
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Company "${savedCompany.name}" deleted successfully by user ${userId}`);

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
        `Failed to delete company: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to delete company');
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponseDto(company: Company, companyGroup: CompanyGroup): CompanyResponseDto {
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
      company_admin_user_id: company.company_admin_user_id || undefined,
      created_at: company.created_at,
      updated_at: company.updated_at,
    };
  }
}
