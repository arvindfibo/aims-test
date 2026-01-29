# Companies API

## Overview

Production-ready company creation API with role-based access control. Only `GROUP_ADMIN` users can create companies.

## Files Created

1. **Entity**: `src/entities/company.entity.ts`
   - TypeORM entity matching database schema
   - All fields from migration included
   - Proper relationships with CompanyGroup and User

2. **DTOs**: `src/companies/dto/create-company.dto.ts`
   - `CreateCompanyDto` - Request DTO with validation
   - `CompanyResponseDto` - Response DTO
   - Comprehensive validation rules (PAN, GSTIN, email, URL, etc.)

3. **Service**: `src/companies/companies.service.ts`
   - Business logic for company creation
   - Transaction support
   - Duplicate checking (name, registration, PAN, GSTIN)
   - Error handling

4. **Controller**: `src/companies/companies.controller.ts`
   - RESTful endpoint
   - Swagger documentation
   - Role-based access control

5. **Module**: `src/companies/companies.module.ts`
   - NestJS module configuration

## API Endpoint

### Create Company

**POST** `/companies`

**Authorization**: Required (JWT Bearer Token)

**Role Required**: `GROUP_ADMIN`

**Request Body**:

```json
{
  "company_group_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Acme Corporation",
  "legal_name": "Acme Corporation Private Limited",
  "company_type": "internal",
  "registration_number": "U12345AB2023PTC123456",
  "pan": "ABCDE1234F",
  "gstin": "27ABCDE1234F1Z5",
  "email": "contact@acme.com",
  "website": "https://www.acme.com",
  "phone": "+91-9876543210",
  "address_line1": "123 Business Park",
  "address_line2": "Sector 5",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001",
  "company_admin_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_active": true
}
```

**Response** (201 Created):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "company_group_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Acme Corporation",
  "legal_name": "Acme Corporation Private Limited",
  "company_type": "internal",
  "registration_number": "U12345AB2023PTC123456",
  "pan": "ABCDE1234F",
  "gstin": "27ABCDE1234F1Z5",
  "email": "contact@acme.com",
  "website": "https://www.acme.com",
  "phone": "+91-9876543210",
  "address_line1": "123 Business Park",
  "address_line2": "Sector 5",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001",
  "is_active": true,
  "is_verified": false,
  "company_admin_user_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## Validation Rules

### Required Fields

- `company_group_id` (UUID)
- `name` (string, max 255 chars)

### Optional Fields with Validation

- `pan`: Must be exactly 10 characters, format: `ABCDE1234F`
- `gstin`: Must be exactly 15 characters, valid GSTIN format
- `email`: Must be valid email format
- `website`: Must be valid URL
- `phone`: Max 20 characters
- `company_type`: Enum (`govt`, `vendor`, `internal`)

## Security Features

1. **Role-Based Access Control**
   - Only `GROUP_ADMIN` can create companies
   - Uses `@Roles('GROUP_ADMIN')` decorator
   - Guard validates role before allowing access

2. **Transaction Safety**
   - All operations in database transaction
   - Rollback on any error
   - Data consistency guaranteed

3. **Duplicate Prevention**
   - Company name uniqueness within company group
   - Registration number uniqueness
   - PAN uniqueness
   - GSTIN uniqueness

4. **Input Validation**
   - Comprehensive DTO validation
   - Type checking
   - Format validation (PAN, GSTIN, email, URL)

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["PAN must be in format: ABCDE1234F"],
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
  "message": "Access denied. Required roles: GROUP_ADMIN. User has roles: COMPANY_USER"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Company group with ID 123e4567-e89b-12d3-a456-426614174000 not found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Company with name \"Acme Corporation\" already exists in this company group"
}
```

## Usage Example

### cURL

```bash
curl -X POST http://localhost:5000/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "company_group_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Acme Corporation",
    "company_type": "internal",
    "email": "contact@acme.com"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:5000/companies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwtToken}`,
  },
  body: JSON.stringify({
    company_group_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Acme Corporation',
    company_type: 'internal',
    email: 'contact@acme.com',
  }),
});

const company = await response.json();
```

## Production Features

✅ **Transaction Support** - All operations in database transaction  
✅ **Error Handling** - Comprehensive error handling with proper HTTP status codes  
✅ **Validation** - Input validation with class-validator  
✅ **Type Safety** - Full TypeScript type safety  
✅ **Logging** - Structured logging for debugging  
✅ **Swagger Documentation** - Auto-generated API documentation  
✅ **Role-Based Access** - Only GROUP_ADMIN can create companies  
✅ **Duplicate Prevention** - Checks for duplicates before creation  
✅ **Audit Fields** - Tracks created_by and updated_by  
✅ **Soft Delete Support** - Uses deleted_at for soft deletes

## Next Steps

To extend this API, you can add:

- GET `/companies` - List companies (with pagination)
- GET `/companies/:id` - Get company details
- PUT `/companies/:id` - Update company
- DELETE `/companies/:id` - Delete company (soft delete)
- GET `/companies/:id/divisions` - Get company divisions
