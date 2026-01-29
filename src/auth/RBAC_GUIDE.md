# Role-Based Access Control (RBAC) Guide

## Overview

This project uses **NestJS Guards** for role and permission checking. Guards are the recommended NestJS approach for authorization.

## Why Guards (Not Middleware or Bouncers)?

| Approach      | NestJS Support   | Best For                              |
| ------------- | ---------------- | ------------------------------------- |
| **Guards** ✅ | Native support   | Authorization, Role/Permission checks |
| Middleware    | Yes, but limited | Request transformation, logging       |
| Bouncers      | Laravel concept  | Not applicable to NestJS              |

**Guards are perfect for RBAC because:**

- Run after authentication, before route handlers
- Can access route metadata (decorators)
- Can be combined and composed
- Type-safe with TypeScript
- Built into NestJS framework

## Architecture

```
Request → JwtAuthGuard → RolesGuard → PermissionsGuard → Controller Handler
         (Auth check)   (Role check)  (Permission check)
```

## Files Created

### Guards

- `src/auth/guards/jwt-auth.guard.ts` - JWT authentication
- `src/auth/guards/roles.guard.ts` - Role checking
- `src/auth/guards/permissions.guard.ts` - Permission checking

### Decorators

- `src/auth/decorators/roles.decorator.ts` - `@Roles()` decorator
- `src/auth/decorators/permissions.decorator.ts` - `@Permissions()` decorator
- `src/auth/decorators/public.decorator.ts` - `@Public()` decorator

## Usage Examples

### 1. Public Endpoint (No Auth)

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Get('info')
  @Public()
  getInfo() {
    return { message: 'Public data' };
  }
}
```

### 2. Authenticated Only

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // User from JWT
  }
}
```

### 3. Role-Based Access

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  @Post()
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  createCompany() {
    // Only GROUP_ADMIN or COMPANY_ADMIN can access
  }
}
```

### 4. Permission-Based Access

```typescript
import { Controller, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('tenders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TendersController {
  @Delete(':id')
  @Permissions('tenders:delete')
  deleteTender() {
    // User must have 'tenders:delete' permission
  }
}
```

### 5. Combined Role + Permission

```typescript
import { Controller, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ProjectsController {
  @Put(':id')
  @Roles('PROJECT_ADMIN', 'COMPANY_ADMIN')
  @Permissions('projects:update')
  updateProject() {
    // User must have role AND permission
  }
}
```

## Permission Format

### String Format

```typescript
@Permissions('tenders:create', 'tenders:read')
```

### Object Format

```typescript
@Permissions(
  { resource: 'tenders', action: 'create' },
  { resource: 'tenders', action: 'read' }
)
```

## Request Object Extensions

After guards execute, the request object contains:

```typescript
// From JwtAuthGuard
req.user = {
  id: string,
  email: string,
  first_name: string,
  last_name: string,
  is_verified: boolean,
  is_active: boolean,
};

// From RolesGuard
req.userRoles = ['GROUP_ADMIN', 'COMPANY_ADMIN'];

// From PermissionsGuard
req.userPermissions = {
  companies: ['create', 'read', 'update', 'delete'],
  tenders: ['read'],
  projects: ['read', 'update'],
};
```

## Error Responses

- **401 Unauthorized**: JWT token missing/invalid
- **403 Forbidden**: User lacks required role/permission

## Best Practices

1. ✅ **Always use JwtAuthGuard first** - Ensures authentication
2. ✅ **Use @Public() for public routes** - Signup, login, etc.
3. ✅ **Use Roles for broad access** - "Who can access?"
4. ✅ **Use Permissions for fine-grained control** - "What can they do?"
5. ✅ **Combine both when needed** - Maximum security
6. ✅ **Apply at controller level** - DRY principle
7. ✅ **Override at method level** - When needed

## Performance Tips

- Guards run on every request
- Consider caching user roles/permissions
- Database queries are optimized with indexes
- For high-traffic APIs, consider Redis caching

## Complete Example

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/companies')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Applied to all routes
export class CompaniesController {
  @Get()
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER')
  @Permissions('companies:read')
  getAllCompanies(@Request() req) {
    // Accessible by multiple roles with read permission
    return { companies: [], user: req.user };
  }

  @Post()
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN')
  @Permissions('companies:create')
  createCompany(@Request() req) {
    // Only admins with create permission
    return { message: 'Company created' };
  }

  @Put(':id')
  @Permissions('companies:update')
  updateCompany(@Request() req) {
    // Any authenticated user with update permission
    return { message: 'Company updated' };
  }

  @Delete(':id')
  @Roles('GROUP_ADMIN')
  @Permissions('companies:delete')
  deleteCompany(@Request() req) {
    // Only GROUP_ADMIN with delete permission
    return { message: 'Company deleted' };
  }
}
```

## Testing

When testing protected endpoints:

```bash
# Include JWT token in header
curl -X GET http://localhost:5000/api/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Summary

✅ **Use Guards** - NestJS native approach  
✅ **JwtAuthGuard** - For authentication  
✅ **RolesGuard** - For role checking  
✅ **PermissionsGuard** - For permission checking  
✅ **Decorators** - Easy to use (`@Roles()`, `@Permissions()`)  
✅ **Composable** - Combine multiple guards

This is the production-ready, NestJS-recommended way to handle RBAC!
