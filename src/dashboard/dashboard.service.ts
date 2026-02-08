import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { CompanyGroup } from '../entities/company-group.entity';
import { UserRole } from '../entities/user-role.entity';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';

interface DashboardStatsQueryResult {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  company_group_admin_id: string;
  created_at: Date;
  updated_at: Date;
  users_count: string;
  companies_count: string;
  divisions_count: string;
  departments_count: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly dataSource: DataSource,
  ) {}

  async getDashboardStats(
    userId: string,
    userRoles: string[] = [],
  ): Promise<DashboardStatsResponseDto> {
    try {
      const normalizedRoles = this.normalizeRoles(userRoles);
      const companyGroupId = await this.resolveCompanyGroupId(userId, normalizedRoles);

      if (!companyGroupId) {
        throw new NotFoundException(
          'Company group not found. User does not have access to any company group.',
        );
      }

      const companyGroup = await this.companyGroupRepository.findOne({
        where: { id: companyGroupId, deleted_at: IsNull() },
      });

      if (!companyGroup) {
        throw new NotFoundException(`Company group with ID ${companyGroupId} not found`);
      }

      if (!companyGroup.is_active) {
        throw new ForbiddenException('Company group is not active');
      }

      const statsQuery = `
        WITH company_group_stats AS (
          SELECT
            cg.id,
            cg.name,
            cg.code,
            cg.description,
            cg.is_active,
            cg.company_group_admin_id,
            cg.created_at,
            cg.updated_at,
            (
              SELECT COUNT(DISTINCT ur.user_id)
              FROM user_roles ur
              WHERE ur.company_group_id = cg.id
                AND ur.deleted_at IS NULL
            ) AS users_count,
            (
              SELECT COUNT(*)
              FROM companies c
              WHERE c.company_group_id = cg.id
                AND c.deleted_at IS NULL
            ) AS companies_count,
            (
              SELECT COUNT(*)
              FROM divisions d
              INNER JOIN companies c ON d.company_id = c.id
              WHERE c.company_group_id = cg.id
                AND d.deleted_at IS NULL
                AND c.deleted_at IS NULL
            ) AS divisions_count,
            (
              SELECT COUNT(*)
              FROM departments dept
              INNER JOIN divisions d ON dept.division_id = d.id
              INNER JOIN companies c ON d.company_id = c.id
              WHERE c.company_group_id = cg.id
                AND dept.deleted_at IS NULL
                AND d.deleted_at IS NULL
                AND c.deleted_at IS NULL
            ) AS departments_count
          FROM company_groups cg
          WHERE cg.id = $1
            AND cg.deleted_at IS NULL
        )
        SELECT
          id,
          name,
          code,
          description,
          is_active,
          company_group_admin_id,
          created_at,
          updated_at,
          COALESCE(users_count::text, '0') AS users_count,
          COALESCE(companies_count::text, '0') AS companies_count,
          COALESCE(divisions_count::text, '0') AS divisions_count,
          COALESCE(departments_count::text, '0') AS departments_count
        FROM company_group_stats;
      `;

      const result = await this.dataSource.query<DashboardStatsQueryResult[]>(statsQuery, [
        companyGroupId,
      ]);

      if (!result || result.length === 0) {
        throw new NotFoundException(`Company group with ID ${companyGroupId} not found`);
      }

      const stats = result[0];

      const metadata = companyGroup.metadata || {};
      const response: DashboardStatsResponseDto = {
        id: stats.id,
        name: stats.name,
        code: stats.code,
        description: stats.description,
        is_active: stats.is_active,
        company_group_admin_id: stats.company_group_admin_id,
        created_at: stats.created_at,
        updated_at: stats.updated_at,
        email: typeof metadata.email === 'string' ? metadata.email : undefined,
        phone: typeof metadata.phone === 'string' ? metadata.phone : undefined,
        address: typeof metadata.address === 'string' ? metadata.address : undefined,
        city: typeof metadata.city === 'string' ? metadata.city : undefined,
        state: typeof metadata.state === 'string' ? metadata.state : undefined,
        users_count: parseInt(stats.users_count, 10),
        companies_count: parseInt(stats.companies_count, 10),
        divisions_count: parseInt(stats.divisions_count, 10),
        departments_count: parseInt(stats.departments_count, 10),
        generated_at: new Date(),
      };

      this.logger.log(
        `Dashboard stats retrieved for company group ${companyGroupId} by user ${userId}: ` +
          `Users: ${response.users_count}, Companies: ${response.companies_count}, ` +
          `Divisions: ${response.divisions_count}, Departments: ${response.departments_count}`,
      );

      return response;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Failed to get dashboard stats: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException('Failed to retrieve dashboard statistics');
    }
  }

  private async resolveCompanyGroupId(userId: string, userRoles: string[]): Promise<string | null> {
    const isGroupAdmin = userRoles.includes('GROUP_ADMIN');

    if (isGroupAdmin) {
      const companyGroup = await this.companyGroupRepository.findOne({
        where: { company_group_admin_id: userId, deleted_at: IsNull() },
        select: ['id'],
      });

      return companyGroup?.id || null;
    }

    const userRole = await this.userRoleRepository
      .createQueryBuilder('ur')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.deleted_at IS NULL')
      .andWhere('ur.company_group_id IS NOT NULL')
      .select(['ur.company_group_id'])
      .orderBy('ur.created_at', 'DESC')
      .limit(1)
      .getOne();

    return userRole?.company_group_id || null;
  }

  private normalizeRoles(userRoles: string[] = []): string[] {
    return userRoles
      .filter((role): role is string => typeof role === 'string' && role.length > 0)
      .map((role) => role.toUpperCase().trim());
  }
}
