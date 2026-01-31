# Departments API

## Overview

Production-ready department APIs with role-based access control. Departments belong to divisions (which belong to companies) and can have their own admin users. `GROUP_ADMIN` users can create, update, and delete any department. `COMPANY_ADMIN` users can create, update, and delete departments in their company. `DIVISION_ADMIN` users can create, update, and delete departments in their division. `DEPARTMENT_ADMIN` users can update and delete only their own department.

## Files Created

1. **Entity**: `src/entities/department.entity.ts`
   - TypeORM entity matching database schema
   - All fields from migration included
   - Proper relationships with Division and User

2. **DTOs**:
   - `src/departments/dto/create-department.dto.ts`
     - `CreateDepartmentDto` - Request DTO with validation
     - `DepartmentResponseDto` - Response DTO
   - `src/departments/dto/update-department.dto.ts`
     - `UpdateDepartmentDto` - Update request DTO with validation
   - `src/departments/dto/delete-department.dto.ts`
     - `DeleteDepartmentResponseDto` - Soft delete response DTO
   - Comprehensive validation rules

3. **Service**: `src/departments/departments.service.ts`
   - Business logic for department CRUD operations
   - Transaction support
   - Duplicate checking (name and code within division)
   - Role-based authorization
   - Error handling

4. **Controller**: `src/departments/departments.controller.ts`
   - RESTful endpoints
   - Swagger documentation
   - Role-based access control

5. **Module**: `src/departments/departments.module.ts`
   - NestJS module configuration

## API Endpoints

### Create Department

**POST** `/departments`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN` (of the company), or `DIVISION_ADMIN` (of the division)

**Request Body**:

```json
{
  "division_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Software Engineering",
  "code": "SWE",
  "description": "Software engineering and development department",
  "department_admin_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_active": true
}
```

**Response** (201 Created):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "division_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Software Engineering",
  "code": "SWE",
  "description": "Software engineering and development department",
  "is_active": true,
  "department_admin_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Get All Departments for a Division

**GET** `/departments/division/:divisionId`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN`, `DIVISION_ADMIN`, `DEPARTMENT_ADMIN`, `DEPARTMENT_USER`, `DIVISION_USER`, or `COMPANY_USER`

**Response** (200 OK): Returns array of departments (same shape as create).

### Get Department

**GET** `/departments/:id`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN`, `DIVISION_ADMIN`, `DEPARTMENT_ADMIN`, `DEPARTMENT_USER`, `DIVISION_USER`, or `COMPANY_USER`

**Response** (200 OK): Returns department details (same shape as create).

### Update Department

**PATCH** `/departments/:id`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN` (of the company), `DIVISION_ADMIN` (of the division), or `DEPARTMENT_ADMIN` (of the department)

**Request Body** (any subset of fields):

```json
{
  "name": "Software Engineering Updated",
  "code": "SWE-UPD",
  "description": "Updated description",
  "is_active": true
}
```

**Response** (200 OK): Returns updated department (same shape as create).

### Delete Department (Soft Delete)

**DELETE** `/departments/:id`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN` (of the company), `DIVISION_ADMIN` (of the division), or `DEPARTMENT_ADMIN` (of the department)

**Response** (200 OK):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Department deleted successfully",
  "deleted_at": "2024-01-01T00:00:00.000Z"
}
```

## Validation Rules

### Required Fields

- `division_id` (UUID)
- `name` (string, max 255 chars)

### Optional Fields with Validation

- `code`: Max 50 characters, must be unique within division
- `description`: Text field
- `department_admin_user_id`: UUID of user to assign as department admin
- `is_active`: Boolean (default: true)

## Security Features

1. **Role-Based Access Control**
   - `GROUP_ADMIN` can create, update, delete any department
   - `COMPANY_ADMIN` can create, update, delete departments in their company
   - `DIVISION_ADMIN` can create, update, delete departments in their division
   - `DEPARTMENT_ADMIN` can update and delete only their department
   - Uses `@Roles()` decorator with appropriate roles
   - Guard validates role before allowing access

2. **Transaction Safety**
   - All operations in database transaction
   - Rollback on any error
   - Data consistency guaranteed

3. **Duplicate Prevention**
   - Department name uniqueness within division
   - Department code uniqueness within division (if provided)

4. **Input Validation**
   - Comprehensive DTO validation
   - Type checking
   - Format validation

5. **Authorization Checks**
   - Verifies division exists and is active
   - Verifies company exists and is active
   - Verifies user has appropriate role and access
   - COMPANY_ADMIN must be admin of the company
   - DIVISION_ADMIN must be admin of the division
   - DEPARTMENT_ADMIN must be admin of the department

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["name must be a string", "code must not exceed 50 characters"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Access denied. Only GROUP_ADMIN, COMPANY_ADMIN of this company, or DIVISION_ADMIN of this division can create departments."
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Division with ID 123e4567-e89b-12d3-a456-426614174000 not found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Department with name \"Software Engineering\" already exists in this division"
}
```

## Usage Example

### cURL

```bash
curl -X POST http://localhost:5000/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "division_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Software Engineering",
    "code": "SWE",
    "description": "Software engineering and development department"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:5000/departments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwtToken}`,
  },
  body: JSON.stringify({
    division_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Software Engineering',
    code: 'SWE',
    description: 'Software engineering and development department',
  }),
});

const department = await response.json();
```

## Production Features

✅ **Transaction Support** - All operations in database transaction  
✅ **Error Handling** - Comprehensive error handling with proper HTTP status codes  
✅ **Validation** - Input validation with class-validator  
✅ **Type Safety** - Full TypeScript type safety  
✅ **Logging** - Structured logging for debugging  
✅ **Swagger Documentation** - Auto-generated API documentation  
✅ **Role-Based Access** - Proper authorization checks  
✅ **Duplicate Prevention** - Checks for duplicates before creation  
✅ **Audit Fields** - Tracks created_by and updated_by  
✅ **Soft Delete Support** - Uses deleted_at for soft deletes  
✅ **Division & Company Validation** - Verifies division and company exist and are active

## Relationships

- **Department → Division**: Many-to-one (each department belongs to one division)
- **Department → User (Admin)**: Many-to-one (each department can have one admin)
- **Department → User (Users)**: Many-to-many via `user_roles` table with `department_id` and `DEPARTMENT_USER` role
- **Division → Departments**: One-to-many (one division has many departments)

## Hierarchy

```
Company Group
  └── Company
      └── Division
          └── Department
```

## Next Steps

To extend this API, you can add:

- GET `/departments` - List all departments (with pagination and filters)
- GET `/companies/:id/departments` - Get all departments for a company (across all divisions)
- GET `/departments/:id/users` - Get users in a department
