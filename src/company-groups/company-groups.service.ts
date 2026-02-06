import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { CompanyGroup } from '../entities/company-group.entity';
import { Company } from '../entities/company.entity';
import { Division } from '../entities/division.entity';
import { Department } from '../entities/department.entity';
import { UserRole } from '../entities/user-role.entity';
import { UserInvite } from '../entities/user-invite.entity';
import { CompanyGroupResponseDto } from './dto/company-group-response.dto';
import { GetCompanyGroupUsersQueryDto } from './dto/get-company-group-users-query.dto';
import {
  CompanyGroupUserRowDto,
  PaginatedCompanyGroupUsersResponseDto,
} from './dto/company-group-users-response.dto';

@Injectable()
export class CompanyGroupsService {
  private readonly logger = new Logger(CompanyGroupsService.name);

  constructor(
    @InjectRepository(CompanyGroup)
    private readonly companyGroupRepository: Repository<CompanyGroup>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserInvite)
    private readonly userInviteRepository: Repository<UserInvite>,
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
          company_group_admin_id: superAdminId,
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
   * Get users across companies with scoped access based on highest admin role.
   */
  async getCompanyGroupUsers(
    userId: string,
    userRoles: string[] = [],
    filters: GetCompanyGroupUsersQueryDto = {} as GetCompanyGroupUsersQueryDto,
  ): Promise<PaginatedCompanyGroupUsersResponseDto> {
    try {
      const normalizedRoles = this.normalizeRoles(userRoles);
      const highestRole = this.getHighestRole(normalizedRoles);

      if (!highestRole) {
        throw new ForbiddenException(
          'Only GROUP_ADMIN, COMPANY_ADMIN, DIVISION_ADMIN, or DEPARTMENT_ADMIN can view users',
        );
      }

      const safeLimit = Math.min(Math.max(filters.limit ?? 10, 1), 100);
      const safeOffset = Math.max(filters.offset ?? 0, 0);

      let companyIds: string[] = [];
      let divisionIds: string[] = [];
      let departmentIds: string[] = [];

      if (highestRole === 'GROUP_ADMIN') {
        const companyGroup = await this.companyGroupRepository.findOne({
          where: { company_group_admin_id: userId, deleted_at: IsNull() },
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
          select: ['id'],
          where: { company_group_id: companyGroup.id, deleted_at: IsNull() },
        });

        companyIds = companies.map((company) => company.id);
      } else if (highestRole === 'COMPANY_ADMIN') {
        companyIds = await this.getScopedCompanyIds(userId, 'COMPANY_ADMIN');
      } else if (highestRole === 'DIVISION_ADMIN') {
        divisionIds = await this.getScopedDivisionIds(userId, 'DIVISION_ADMIN');
      } else if (highestRole === 'DEPARTMENT_ADMIN') {
        departmentIds = await this.getScopedDepartmentIds(userId, 'DEPARTMENT_ADMIN');
      }

      if (
        (highestRole === 'GROUP_ADMIN' && companyIds.length === 0) ||
        (highestRole === 'COMPANY_ADMIN' && companyIds.length === 0) ||
        (highestRole === 'DIVISION_ADMIN' && divisionIds.length === 0) ||
        (highestRole === 'DEPARTMENT_ADMIN' && departmentIds.length === 0)
      ) {
        return {
          data: [],
          pagination: {
            total: 0,
            offset: safeOffset,
            limit: safeLimit,
            hasMore: false,
          },
        };
      }

      const qb = this.userRoleRepository.createQueryBuilder('ur');
      qb.innerJoin('ur.user', 'user');
      qb.innerJoin('ur.role', 'role');
      qb.leftJoin(Company, 'company', 'company.id = ur.company_id');
      qb.leftJoin(Division, 'division', 'division.id = ur.division_id');
      qb.leftJoin(Department, 'department', 'department.id = ur.department_id');

      qb.where('ur.deleted_at IS NULL');
      qb.andWhere('user.deleted_at IS NULL');
      qb.andWhere('company.deleted_at IS NULL');
      qb.andWhere('division.deleted_at IS NULL');
      qb.andWhere('department.deleted_at IS NULL');

      if (companyIds.length > 0) {
        qb.andWhere('ur.company_id IN (:...companyIds)', { companyIds });
      }

      if (divisionIds.length > 0) {
        qb.andWhere('ur.division_id IN (:...divisionIds)', { divisionIds });
      }

      if (departmentIds.length > 0) {
        qb.andWhere('ur.department_id IN (:...departmentIds)', { departmentIds });
      }

      if (filters.company_id) {
        qb.andWhere('ur.company_id = :company_id', { company_id: filters.company_id });
      }

      if (filters.division_id) {
        qb.andWhere('ur.division_id = :division_id', { division_id: filters.division_id });
      }

      if (filters.department_id) {
        qb.andWhere('ur.department_id = :department_id', { department_id: filters.department_id });
      }

      if (filters.email) {
        qb.andWhere('user.email = :email', { email: filters.email });
      }

      if (filters.first_name) {
        qb.andWhere('user.first_name = :first_name', { first_name: filters.first_name });
      }

      if (filters.last_name) {
        qb.andWhere('user.last_name = :last_name', { last_name: filters.last_name });
      }

      if (typeof filters.is_active === 'boolean') {
        qb.andWhere('user.is_active = :is_active', { is_active: filters.is_active });
      }

      if (typeof filters.is_verified === 'boolean') {
        qb.andWhere('user.is_verified = :is_verified', { is_verified: filters.is_verified });
      }

      const sortFieldMap: Record<string, string> = {
        created_at: 'ur.created_at',
        updated_at: 'ur.updated_at',
        email: 'user.email',
        first_name: 'user.first_name',
        last_name: 'user.last_name',
        company_name: 'company.name',
        division_name: 'division.name',
        department_name: 'department.name',
        role_name: 'role.name',
      };

      const total = await qb.getCount();

      const sortBy =
        filters.sort_by && sortFieldMap[filters.sort_by]
          ? sortFieldMap[filters.sort_by]
          : 'ur.created_at';
      const sortOrder = filters.sort_order === 'ASC' ? 'ASC' : 'DESC';
      qb.orderBy(sortBy, sortOrder);

      qb.skip(safeOffset).take(safeLimit);

      qb.select('ur.user_id', 'user_id')
        .addSelect('ur.company_id', 'company_id')
        .addSelect('ur.division_id', 'division_id')
        .addSelect('ur.department_id', 'department_id')
        .addSelect('ur.created_at', 'created_at')
        .addSelect('ur.updated_at', 'updated_at')
        .addSelect('user.email', 'email')
        .addSelect('user.first_name', 'first_name')
        .addSelect('user.last_name', 'last_name')
        .addSelect('user.phone', 'phone')
        .addSelect('user.is_active', 'is_active')
        .addSelect('user.is_verified', 'is_verified')
        .addSelect('role.id', 'role_id')
        .addSelect('role.name', 'role_name')
        .addSelect('company.name', 'company_name')
        .addSelect('division.name', 'division_name')
        .addSelect('department.name', 'department_name');

      const rows = await qb.getRawMany<{
        user_id: string;
        company_id: string | null;
        division_id: string | null;
        department_id: string | null;
        created_at: Date;
        updated_at: Date;
        email: string;
        first_name: string;
        last_name: string | null;
        phone: string | null;
        is_active: boolean;
        is_verified: boolean;
        role_id: string;
        role_name: string;
        company_name: string | null;
        division_name: string | null;
        department_name: string | null;
      }>();

      const userEmails = [...new Set(rows.map((row) => row.email))];
      const rowCompanyIds = [
        ...new Set(rows.map((row) => row.company_id).filter((id): id is string => !!id)),
      ];

      const invites =
        userEmails.length > 0 && rowCompanyIds.length > 0
          ? await this.userInviteRepository.find({
              where: {
                company_id: In(rowCompanyIds),
                email: In(userEmails),
                deleted_at: IsNull(),
              },
              order: {
                created_at: 'DESC',
              },
            })
          : [];

      const inviteMap = new Map<string, UserInvite>();
      for (const invite of invites) {
        const key = `${invite.company_id}:${invite.email}`;
        if (!inviteMap.has(key)) {
          inviteMap.set(key, invite);
        }
      }

      const now = new Date();
      const data: CompanyGroupUserRowDto[] = rows.map((row) => {
        const key = row.company_id ? `${row.company_id}:${row.email}` : '';
        const invite = key ? inviteMap.get(key) : undefined;

        let invitationStatus: 'pending' | 'accepted' | 'rejected' | 'expired' | 'none' = 'none';
        let invitationExpiresAt: Date | null = null;

        if (invite) {
          if (invite.invite_status === 'accepted') {
            invitationStatus = 'accepted';
          } else if (invite.invite_status === 'rejected') {
            invitationStatus = 'rejected';
          } else if (invite.invite_status === 'expired') {
            invitationStatus = 'expired';
          } else if (invite.invite_status === 'pending') {
            if (invite.expires_at && invite.expires_at < now) {
              invitationStatus = 'expired';
            } else {
              invitationStatus = 'pending';
            }
          }
          invitationExpiresAt = invite.expires_at;
        }

        return {
          user_id: row.user_id,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name ?? null,
          phone: row.phone ?? null,
          is_active: row.is_active,
          is_verified: row.is_verified,
          role_id: row.role_id,
          role_name: row.role_name,
          company_id: row.company_id ?? null,
          company_name: row.company_name ?? null,
          division_id: row.division_id ?? null,
          division_name: row.division_name ?? null,
          department_id: row.department_id ?? null,
          department_name: row.department_name ?? null,
          invitation_status: invitationStatus,
          invitation_expires_at: invitationExpiresAt,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });

      const hasMore = safeOffset + data.length < total;

      this.logger.log(
        `Retrieved ${data.length} users (offset: ${safeOffset}, limit: ${safeLimit}, total: ${total}, sortBy: ${sortBy}, sortOrder: ${sortOrder}) for role ${highestRole}`,
      );

      return {
        data,
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
        `Failed to get scoped users: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve users');
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
      company_group_admin_id: companyGroup.company_group_admin_id,
      created_at: companyGroup.created_at,
      updated_at: companyGroup.updated_at,
    };
  }

  private normalizeRoles(userRoles: string[] = []): string[] {
    return Array.isArray(userRoles) ? userRoles : [];
  }

  private getHighestRole(
    userRoles: string[],
  ): 'GROUP_ADMIN' | 'COMPANY_ADMIN' | 'DIVISION_ADMIN' | 'DEPARTMENT_ADMIN' | null {
    const rolePriority = ['GROUP_ADMIN', 'COMPANY_ADMIN', 'DIVISION_ADMIN', 'DEPARTMENT_ADMIN'];
    return (
      (rolePriority.find((role) => userRoles.includes(role)) as
        | 'GROUP_ADMIN'
        | 'COMPANY_ADMIN'
        | 'DIVISION_ADMIN'
        | 'DEPARTMENT_ADMIN'
        | undefined) ?? null
    );
  }

  private async getScopedCompanyIds(userId: string, roleName: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'role')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.deleted_at IS NULL')
      .andWhere('role.name = :roleName', { roleName })
      .getMany();

    return [...new Set(userRoles.map((ur) => ur.company_id).filter((id): id is string => !!id))];
  }

  private async getScopedDivisionIds(userId: string, roleName: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'role')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.deleted_at IS NULL')
      .andWhere('role.name = :roleName', { roleName })
      .getMany();

    return [...new Set(userRoles.map((ur) => ur.division_id).filter((id): id is string => !!id))];
  }

  private async getScopedDepartmentIds(userId: string, roleName: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'role')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.deleted_at IS NULL')
      .andWhere('role.name = :roleName', { roleName })
      .getMany();

    return [...new Set(userRoles.map((ur) => ur.department_id).filter((id): id is string => !!id))];
  }
}
