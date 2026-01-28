# Auth API Documentation

## Signup API

### Endpoint

```
POST /auth/signup
```

### Request Body

```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePassword123!",
  "company_group": {
    "name": "Acme Corporation",
    "code": "ACME",
    "description": "Leading technology company"
  }
}
```

### Field Validations

**User Fields:**

- `email`: Required, valid email format, unique
- `phone`: Optional, max 20 characters
- `first_name`: Required, 2-100 characters
- `last_name`: Optional, max 100 characters
- `password`: Required, 8-255 characters

**Company Group Fields:**

- `name`: Required, 2-255 characters, unique
- `code`: Optional, max 50 characters, unique (if provided)
- `description`: Optional, text

### Success Response (201 Created)

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-01-28T10:00:00.000Z"
  },
  "company_group": {
    "id": "uuid",
    "name": "Acme Corporation",
    "code": "ACME",
    "is_active": true,
    "created_at": "2026-01-28T10:00:00.000Z"
  },
  "message": "Signup successful. Please verify your email to activate your account."
}
```

### Error Responses

**409 Conflict - Email Already Exists**

```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

**409 Conflict - Company Group Name Exists**

```json
{
  "statusCode": 409,
  "message": "Company group with this name already exists"
}
```

**409 Conflict - Company Group Code Exists**

```json
{
  "statusCode": 409,
  "message": "Company group with this code already exists"
}
```

**400 Bad Request - Validation Error**

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

**500 Internal Server Error**

```json
{
  "statusCode": 500,
  "message": "An error occurred during signup"
}
```

## Features

✅ **Database Transaction**: All operations (user + company_group) are wrapped in a transaction
✅ **Automatic Rollback**: If any step fails, all changes are rolled back
✅ **Password Hashing**: Passwords are securely hashed using bcrypt (10 rounds)
✅ **Input Validation**: Comprehensive validation using class-validator
✅ **Error Handling**: Proper error handling with appropriate HTTP status codes
✅ **Logging**: All operations are logged for debugging and audit
✅ **Type Safety**: Full TypeScript type safety throughout

## Security Features

- Passwords are never returned in responses
- Passwords are hashed with bcrypt (salt rounds: 10)
- Input validation prevents SQL injection
- Transaction ensures data consistency
- Soft delete support (checks deleted_at)

## Example cURL Request

```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePassword123!",
    "company_group": {
      "name": "Acme Corporation",
      "code": "ACME",
      "description": "Leading technology company"
    }
  }'
```
