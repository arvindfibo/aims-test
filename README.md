# AIMS Backend (NestJS)

NestJS backend developer guide with pnpm, strict linting/formatting, Conventional Commits, and CI quality gates.

## Quickstart

### macOS / Linux

```bash
cp .env.example .env
pnpm install
pnpm start:dev
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
pnpm install
pnpm start:dev
```

### Windows CMD

```cmd
copy .env.example .env
pnpm install
pnpm start:dev
```

## Prerequisites

- Node.js 20 LTS (or newer)
- pnpm 10+
- Git

Verify:

```bash
node -v
pnpm -v
git --version
```

## Environment Setup

- Copy `.env.example` to `.env` and fill in required values.
- Never commit `.env` to version control.

## Install & Run

```bash
pnpm install
pnpm start:dev
```

Build and run production:

```bash
pnpm build
pnpm start:prod
```

## Docker (dev)

Make sure `.env` exists (copy from `.env.example`) before running containers.

### Option A: Postgres only (backend runs locally)

Start Postgres:

```bash
pnpm db:up
```

Run backend locally:

```bash
pnpm start:dev
```

Migrations/seed (local):

```bash
pnpm migration:run
pnpm seed
pnpm seed:role
```

Optional DB sanity check:

```bash
pnpm db:test
```

Stop Postgres:

```bash
pnpm db:down
```

### Option B: Full app (prod-like build in Docker)

Start API + Postgres:

```bash
pnpm full:rebuild
```

Migrations/seed (inside container):

```bash
pnpm full:migrate
pnpm full:seed
```

Stop:

```bash
pnpm full:down
```

Handy extras:

```bash
pnpm full:logs
pnpm db:reset
pnpm full:reset
pnpm full:migrate:seed
```

## Scripts Reference

- `pnpm lint` — ESLint (fails on warnings)
- `pnpm lint:fix` — ESLint auto-fix
- `pnpm format` — Prettier write
- `pnpm format:check` — Prettier check
- `pnpm typecheck` — TypeScript typecheck (no emit)
- `pnpm test` — unit tests
- `pnpm test:e2e` — end-to-end tests
- `pnpm build` — NestJS build
- `pnpm commit` — interactive Conventional Commit

## Code Quality & Formatting

On every commit, staged files are automatically checked:

- **ESLint** runs on staged TS/JS and auto-fixes where possible
- **Prettier** formats staged code and docs
- The commit is blocked if lint/format fails

Run checks manually:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
```

## Git Workflow

Recommended flow:

```bash
git checkout -b feat/short-description
pnpm lint
pnpm test
pnpm commit
git push -u origin feat/short-description
```

Open a pull request and ensure CI is green before merging.

## Commit Standards (Conventional Commits)

Use the interactive commit flow:

```bash
pnpm commit
```

Examples:

```
feat(auth): add refresh token rotation
fix(users): handle null profile
chore(ci): tighten lint rules
```

Commit messages are validated by commitlint. Invalid messages are rejected.

## Troubleshooting

**Husky hooks not running**

- Reinstall hooks: `pnpm install`
- Ensure Git hooks path is not overridden:
  - `git config --get core.hooksPath` should be empty or `.husky`

**CI fails with frozen lockfile**

- Run `pnpm install` locally and commit `pnpm-lock.yaml`

**Lint/format errors**

- Run `pnpm lint:fix` and `pnpm format`

**Windows shell issues**

- Use PowerShell or CMD commands above
- If hooks fail in CMD, try running Git Bash for Git-related tasks

## Repository Notes

- pnpm is required for installs and scripts
