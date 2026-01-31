import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Request as ExpressRequest } from 'express';
import { PERMISSIONS_KEY, Permission } from '../decorators/permissions.decorator';

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
  userPermissions?: Record<string, string[]>;
}

interface RoleQueryResult {
  name: string;
  permissions: string | Record<string, string[]>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<(string | Permission)[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user roles with permissions from database
    const userRoles = await this.dataSource.query<RoleQueryResult[]>(
      `SELECT r.name, r.permissions 
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND ur.deleted_at IS NULL`,
      [user.id],
    );

    if (userRoles.length === 0) {
      throw new ForbiddenException('User has no roles assigned');
    }

    // Collect all permissions from user's roles
    const userPermissions: Record<string, string[]> = {};

    for (const role of userRoles) {
      // Parse permissions if it's a JSON string, otherwise use as-is
      let permissions: Record<string, string[]>;
      const rolePermissions = role.permissions;
      if (typeof rolePermissions === 'string') {
        permissions = JSON.parse(rolePermissions) as Record<string, string[]>;
      } else {
        permissions = rolePermissions;
      }

      for (const [resource, actions] of Object.entries(permissions)) {
        if (!userPermissions[resource]) {
          userPermissions[resource] = [];
        }
        userPermissions[resource].push(...actions);
      }
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      let resource: string;
      let action: string;

      if (typeof permission === 'string') {
        // Format: "resource:action" or "resource.action"
        const parts = permission.split(/[:.]/);
        if (parts.length !== 2) {
          throw new ForbiddenException(`Invalid permission format: ${permission}`);
        }
        [resource, action] = parts;
      } else {
        resource = permission.resource;
        action = permission.action;
      }

      const hasPermission =
        userPermissions[resource]?.includes(action) ||
        userPermissions[resource]?.includes('*') ||
        userPermissions['all']?.includes('*');

      if (!hasPermission) {
        throw new ForbiddenException(`Access denied. Required permission: ${resource}:${action}`);
      }
    }

    // Attach user permissions to request for use in controllers
    request.userPermissions = userPermissions;

    return true;
  }
}
