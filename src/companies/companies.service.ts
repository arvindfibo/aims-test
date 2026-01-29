import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Company } from '../entities/company.entity';
import { CompanyGroup } from '../entities/company-group.entity';
import { CreateCompanyDto, CompanyResponseDto, CompanyType } from './dto/create-company.dto';

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
