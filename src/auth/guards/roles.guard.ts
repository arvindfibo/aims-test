import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import type { Request as ExpressRequest } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../entities/user-role.entity';
import { Role } from '../../entities/role.entity';

interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name?: string | null;
  is_verified: boolean;
  is_active: boolean;
}

interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
  userRoles?: string[];
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user roles from database using TypeORM repository
    // This query matches the database schema:
    // - user_roles.user_id (uuid) -> users.id
    // - user_roles.role_id (integer) -> roles.id
    // - user_roles.deleted_at IS NULL (soft delete check)
    const userRoles = await this.userRoleRepository.find({
      where: {
        user_id: user.id,
        deleted_at: IsNull(),
      },
      relations: ['role'],
    });

    // Extract role names from the relations
    const userRoleNames = userRoles
      .map((userRole) => userRole.role?.name)
      .filter((name): name is string => name !== undefined);

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User has roles: ${userRoleNames.join(', ') || 'none'}`,
      );
    }

    // Attach user roles to request for use in controllers
    request.userRoles = userRoleNames;

    return true;
  }
}
