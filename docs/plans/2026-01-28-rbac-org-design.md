# RBAC Org Structure Design (AIMS)

Date: 2026-01-28

## Summary

Build a NestJS + Prisma backend with hierarchical org structure (company group -> company -> division -> department) and company-owned tenders/projects. Access control is role-based with permissions stored in normalized tables and inherited down the hierarchy. Soft deletes apply to all tables. Redis is used for short-lived permission caching.

## Goals

- Model the org hierarchy with strong referential integrity.
- Enforce one role per user per resource (per membership table).
- Support role inheritance down the hierarchy.
- Store permissions in DB using normalized resources/actions/permissions tables.
- Provide CRUD APIs with authorization checks in NestJS guards.
- Apply soft delete across all tables.
- Use Redis to cache effective permissions.

## Non-goals (for now)

- Attribute-based access control (ABAC).
- Fine-grained field-level permissions.
- Complex workflow states beyond basic actions.

## Data Model

### Core entities

- users
- company_groups
- companies (belongs to company_group)
- divisions (belongs to company)
- departments (belongs to company + division)
- tenders (belongs to company)
- projects (belongs to company)

### Membership tables (one role per user per resource)

- company_group_users
- company_users
- division_users
- department_users
- tender_users
- project_users

Each membership table has: id, user_id, resource_id, role_id, created_at, updated_at, deleted_at.

### RBAC tables

- roles
- resources
- actions
- permissions (role_id, resource_id, action_id)

### Soft delete

All tables include deleted_at (and usual created_at/updated_at). Queries default to deleted_at IS NULL.

### Constraints and indexes

- One active membership per user per resource: enforce via partial unique index on (user_id, resource_id) where deleted_at IS NULL.
- Foreign keys enforce hierarchy integrity.
- Indexes on membership tables for (resource_id, user_id) and (user_id).
- Index on permissions for (role_id, resource_id, action_id).

## RBAC Model

### Roles

- GROUP_ADMIN
- COMPANY_ADMIN, COMPANY_USER
- DIVISION_ADMIN, DIVISION_USER
- DEPARTMENT_ADMIN, DEPARTMENT_USER
- TENDER_ADMIN, TENDER_USER
- PROJECT_ADMIN, PROJECT_USER

### Resources

- company_group, company, division, department, tender, project

### Actions

- create, read, update, delete
- manage_members, assign_admin, approve_tender, deactivate_entity

### Permission mapping

Permissions are stored per role and per resource. Example: COMPANY_ADMIN has full actions on company, division, department, tender, project; COMPANY_USER has read on those resources. This allows inheritance to apply consistently.

## Inheritance Rules

- A user can have at most one active role per resource membership.
- Roles inherit down the hierarchy. Effective access for a target resource is computed by:
  1. fetching memberships at the target resource and all ancestors,
  2. collecting their roles,
  3. unioning actions from permissions for those roles and the target resource type.

## Authorization Flow (NestJS)

- JWT auth guard sets current user.
- Permissions guard reads required actions from route metadata.
- Guard resolves target resource type and id from params/body.
- AccessControlService computes effective permissions (with Redis cache).
- Guard allows/denies based on required actions.

## API Surface (v1)

- CRUD for company_groups, companies, divisions, departments, tenders, projects.
- Membership endpoints: add/update/remove member per resource.
- Admin-only actions use explicit permissions such as manage_members or assign_admin.

## Caching (Redis)

- Cache effective permissions by key: user_id:resource_type:resource_id.
- TTL 2-5 minutes.
- Invalidate on membership/role/permission changes.
- Fallback to no cache when Redis unavailable.

## Error Handling

- Use NestJS HttpExceptions.
- 404 for missing/soft-deleted resources.
- 403 for permission denial.
- 409 for duplicate membership conflicts.

## Testing Strategy

- Unit tests: AccessControlService (inheritance, union of permissions), seed mapping.
- Integration tests: Prisma queries + soft delete behavior.
- E2E tests: create hierarchy, assign roles, verify inherited access and denial.

## Migration and Seeding

- Prisma schema for all entities.
- Seed roles, resources, actions, permissions, and optional bootstrap admin.
- Use custom SQL in migration for partial unique indexes (soft delete uniqueness).

## Risks / Mitigations

- Soft delete uniqueness: require partial unique index and app-level checks.
- Permission explosion: mitigate by seeding baseline CRUD + extras only.

## Future Extensions

- Fine-grained action expansion (e.g., approve_project).
- User role upgrades to limited CRUD without schema changes.
