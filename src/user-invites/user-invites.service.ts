import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, In, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserInvite } from '../entities/user-invite.entity';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { Division } from '../entities/division.entity';
import { Department } from '../entities/department.entity';
import { InviteUserDto, InviteUserResponseDto } from './dto/invite-user.dto';
import {
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  RejectInvitationDto,
  RejectInvitationResponseDto,
} from './dto/accept-reject-invitation.dto';
import { CompanyUsersResponseDto, CompanyUserDto } from './dto/company-users-response.dto';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserInvitesService {
  private readonly logger = new Logger(UserInvitesService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly INVITE_EXPIRY_DAYS = 7;

  constructor(
    @InjectRepository(UserInvite)
    private readonly userInviteRepository: Repository<UserInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async inviteUser(
    inviteUserDto: InviteUserDto,
    userId: string,
    userRoles: string[] = [],
  ): Promise<InviteUserResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const resourceIds = [
        inviteUserDto.company_id,
        inviteUserDto.division_id,
        inviteUserDto.department_id,
      ].filter((id) => id !== undefined && id !== null);

      if (resourceIds.length !== 1) {
        throw new BadRequestException(
          'Exactly one of company_id, division_id, or department_id must be provided',
        );
      }
      const isCompanyInvite = !!inviteUserDto.company_id;
      const isDivisionInvite = !!inviteUserDto.division_id;
      const isDepartmentInvite = !!inviteUserDto.department_id;

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');
      const isCompanyAdmin = normalizedRoles.includes('COMPANY_ADMIN');
      const isDivisionAdmin = normalizedRoles.includes('DIVISION_ADMIN');
      const isDepartmentAdmin = normalizedRoles.includes('DEPARTMENT_ADMIN');

      let company: Company | null = null;
      let division: Division | null = null;
      let department: Department | null = null;
      let resourceName = '';
      if (isCompanyInvite) {
        if (!isGroupAdmin && !isCompanyAdmin) {
          throw new ForbiddenException(
            'Only GROUP_ADMIN or COMPANY_ADMIN can send company invitations',
          );
        }

        company = await queryRunner.manager.findOne(Company, {
          where: { id: inviteUserDto.company_id, deleted_at: IsNull() },
        });

        if (!company) {
          throw new NotFoundException(`Company with ID ${inviteUserDto.company_id} not found`);
        }

        if (!company.is_active) {
          throw new ForbiddenException('Company is not active');
        }

        if (isCompanyAdmin && !isGroupAdmin) {
          if (company.company_admin_id !== userId) {
            throw new ForbiddenException('You can only invite users to your own company');
          }
        }

        resourceName = company.name;
      } else if (isDivisionInvite) {
        if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin) {
          throw new ForbiddenException(
            'Only GROUP_ADMIN, COMPANY_ADMIN, or DIVISION_ADMIN can send division invitations',
          );
        }

        division = await queryRunner.manager.findOne(Division, {
          where: { id: inviteUserDto.division_id, deleted_at: IsNull() },
          relations: ['company'],
        });

        if (!division) {
          throw new NotFoundException(`Division with ID ${inviteUserDto.division_id} not found`);
        }

        if (!division.is_active) {
          throw new ForbiddenException('Division is not active');
        }

        company = division.company;
        if (!company || !company.is_active) {
          throw new ForbiddenException('Division belongs to an inactive company');
        }

        if (isDivisionAdmin && !isGroupAdmin && !isCompanyAdmin) {
          if (division.division_admin_id !== userId) {
            throw new ForbiddenException('You can only invite users to your own division');
          }
        } else if (isCompanyAdmin && !isGroupAdmin) {
          if (company.company_admin_id !== userId) {
            throw new ForbiddenException('You can only invite users to divisions in your company');
          }
        }

        resourceName = division.name;
      } else if (isDepartmentInvite) {
        if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin && !isDepartmentAdmin) {
          throw new ForbiddenException(
            'Only GROUP_ADMIN, COMPANY_ADMIN, DIVISION_ADMIN, or DEPARTMENT_ADMIN can send department invitations',
          );
        }

        department = await queryRunner.manager.findOne(Department, {
          where: { id: inviteUserDto.department_id, deleted_at: IsNull() },
          relations: ['division', 'division.company'],
        });

        if (!department) {
          throw new NotFoundException(
            `Department with ID ${inviteUserDto.department_id} not found`,
          );
        }

        if (!department.is_active) {
          throw new ForbiddenException('Department is not active');
        }

        division = department.division;
        if (!division || !division.is_active) {
          throw new ForbiddenException('Department belongs to an inactive division');
        }

        company = division.company;
        if (!company || !company.is_active) {
          throw new ForbiddenException('Department belongs to an inactive company');
        }

        if (isDepartmentAdmin && !isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin) {
          if (department.department_admin_id !== userId) {
            throw new ForbiddenException('You can only invite users to your own department');
          }
        } else if (isDivisionAdmin && !isGroupAdmin && !isCompanyAdmin) {
          if (division.division_admin_id !== userId) {
            throw new ForbiddenException(
              'You can only invite users to departments in your division',
            );
          }
        } else if (isCompanyAdmin && !isGroupAdmin) {
          if (company.company_admin_id !== userId) {
            throw new ForbiddenException(
              'You can only invite users to departments in your company',
            );
          }
        }

        resourceName = department.name;
      }

      const role = await queryRunner.manager.findOne(Role, {
        where: { id: inviteUserDto.role_id },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${inviteUserDto.role_id} not found`);
      }
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: inviteUserDto.email, deleted_at: IsNull() },
      });

      if (existingUser) {
        throw new ConflictException(`User with email ${inviteUserDto.email} already exists`);
      }
      const inviteWhere: FindOptionsWhere<UserInvite> = {
        email: inviteUserDto.email,
        invite_status: 'pending',
        deleted_at: IsNull(),
      };

      if (isCompanyInvite) {
        inviteWhere.company_id = inviteUserDto.company_id;
        inviteWhere.division_id = IsNull();
        inviteWhere.department_id = IsNull();
      } else if (isDivisionInvite) {
        inviteWhere.division_id = inviteUserDto.division_id;
        inviteWhere.company_id = IsNull();
        inviteWhere.department_id = IsNull();
      } else if (isDepartmentInvite) {
        inviteWhere.department_id = inviteUserDto.department_id;
        inviteWhere.company_id = IsNull();
        inviteWhere.division_id = IsNull();
      }

      const existingInvite = await queryRunner.manager.findOne(UserInvite, {
        where: inviteWhere,
      });

      if (existingInvite) {
        if (existingInvite.expires_at && existingInvite.expires_at < new Date()) {
          existingInvite.invite_status = 'expired';
          await queryRunner.manager.save(UserInvite, existingInvite);
        } else {
          throw new ConflictException(
            `A pending invitation already exists for ${inviteUserDto.email} for this resource`,
          );
        }
      }
      const randomPassword = this.generateRandomPassword();

      const hashedPassword = await bcrypt.hash(randomPassword, this.SALT_ROUNDS);

      const user = queryRunner.manager.create(User, {
        email: inviteUserDto.email,
        first_name: inviteUserDto.first_name || 'User',
        last_name: inviteUserDto.last_name || null,
        phone: inviteUserDto.phone || null,
        password: hashedPassword,
        is_active: true,
        is_verified: false,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      const inviteToken = crypto.randomBytes(32).toString('hex');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.INVITE_EXPIRY_DAYS);

      const userInvite = queryRunner.manager.create(UserInvite, {
        email: inviteUserDto.email,
        company_id: inviteUserDto.company_id || null,
        division_id: inviteUserDto.division_id || null,
        department_id: inviteUserDto.department_id || null,
        invited_by_user_id: userId,
        invite_token: inviteToken,
        invite_status: 'pending',
        expires_at: expiresAt,
        metadata: {
          role_id: inviteUserDto.role_id,
          first_name: inviteUserDto.first_name || null,
          last_name: inviteUserDto.last_name || null,
        },
      });

      const savedInvite = await queryRunner.manager.save(UserInvite, userInvite);

      const userRole = queryRunner.manager.create(UserRole, {
        user_id: savedUser.id,
        role_id: inviteUserDto.role_id,
        company_id: company?.id || null,
        division_id: division?.id || null,
        department_id: department?.id || null,
        created_by: userId,
        updated_by: userId,
      });

      await queryRunner.manager.save(UserRole, userRole);

      await queryRunner.commitTransaction();
      try {
        await this.emailService.sendUserInvitation(
          inviteUserDto.email,
          inviteUserDto.first_name || 'User',
          resourceName,
          role.name,
          randomPassword,
          inviteToken,
        );
        this.logger.log(`Invitation email sent to ${inviteUserDto.email} for ${resourceName}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send invitation email to ${inviteUserDto.email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
        );
      }

      this.logger.log(
        `User invitation created successfully for ${inviteUserDto.email} to ${resourceName}`,
      );

      return {
        id: savedInvite.id,
        email: savedInvite.email,
        company_id: savedInvite.company_id || null,
        division_id: savedInvite.division_id || null,
        department_id: savedInvite.department_id || null,
        invite_status: savedInvite.invite_status,
        expires_at: savedInvite.expires_at,
        created_at: savedInvite.created_at,
        message: 'User invitation sent successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to create user invitation: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to create user invitation');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generate a random secure password
   * Format: 12 characters with uppercase, lowercase, numbers, and special characters
   */
  private generateRandomPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + special;

    // Ensure at least one character from each category
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  async acceptInvitation(
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invite = await queryRunner.manager.findOne(UserInvite, {
        where: {
          invite_token: acceptInvitationDto.invite_token,
          deleted_at: IsNull(),
        },
        relations: ['company', 'division', 'department'],
      });

      if (!invite) {
        throw new NotFoundException('Invalid or expired invitation token');
      }

      if (invite.invite_status === 'accepted') {
        throw new BadRequestException('This invitation has already been accepted');
      }

      if (invite.expires_at && invite.expires_at < new Date()) {
        // Mark as expired
        invite.invite_status = 'expired';
        await queryRunner.manager.save(UserInvite, invite);
        await queryRunner.commitTransaction();
        throw new BadRequestException('This invitation has expired');
      }

      if (invite.invite_status === 'rejected' || invite.invite_status === 'expired') {
        throw new BadRequestException('This invitation has been rejected or expired');
      }

      const user = await queryRunner.manager.findOne(User, {
        where: {
          email: invite.email,
          deleted_at: IsNull(),
        },
      });

      if (!user) {
        throw new NotFoundException('User account not found for this invitation');
      }

      if (!user.is_active) {
        throw new ForbiddenException('User account is inactive');
      }

      invite.invite_status = 'accepted';
      await queryRunner.manager.save(UserInvite, invite);

      user.is_verified = true;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      const payload = {
        sub: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: true,
      };

      const accessToken = this.jwtService.sign(payload);

      this.logger.log(
        `Invitation accepted successfully for user ${user.email} (invite ID: ${invite.id})`,
      );

      return {
        message: 'Invitation accepted successfully. You can now login with your credentials.',
        email: user.email,
        access_token: accessToken,
        token_type: 'Bearer',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to accept invitation: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to accept invitation');
    } finally {
      await queryRunner.release();
    }
  }

  async rejectInvitation(
    rejectInvitationDto: RejectInvitationDto,
  ): Promise<RejectInvitationResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invite = await queryRunner.manager.findOne(UserInvite, {
        where: {
          invite_token: rejectInvitationDto.invite_token,
          deleted_at: IsNull(),
        },
      });

      if (!invite) {
        throw new NotFoundException('Invalid or expired invitation token');
      }

      if (invite.invite_status === 'accepted') {
        throw new BadRequestException('This invitation has already been accepted');
      }
      if (invite.invite_status === 'rejected') {
        await queryRunner.rollbackTransaction();
        return {
          message: 'Invitation has already been rejected',
        };
      }

      invite.invite_status = 'rejected';
      await queryRunner.manager.save(UserInvite, invite);

      await queryRunner.commitTransaction();

      this.logger.log(`Invitation rejected for email ${invite.email} (invite ID: ${invite.id})`);

      return {
        message: 'Invitation rejected successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to reject invitation: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to reject invitation');
    } finally {
      await queryRunner.release();
    }
  }

  async getCompanyUsers(
    companyId: string,
    userId: string,
    userRoles: string[] = [],
    divisionId?: string,
    departmentId?: string,
  ): Promise<CompanyUsersResponseDto> {
    try {
      const [company, division, department] = await Promise.all([
        this.companyRepository.findOne({
          where: { id: companyId, deleted_at: IsNull() },
        }),
        divisionId
          ? this.divisionRepository.findOne({
              where: { id: divisionId, company_id: companyId, deleted_at: IsNull() },
            })
          : Promise.resolve(null),
        departmentId
          ? this.departmentRepository.findOne({
              where: { id: departmentId, division_id: divisionId, deleted_at: IsNull() },
            })
          : Promise.resolve(null),
      ]);

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      if (!company.is_active) {
        throw new BadRequestException('Company is inactive');
      }

      if (divisionId && !division) {
        throw new NotFoundException(
          `Division with ID ${divisionId} not found or does not belong to company ${companyId}`,
        );
      }

      if (division && !division.is_active) {
        throw new BadRequestException('Division is inactive');
      }

      if (departmentId && !divisionId) {
        throw new BadRequestException('department_id requires division_id to be provided');
      }

      if (departmentId && !department) {
        throw new NotFoundException(
          `Department with ID ${departmentId} not found or does not belong to division ${divisionId}`,
        );
      }

      if (department && !department.is_active) {
        throw new BadRequestException('Department is inactive');
      }

      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const roleSet = new Set(normalizedRoles);
      const isGroupAdmin = roleSet.has('GROUP_ADMIN');
      const isCompanyAdmin = roleSet.has('COMPANY_ADMIN');
      const isDivisionAdmin = roleSet.has('DIVISION_ADMIN');
      const isDepartmentAdmin = roleSet.has('DEPARTMENT_ADMIN');

      if (!isGroupAdmin && !isCompanyAdmin && !isDivisionAdmin && !isDepartmentAdmin) {
        throw new ForbiddenException(
          'Only GROUP_ADMIN, COMPANY_ADMIN, DIVISION_ADMIN, or DEPARTMENT_ADMIN can view users',
        );
      }

      if (isGroupAdmin) {
        // GROUP_ADMIN has access to all users, no additional checks needed
      } else if (isCompanyAdmin) {
        const userRole = await this.userRoleRepository.findOne({
          where: { user_id: userId, company_id: companyId, deleted_at: IsNull() },
          relations: ['role'],
        });

        if (!userRole?.role || userRole.role.name !== 'COMPANY_ADMIN') {
          throw new ForbiddenException('You can only view users of your own company');
        }
      } else if (isDivisionAdmin) {
        if (!divisionId || !division || division.division_admin_id !== userId) {
          throw new ForbiddenException('You can only view users of your own division');
        }

        if (departmentId && department && department.division_id !== divisionId) {
          throw new ForbiddenException('Department does not belong to your division');
        }
      } else if (isDepartmentAdmin) {
        if (!departmentId || !department || department.department_admin_id !== userId) {
          throw new ForbiddenException('You can only view users of your own department');
        }

        if (divisionId && department.division_id !== divisionId) {
          throw new BadRequestException("Division ID does not match the department's division");
        }
      }

      const userRolesWhere: FindOptionsWhere<UserRole> = {
        company_id: companyId,
        deleted_at: IsNull(),
      };

      if (divisionId) {
        userRolesWhere.division_id = divisionId;
      }

      if (departmentId) {
        userRolesWhere.department_id = departmentId;
      }

      const userRolesList = await this.userRoleRepository.find({
        where: userRolesWhere,
        relations: ['user', 'role'],
        order: { created_at: 'ASC' },
      });

      if (userRolesList.length === 0) {
        return {
          company_id: company.id,
          company_name: company.name,
          division_id: division?.id || null,
          division_name: division?.name || null,
          department_id: department?.id || null,
          department_name: department?.name || null,
          total_users: 0,
          users: [],
        };
      }

      const userIds = [...new Set(userRolesList.map((ur) => ur.user_id))];
      const userEmailsQuery = await this.userRepository
        .createQueryBuilder('user')
        .select('user.email', 'email')
        .where('user.id IN (:...userIds)', { userIds })
        .andWhere('user.deleted_at IS NULL')
        .getRawMany();

      const userEmailsList = userEmailsQuery.map((u: { email: string }) => u.email);

      const invitationWhere: FindOptionsWhere<UserInvite>[] = [];
      if (userEmailsList.length > 0) {
        if (departmentId) {
          invitationWhere.push({
            department_id: departmentId,
            email: In(userEmailsList),
            deleted_at: IsNull(),
          });
        } else if (divisionId) {
          invitationWhere.push({
            division_id: divisionId,
            email: In(userEmailsList),
            deleted_at: IsNull(),
          });
        } else {
          invitationWhere.push({
            company_id: companyId,
            email: In(userEmailsList),
            deleted_at: IsNull(),
          });
        }
      }

      const [users, invitations] = await Promise.all([
        this.userRepository.find({
          where: { id: In(userIds), deleted_at: IsNull() },
          order: { created_at: 'ASC' },
        }),
        invitationWhere.length > 0
          ? this.userInviteRepository.find({
              where: invitationWhere,
              order: { created_at: 'DESC' },
            })
          : [],
      ]);

      const invitationMap = new Map<string, UserInvite>();
      for (const inv of invitations) {
        const existing = invitationMap.get(inv.email);
        if (
          !existing ||
          (inv.created_at > existing.created_at && inv.invite_status === 'pending')
        ) {
          invitationMap.set(inv.email, inv);
        }
      }

      const userRoleMap = new Map<string, typeof userRolesList>();
      for (const ur of userRolesList) {
        if (!userRoleMap.has(ur.user_id)) {
          userRoleMap.set(ur.user_id, []);
        }
        userRoleMap.get(ur.user_id)!.push(ur);
      }

      const now = new Date();
      const companyUsers: CompanyUserDto[] = users.map((user) => {
        const userInvitation = invitationMap.get(user.email);
        const userRolesForCompany = (userRoleMap.get(user.id) || [])
          .filter((ur) => ur.role)
          .map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            description: null,
            permissions: ur.role.permissions,
          }));

        let invitationStatus: 'pending' | 'accepted' | 'rejected' | 'expired' | 'none' = 'none';
        let invitationExpiresAt: Date | null = null;

        if (userInvitation) {
          invitationExpiresAt = userInvitation.expires_at;
          if (userInvitation.invite_status === 'accepted') {
            invitationStatus = 'accepted';
          } else if (userInvitation.invite_status === 'rejected') {
            invitationStatus = 'rejected';
          } else if (userInvitation.invite_status === 'expired') {
            invitationStatus = 'expired';
          } else if (userInvitation.invite_status === 'pending') {
            invitationStatus =
              userInvitation.expires_at && userInvitation.expires_at < now ? 'expired' : 'pending';
          }
        }

        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_active: user.is_active,
          is_verified: user.is_verified,
          invitation_status: invitationStatus,
          invitation_expires_at: invitationExpiresAt,
          roles: userRolesForCompany,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
      });

      this.logger.log(
        `Retrieved ${companyUsers.length} users for company ${company.name}${division ? `, division ${division.name}` : ''}${department ? `, department ${department.name}` : ''}`,
      );

      return {
        company_id: company.id,
        company_name: company.name,
        division_id: division?.id || null,
        division_name: division?.name || null,
        department_id: department?.id || null,
        department_name: department?.name || null,
        total_users: companyUsers.length,
        users: companyUsers,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get company users: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to retrieve company users');
    }
  }
}
