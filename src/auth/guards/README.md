# Role-Based Access Control (RBAC) with Guards

In NestJS, **Guards** are the recommended way to handle authorization. They run after middleware but before route handlers, making them perfect for role and permission checking.

## Why Guards?

- ✅ **NestJS Native**: Built-in support, no external libraries needed
- ✅ **Flexible**: Can be applied at controller or method level
- ✅ **Composable**: Can combine multiple guards
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Performance**: Only runs when needed

## Guards Overview

### 1. **JwtAuthGuard** - Authentication

Ensures user is authenticated via JWT token.

### 2. **RolesGuard** - Role Checking

Checks if user has required roles.

### 3. **PermissionsGuard** - Permission Checking

Checks if user has required permissions.

## Usage Examples

### Basic Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // Protect entire controller
export class UsersController {
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // User info from JWT
  }
}
```

### Role-Based Access

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard) // Combine guards
export class CompaniesController {
  @Post()
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN') // Only these roles can access
  createCompany() {
    // Create company logic
  }

  @Get()
  @Roles('GROUP_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER') // Multiple roles
  getAllCompanies() {
    // Get companies logic
  }
}
```

### Permission-Based Access

```typescript
import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('tenders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TendersController {
  @Post()
  @Permissions('tenders:create') // String format: "resource:action"
  createTender() {
    // Create tender logic
  }

  @Get()
  @Permissions({ resource: 'tenders', action: 'read' }) // Object format
  getAllTenders() {
    // Get tenders logic
  }

  @Delete(':id')
  @Permissions('tenders:delete')
  deleteTender() {
    // Delete tender logic
  }
}
```

### Combined Role + Permission

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ProjectsController {
  @Post()
  @Roles('PROJECT_ADMIN', 'COMPANY_ADMIN')
  @Permissions('projects:create')
  createProject() {
    // User must have role AND permission
  }
}
```

### Public Routes

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Get('info')
  @Public() // Skip authentication
  getPublicInfo() {
    return { message: 'Public information' };
  }
}
```

## How It Works

### 1. JWT Authentication Flow

```
Request → JwtAuthGuard → Validates JWT → Attaches user to request → Next guard
```

### 2. Role Checking Flow

```
Request → RolesGuard → Fetches user roles from DB → Checks required roles → Allow/Deny
```

### 3. Permission Checking Flow

```
Request → PermissionsGuard → Fetches user roles & permissions → Checks required permissions → Allow/Deny
```

## Request Object Extensions

After guards run, the request object contains:

```typescript
request.user = {
  id: string,
  email: string,
  first_name: string,
  last_name: string,
  is_verified: boolean,
  is_active: boolean,
};

request.userRoles = ['GROUP_ADMIN', 'COMPANY_ADMIN']; // From RolesGuard

request.userPermissions = {
  companies: ['create', 'read', 'update', 'delete'],
  tenders: ['read'],
  // ... other permissions
}; // From PermissionsGuard
```

## Best Practices

1. **Always use JwtAuthGuard first** - Ensures user is authenticated
2. **Use Roles for broad access control** - "Who can access this?"
3. **Use Permissions for fine-grained control** - "What can they do?"
4. **Combine both when needed** - Role + Permission for maximum security
5. **Cache role/permission queries** - Consider caching for performance
6. **Use @Public() for public endpoints** - Signup, login, etc.

## Performance Considerations

- Guards run on every request, so database queries should be optimized
- Consider caching user roles/permissions in Redis
- Use database indexes on `user_roles` table
- Consider eager loading roles in JWT payload (trade-off: larger tokens)

## Error Responses

- **401 Unauthorized**: Not authenticated (JWT missing/invalid)
- **403 Forbidden**: Authenticated but missing required role/permission
