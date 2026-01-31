import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CompanyGroup } from '../entities/company-group.entity';
import { CompanyGroupResponseDto } from './dto/company-group-response.dto';

@Injectable()
export class CompanyGroupsService {
  private readonly logger = new Logger(CompanyGroupsService.name);

  constructor(
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
  ) {}

  /**
   * Get all company groups for a super admin
   * @param superAdminId - Super admin user ID from JWT token
   * @returns Array of company groups where user is super admin
   */
  async findAllBySuperAdmin(superAdminId: string): Promise<CompanyGroupResponseDto[]> {
    try {
      const companyGroups = await this.companyGroupRepository.find({
        where: {
          super_admin_id: superAdminId,
          deleted_at: IsNull(),
        },
        order: {
          created_at: 'DESC',
        },
      });

      this.logger.log(
        `Found ${companyGroups.length} company group(s) for super admin ${superAdminId}`,
      );

      return companyGroups.map((group) => this.mapToResponseDto(group));
    } catch (error) {
      this.logger.error(
        `Failed to get company groups for super admin ${superAdminId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve company groups');
    }
  }

  /**
   * Map CompanyGroup entity to CompanyGroupResponseDto
   * @param companyGroup - CompanyGroup entity
   * @returns CompanyGroupResponseDto
   */
  private mapToResponseDto(companyGroup: CompanyGroup): CompanyGroupResponseDto {
    return {
      id: companyGroup.id,
      name: companyGroup.name,
      code: companyGroup.code || null,
      description: companyGroup.description || null,
      is_active: companyGroup.is_active,
      super_admin_id: companyGroup.super_admin_id,
      created_at: companyGroup.created_at,
      updated_at: companyGroup.updated_at,
    };
  }
}
