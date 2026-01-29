import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Request,
  Body,
  Param,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { Public } from '../decorators/public.decorator';

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
  userPermissions?: Record<string, string[]>;
}

/**
 * Example controller showing different ways to use guards
 * This file is for reference only - delete or modify as needed
 */
@Controller('example')
export class ExampleController {
  // Public endpoint - no authentication required
  @Get('public')
  @Public()
  getPublicData() {
    return { message: 'This is public data' };
  }

  // Protected endpoint - requires authentication only
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtectedData(@Request() req: AuthenticatedRequest) {
    return {
      message: 'This is protected data',
      user: req.user,
    };
  }

  // Role-based access - requires specific roles
  @Post('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  adminOnlyAction(@Request() req: AuthenticatedRequest) {
    return {
      message: 'Only admins can access this',
      user: req.user,
      roles: req.userRoles,
    };
  }

  // Permission-based access - requires specific permissions
  @Post('create-resource')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:create')
  createResource(@Body() data: unknown) {
    return {
      message: 'Resource created',
      data,
    };
  }

  // Combined role + permission check
  @Put('update-resource/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('COMPANY_ADMIN', 'DIVISION_ADMIN')
  @Permissions('companies:update')
  updateResource(
    @Param('id') id: string,
    @Body() data: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    return {
      message: 'Resource updated',
      id,
      data,
      userRoles: req.userRoles,
      userPermissions: req.userPermissions,
    };
  }

  // Multiple permissions (user needs ALL)
  @Delete('delete-resource/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('companies:delete', 'companies:read')
  deleteResource(@Param('id') id: string) {
    return {
      message: 'Resource deleted',
      id,
    };
  }

  // Permission with object format
  @Get('read-resource/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'tenders', action: 'read' })
  readResource(@Param('id') id: string) {
    return {
      message: 'Resource read',
      id,
    };
  }
}
