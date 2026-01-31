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
      // Verify user has required role (GROUP_ADMIN or COMPANY_ADMIN)
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');
      const isCompanyAdmin = normalizedRoles.includes('COMPANY_ADMIN');

      if (!isGroupAdmin && !isCompanyAdmin) {
        throw new ForbiddenException('Only GROUP_ADMIN or COMPANY_ADMIN can send invitations');
      }

      // Verify company exists and is active
      const company = await queryRunner.manager.findOne(Company, {
        where: { id: inviteUserDto.company_id, deleted_at: IsNull() },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${inviteUserDto.company_id} not found`);
      }

      if (!company.is_active) {
        throw new ForbiddenException('Company is not active');
      }

      // If COMPANY_ADMIN, verify they are the admin of this company
      if (isCompanyAdmin && !isGroupAdmin) {
        if (company.company_admin_user_id !== userId) {
          throw new ForbiddenException('You can only invite users to your own company');
        }
      }

      // Verify role exists
      const role = await queryRunner.manager.findOne(Role, {
        where: { id: inviteUserDto.role_id },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${inviteUserDto.role_id} not found`);
      }

      // Check if user already exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: inviteUserDto.email, deleted_at: IsNull() },
      });

      if (existingUser) {
        throw new ConflictException(`User with email ${inviteUserDto.email} already exists`);
      }

      // Check if there's already a pending invite for this email and company
      const existingInvite = await queryRunner.manager.findOne(UserInvite, {
        where: {
          email: inviteUserDto.email,
          company_id: inviteUserDto.company_id,
          invite_status: 'pending',
          deleted_at: IsNull(),
        },
      });

      if (existingInvite) {
        // Check if invite is expired
        if (existingInvite.expires_at && existingInvite.expires_at < new Date()) {
          // Mark as expired
          existingInvite.invite_status = 'expired';
          await queryRunner.manager.save(UserInvite, existingInvite);
        } else {
          throw new ConflictException(
            `A pending invitation already exists for ${inviteUserDto.email} in this company`,
          );
        }
      }

      // Generate random password
      const randomPassword = this.generateRandomPassword();

      // Hash password
      const hashedPassword = await bcrypt.hash(randomPassword, this.SALT_ROUNDS);

      // Create user account (inactive until they accept invitation)
      const user = queryRunner.manager.create(User, {
        email: inviteUserDto.email,
        first_name: inviteUserDto.first_name || 'User',
        last_name: inviteUserDto.last_name || null,
        phone: inviteUserDto.phone || null,
        password: hashedPassword,
        is_active: true, // Active but needs to accept invitation
        is_verified: false, // Will be verified when they accept
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // Generate invite token
      const inviteToken = crypto.randomBytes(32).toString('hex');

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.INVITE_EXPIRY_DAYS);

      // Create invite record
      const userInvite = queryRunner.manager.create(UserInvite, {
        email: inviteUserDto.email,
        company_id: inviteUserDto.company_id,
        invited_by_user_id: userId,
        invite_token: inviteToken,
        invite_status: 'pending',
        expires_at: expiresAt,
        metadata: {
          role_id: inviteUserDto.role_id,
          division_id: inviteUserDto.division_id || null,
          department_id: inviteUserDto.department_id || null,
          first_name: inviteUserDto.first_name || null,
          last_name: inviteUserDto.last_name || null,
        },
      });

      const savedInvite = await queryRunner.manager.save(UserInvite, userInvite);

      // Assign role to user (will be activated when they accept invitation)
      const userRole = queryRunner.manager.create(UserRole, {
        user_id: savedUser.id,
        role_id: inviteUserDto.role_id,
        company_id: inviteUserDto.company_id,
        division_id: inviteUserDto.division_id || null,
        department_id: inviteUserDto.department_id || null,
        created_by: userId,
        updated_by: userId,
      });

      await queryRunner.manager.save(UserRole, userRole);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Send invitation email (outside transaction to avoid rollback if email fails)
      try {
        await this.emailService.sendUserInvitation(
          inviteUserDto.email,
          inviteUserDto.first_name || 'User',
          company.name,
          role.name,
          randomPassword,
          inviteToken,
        );
        this.logger.log(
          `Invitation email sent to ${inviteUserDto.email} for company ${company.name}`,
        );
      } catch (emailError) {
        // Log error but don't fail the invite creation
        this.logger.error(
          `Failed to send invitation email to ${inviteUserDto.email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
        );
        // Note: In production, you might want to queue this for retry
      }

      this.logger.log(
        `User invitation created successfully for ${inviteUserDto.email} to company ${company.name}`,
      );

      return {
        id: savedInvite.id,
        email: savedInvite.email,
        company_id: savedInvite.company_id,
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

  /**
   * Accept an invitation
   * @param acceptInvitationDto - Invitation token
   * @returns JWT token and success message
   */
  async acceptInvitation(
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find invitation by token
      const invite = await queryRunner.manager.findOne(UserInvite, {
        where: {
          invite_token: acceptInvitationDto.invite_token,
          deleted_at: IsNull(),
        },
        relations: ['company'],
      });

      if (!invite) {
        throw new NotFoundException('Invalid or expired invitation token');
      }

      // Check if invitation is already accepted
      if (invite.invite_status === 'accepted') {
        throw new BadRequestException('This invitation has already been accepted');
      }

      // Check if invitation is expired
      if (invite.expires_at && invite.expires_at < new Date()) {
        // Mark as expired
        invite.invite_status = 'expired';
        await queryRunner.manager.save(UserInvite, invite);
        await queryRunner.commitTransaction();
        throw new BadRequestException('This invitation has expired');
      }

      // Check if invitation is already rejected
      if (invite.invite_status === 'rejected' || invite.invite_status === 'expired') {
        throw new BadRequestException('This invitation has been rejected or expired');
      }

      // Find user by email
      const user = await queryRunner.manager.findOne(User, {
        where: {
          email: invite.email,
          deleted_at: IsNull(),
        },
      });

      if (!user) {
        throw new NotFoundException('User account not found for this invitation');
      }

      // Verify user is active
      if (!user.is_active) {
        throw new ForbiddenException('User account is inactive');
      }

      // Mark invitation as accepted
      invite.invite_status = 'accepted';
      await queryRunner.manager.save(UserInvite, invite);

      // Mark user as verified (since they accepted the invitation)
      user.is_verified = true;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      // Generate JWT token
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

  /**
   * Reject an invitation
   * @param rejectInvitationDto - Invitation token
   * @returns Success message
   */
  async rejectInvitation(
    rejectInvitationDto: RejectInvitationDto,
  ): Promise<RejectInvitationResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find invitation by token
      const invite = await queryRunner.manager.findOne(UserInvite, {
        where: {
          invite_token: rejectInvitationDto.invite_token,
          deleted_at: IsNull(),
        },
      });

      if (!invite) {
        throw new NotFoundException('Invalid or expired invitation token');
      }

      // Check if invitation is already accepted
      if (invite.invite_status === 'accepted') {
        throw new BadRequestException('This invitation has already been accepted');
      }

      // Check if invitation is already rejected
      if (invite.invite_status === 'rejected') {
        await queryRunner.rollbackTransaction();
        return {
          message: 'Invitation has already been rejected',
        };
      }

      // Mark invitation as rejected
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

  /**
   * Get all users of a company with invitation status and roles
   * @param companyId - Company ID
   * @param userId - Current user ID (for authorization)
   * @param userRoles - Current user roles (for authorization)
   * @param divisionId - Optional division ID filter
   * @param departmentId - Optional department ID filter
   * @returns List of users with invitation status and roles
   */
  async getCompanyUsers(
    companyId: string,
    userId: string,
    userRoles: string[] = [],
    divisionId?: string,
    departmentId?: string,
  ): Promise<CompanyUsersResponseDto> {
    try {
      // Verify company exists and is active
      const company = await this.companyRepository.findOne({
        where: {
          id: companyId,
          deleted_at: IsNull(),
        },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      if (!company.is_active) {
        throw new BadRequestException('Company is inactive');
      }

      // Validate division if provided
      let division: Division | null = null;
      if (divisionId) {
        division = await this.divisionRepository.findOne({
          where: {
            id: divisionId,
            company_id: companyId, // Ensure division belongs to the company
            deleted_at: IsNull(),
          },
        });

        if (!division) {
          throw new NotFoundException(
            `Division with ID ${divisionId} not found or does not belong to company ${companyId}`,
          );
        }

        if (!division.is_active) {
          throw new BadRequestException('Division is inactive');
        }
      }

      // Validate department if provided
      let department: Department | null = null;
      if (departmentId) {
        if (!divisionId) {
          throw new BadRequestException('department_id requires division_id to be provided');
        }

        department = await this.departmentRepository.findOne({
          where: {
            id: departmentId,
            division_id: divisionId, // Ensure department belongs to the division
            deleted_at: IsNull(),
          },
        });

        if (!department) {
          throw new NotFoundException(
            `Department with ID ${departmentId} not found or does not belong to division ${divisionId}`,
          );
        }

        if (!department.is_active) {
          throw new BadRequestException('Department is inactive');
        }
      }

      // Authorization checks
      const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];
      const isGroupAdmin = normalizedRoles.includes('GROUP_ADMIN');
      const isCompanyAdmin = normalizedRoles.includes('COMPANY_ADMIN');
      const isDivisionAdmin = normalizedRoles.includes('DIVISION_ADMIN');
      const isDepartmentAdmin = normalizedRoles.includes('DEPARTMENT_ADMIN');

      // GROUP_ADMIN can access any company/division/department
      if (isGroupAdmin) {
        // No additional checks needed - can filter by any division/department
      } else if (isCompanyAdmin) {
        // COMPANY_ADMIN can only see users of their own company
        // They can filter by division/department within their company
        const userRole = await this.userRoleRepository.findOne({
          where: {
            user_id: userId,
            company_id: companyId,
            deleted_at: IsNull(),
          },
          relations: ['role'],
        });

        if (!userRole || userRole.role?.name !== 'COMPANY_ADMIN') {
          throw new ForbiddenException('You can only view users of your own company');
        }
      } else if (isDivisionAdmin && divisionId) {
        // DIVISION_ADMIN can only see users of their own division
        // They cannot filter by other divisions
        if (!division || division.division_admin_user_id !== userId) {
          throw new ForbiddenException('You can only view users of your own division');
        }
        // If department_id is provided, it must belong to their division
        if (departmentId && department && department.division_id !== divisionId) {
          throw new ForbiddenException('Department does not belong to your division');
        }
      } else if (isDepartmentAdmin && departmentId) {
        // DEPARTMENT_ADMIN can only see users of their own department
        if (!department || department.department_admin_user_id !== userId) {
          throw new ForbiddenException('You can only view users of your own department');
        }
        // If division_id is provided, it must match the department's division
        if (divisionId && department.division_id !== divisionId) {
          throw new BadRequestException("Division ID does not match the department's division");
        }
      } else {
        throw new ForbiddenException(
          'Only GROUP_ADMIN, COMPANY_ADMIN, DIVISION_ADMIN, or DEPARTMENT_ADMIN can view users',
        );
      }

      // Build where clause for user_roles query
      const userRolesWhere: FindOptionsWhere<UserRole> = {
        company_id: companyId,
        deleted_at: IsNull(),
      };

      // Add division filter if provided
      if (divisionId) {
        userRolesWhere.division_id = divisionId;
      }

      // Add department filter if provided
      if (departmentId) {
        userRolesWhere.department_id = departmentId;
      }

      // Get all users with roles for this company (and optionally division/department)
      const userRolesList = await this.userRoleRepository.find({
        where: userRolesWhere,
        relations: ['user', 'role'],
        order: {
          created_at: 'ASC',
        },
      });

      // Get unique user IDs
      const userIds = [...new Set(userRolesList.map((ur) => ur.user_id))];

      // Get all users
      const users =
        userIds.length > 0
          ? await this.userRepository.find({
              where: {
                id: In(userIds),
                deleted_at: IsNull(),
              },
              order: {
                created_at: 'ASC',
              },
            })
          : [];

      // Get user emails
      const userEmails = users.map((u) => u.email);

      // Get all invitations for these users in this company
      const invitations =
        userEmails.length > 0
          ? await this.userInviteRepository.find({
              where: {
                company_id: companyId,
                email: In(userEmails),
                deleted_at: IsNull(),
              },
              order: {
                created_at: 'DESC',
              },
            })
          : [];

      // Build user map with invitation status
      const userMap = new Map<string, CompanyUserDto>();

      for (const user of users) {
        // Find invitation for this user (by email)
        const userInvitation = invitations.find((inv) => inv.email === user.email);

        // Get roles for this user in this company
        const userRolesForCompany = userRolesList
          .filter((ur) => ur.user_id === user.id && ur.role)
          .map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            description: null, // Role entity doesn't have description field
            permissions: ur.role.permissions,
          }));

        // Determine invitation status
        let invitationStatus: 'pending' | 'accepted' | 'rejected' | 'expired' | 'none' = 'none';
        let invitationExpiresAt: Date | null = null;

        if (userInvitation) {
          if (userInvitation.invite_status === 'accepted') {
            invitationStatus = 'accepted';
          } else if (userInvitation.invite_status === 'rejected') {
            invitationStatus = 'rejected';
          } else if (userInvitation.invite_status === 'expired') {
            invitationStatus = 'expired';
          } else if (userInvitation.invite_status === 'pending') {
            // Check if expired
            if (userInvitation.expires_at && userInvitation.expires_at < new Date()) {
              invitationStatus = 'expired';
            } else {
              invitationStatus = 'pending';
            }
          }
          invitationExpiresAt = userInvitation.expires_at;
        }

        userMap.set(user.id, {
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
        });
      }

      const companyUsers = Array.from(userMap.values());

      // Build filter description for logging
      let filterDescription = `company ${company.name} (${companyId})`;
      if (division) {
        filterDescription += `, division ${division.name} (${divisionId})`;
      }
      if (department) {
        filterDescription += `, department ${department.name} (${departmentId})`;
      }

      this.logger.log(`Retrieved ${companyUsers.length} users for ${filterDescription}`);

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
      );
      throw new InternalServerErrorException('Failed to retrieve company users');
    }
  }
}
