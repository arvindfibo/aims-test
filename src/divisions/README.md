# Divisions API

## Overview

Production-ready division APIs with role-based access control. Divisions belong to companies and can have their own admin users. `GROUP_ADMIN` users can create, update, and delete any division. `COMPANY_ADMIN` users can create, update, and delete divisions in their company. `DIVISION_ADMIN` users can update and delete only their own division.

## Files Created

1. **Entity**: `src/entities/division.entity.ts`
   - TypeORM entity matching database schema
   - All fields from migration included
   - Proper relationships with Company and User

2. **DTOs**:
   - `src/divisions/dto/create-division.dto.ts`
     - `CreateDivisionDto` - Request DTO with validation
     - `DivisionResponseDto` - Response DTO
   - `src/divisions/dto/update-division.dto.ts`
     - `UpdateDivisionDto` - Update request DTO with validation
   - `src/divisions/dto/delete-division.dto.ts`
     - `DeleteDivisionResponseDto` - Soft delete response DTO
   - Comprehensive validation rules

3. **Service**: `src/divisions/divisions.service.ts`
   - Business logic for division CRUD operations
   - Transaction support
   - Duplicate checking (name and code within company)
   - Role-based authorization
   - Error handling

4. **Controller**: `src/divisions/divisions.controller.ts`
   - RESTful endpoints
   - Swagger documentation
   - Role-based access control

5. **Module**: `src/divisions/divisions.module.ts`
   - NestJS module configuration

## API Endpoints

### Create Division

**POST** `/divisions`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN` or `COMPANY_ADMIN` (must be admin of the company)

**Request Body**:

```json
{
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Engineering Division",
  "code": "ENG",
  "description": "Engineering and development division",
  "division_admin_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_active": true
}
```

**Response** (201 Created):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Engineering Division",
  "code": "ENG",
  "description": "Engineering and development division",
  "is_active": true,
  "division_admin_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Get Division

**GET** `/divisions/:id`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN`, `DIVISION_ADMIN`, `DIVISION_USER`, or `COMPANY_USER`

**Response** (200 OK): Returns division details (same shape as create).

### Update Division

**PATCH** `/divisions/:id`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN` (of the company), or `DIVISION_ADMIN` (of the division)

**Request Body** (any subset of fields):

```json
{
  "name": "Engineering Division Updated",
  "code": "ENG-UPD",
  "description": "Updated description",
  "is_active": true
}
```

**Response** (200 OK): Returns updated division (same shape as create).

### Delete Division (Soft Delete)

**DELETE** `/divisions/:id`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`, `COMPANY_ADMIN` (of the company), or `DIVISION_ADMIN` (of the division)

**Response** (200 OK):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Division deleted successfully",
  "deleted_at": "2024-01-01T00:00:00.000Z"
}
```

## Validation Rules

### Required Fields

- `company_id` (UUID)
- `name` (string, max 255 chars)

### Optional Fields with Validation

- `code`: Max 50 characters, must be unique within company
- `description`: Text field
- `division_admin_user_id`: UUID of user to assign as division admin
- `is_active`: Boolean (default: true)

## Security Features

1. **Role-Based Access Control**
   - `GROUP_ADMIN` can create, update, delete any division
   - `COMPANY_ADMIN` can create, update, delete divisions in their company
   - `DIVISION_ADMIN` can update and delete only their division
   - Uses `@Roles()` decorator with appropriate roles
   - Guard validates role before allowing access

2. **Transaction Safety**
   - All operations in database transaction
   - Rollback on any error
   - Data consistency guaranteed

3. **Duplicate Prevention**
   - Division name uniqueness within company
   - Division code uniqueness within company (if provided)

4. **Input Validation**
   - Comprehensive DTO validation
   - Type checking
   - Format validation

5. **Authorization Checks**
   - Verifies company exists and is active
   - Verifies user has appropriate role and access
   - COMPANY_ADMIN must be admin of the company
   - DIVISION_ADMIN must be admin of the division

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
  "message": "Access denied. Only GROUP_ADMIN or COMPANY_ADMIN of this company can create divisions."
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Company with ID 123e4567-e89b-12d3-a456-426614174000 not found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Division with name \"Engineering Division\" already exists in this company"
}
```

## Usage Example

### cURL

```bash
curl -X POST http://localhost:5000/divisions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "company_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Engineering Division",
    "code": "ENG",
    "description": "Engineering and development division"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:5000/divisions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwtToken}`,
  },
  body: JSON.stringify({
    company_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Engineering Division',
    code: 'ENG',
    description: 'Engineering and development division',
  }),
});

const division = await response.json();
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
✅ **Company Validation** - Verifies company exists and is active

## Relationships

- **Division → Company**: Many-to-one (each division belongs to one company)
- **Division → User (Admin)**: Many-to-one (each division can have one admin)
- **Division → User (Users)**: Many-to-many via `user_roles` table with `division_id` and `DIVISION_USER` role

## Next Steps

To extend this API, you can add:

- GET `/divisions` - List divisions (with pagination and filters)
- GET `/companies/:id/divisions` - Get all divisions for a company
- GET `/divisions/:id/departments` - Get departments in a division
