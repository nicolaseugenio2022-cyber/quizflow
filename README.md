# QuizFlow

Classroom quiz platform for senior high school and college. Teachers manage classes, rosters, quizzes and grades; students join classes, take quizzes with automatic saving, and view released results.

The product and technical specification lives in [`docs/`](./docs). [`docs/source-of-truth.md`](./docs/source-of-truth.md) wins when documents disagree.

## Current status

Phase 1 (Foundation) is in place:

- Next.js 16 App Router with strict TypeScript, Tailwind CSS 4 and shadcn/ui (New York style).
- Minimalist pink glassmorphism design tokens with light, dark and system themes (no theme flash).
- Landing page, sign-in, forgot-password and reset-password screens.
- Teacher (`/teacher/...`) and student (`/student/...`) areas behind a server-side role gate.
- PostgreSQL schema for all core entities, managed with Prisma 7 and an applied `init` migration.
- Shared validation, API response and error types matching `docs/api.md`.
- Unit tests (Vitest) and end-to-end tests (Playwright, desktop and mobile Chromium).

Not built yet: class management, quizzes, attempts, grading and integrity monitoring (phases 2–5), and the `/api/v1` route handlers.

### Authentication

No authentication provider has been selected (an open decision in `docs/source-of-truth.md`). Sign-in goes through an adapter boundary in `src/lib/auth`:

- **Development and CI:** two test accounts from `.env` can sign in (`TEACHER_*` and `STUDENT_*`). The session is a signed, HTTP-only cookie. This adapter is disabled when `NODE_ENV` is `production`.
- **Production:** sign-in and password reset report that they are not available yet. No credentials are faked.

## Requirements

- Node.js 20.19 or later (24 LTS recommended; see `.nvmrc`)
- npm (the repository uses `package-lock.json`)
- PostgreSQL 16 or later, running locally or reachable over the network

## Setup

```powershell
npm install
Copy-Item .env.example .env   # macOS/Linux: cp .env.example .env
```

Edit `.env`:

| Variable                               | Required | Purpose                                                                               |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`                         | Yes      | PostgreSQL connection string used by Prisma and the app                               |
| `TEACHER_USERNAME`, `TEACHER_PASSWORD` | Dev only | Teacher test account (username must be an email)                                      |
| `STUDENT_USERNAME`, `STUDENT_PASSWORD` | Dev only | Student test account (username must be an email)                                      |
| `AUTH_DEV_SESSION_SECRET`              | No       | Signs dev sessions (32+ characters); a random key is used per server start when unset |
| `APP_URL`                              | No       | Public origin for absolute links such as QR join URLs                                 |
| `PLAYWRIGHT_BASE_URL`                  | No       | Run E2E tests against an already running server                                       |

Keep `.env` in the project root and never commit it. Files in `public/` are served to anyone, so never put `.env` there.

Create the database once (for example `CREATE DATABASE quizflow;`), then start the app.

## Development

```powershell
npm run dev
```

This single command:

1. Generates the Prisma client.
2. Checks that PostgreSQL is reachable (`npm run db:check`).
3. Applies committed migrations with `prisma migrate deploy`. It never creates migrations or resets data.
4. Starts Next.js, which serves pages and `/api` route handlers, at **http://localhost:3000**.

Press `Ctrl+C` to stop. If PostgreSQL is not running, the command stops with a message such as `[db] PostgreSQL is not reachable...` and never prints connection details. Start PostgreSQL yourself; the scripts do not start or stop database services.

### Database commands

| Command                                 | What it does                                                               |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `npm run db:check`                      | Connects, runs a minimal query and reports applied migrations              |
| `npm run db:migrate:deploy`             | Applies committed migrations (safe for any environment)                    |
| `npm run db:migrate -- --name <change>` | Creates a new migration from schema changes (development only; may prompt) |
| `npm run db:status`                     | Shows migration status                                                     |
| `npm run db:generate`                   | Regenerates the Prisma client into `src/generated/prisma`                  |
| `npm run db:format` / `db:format:check` | Formats or checks `prisma/schema.prisma`                                   |
| `npm run db:validate`                   | Validates the Prisma schema                                                |
| `npm run db:studio`                     | Opens Prisma Studio (never started automatically)                          |

There is no reset script. To start over, drop and recreate the database yourself, then run `npm run dev`.

## Scripts

| Command                                      | What it does                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `npm run build` / `npm start`                | Production build and server                                                  |
| `npm run lint` / `lint:fix`                  | ESLint                                                                       |
| `npm run typecheck`                          | Generates route types, then runs `tsc --noEmit`                              |
| `npm run format` / `format:check`            | Prettier (with the Tailwind class sorter)                                    |
| `npm test` / `test:watch`                    | Vitest unit tests in `tests/unit`                                            |
| `npm run test:e2e`                           | Playwright tests in `tests/e2e` (starts `npm run dev` unless one is running) |
| `npm run test:e2e:ui`                        | Watch and step through E2E tests interactively                               |
| `npm run test:e2e:headed` / `test:e2e:debug` | Run E2E in a visible browser or with the inspector                           |
| `npm run test:e2e:report`                    | Open the last HTML report (`playwright-report/`)                             |

Run one unit test file: `npx vitest run tests/unit/roles.test.ts`. Run one E2E spec or test: `npx playwright test tests/e2e/theme.spec.ts --project=desktop-chromium` or add `-g "persist after reload"`.

First-time E2E setup: `npx playwright install chromium`. Playwright is pinned to 1.63.0 because the browser build for 1.64.0 was not yet downloadable when this was set up.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests, pushes to `main` and manual dispatch. It uses an isolated `postgres:18` service container with CI-only credentials and never touches local or production databases.

Checks, in order: `npm ci`, Prisma format check, validate and generate, `prisma migrate deploy`, database check, Prettier, ESLint, type-check, unit tests, production build, then Playwright E2E (desktop and mobile Chromium).

When E2E tests fail, the run's **Artifacts** section has `playwright-report` (HTML report) and `playwright-test-results` (traces, screenshots and videos), kept for 14 days.

Deployment is not configured. It will be added once a hosting provider is selected.

## Project structure

Colocation-first App Router layout (see `docs/project.md`, "Source layout"):

```text
src/
  app/
    (external)/          login, forgot-password, reset-password (+ _components, _actions)
    (teacher-admin)/     teacher/... pages; layout is the TEACHER_ADMIN gate
    (student)/           student/... pages; layout is the STUDENT gate
    _components/         landing-page pieces
  components/
    ui/                  shadcn/ui primitives
    react-bits/          React Bits components (official registry, adapted)
    layout/ theme/       app shell, navigation, theme provider and toggle
  lib/
    auth/                adapter boundary, role gate, dev test accounts
    db/                  Prisma client (server-only, reused across dev reloads)
    env/                 server environment validation (never sent to the browser)
    permissions/         roles (TEACHER_ADMIN, STUDENT) and access decisions
    validation/ api/     Zod schemas, response envelopes, error codes
  navigation/            role navigation config
  proxy.ts               sends visitors without a session to /login
prisma/                  schema.prisma and migrations
scripts/check-db.ts      database check used by `npm run dev` and CI
tests/unit, tests/e2e    Vitest and Playwright
```

## Third-party notices

`src/components/react-bits/blur-text.tsx` is adapted from [React Bits](https://reactbits.dev) by David Haz, used under the MIT + Commons Clause license. The license notice is kept in the file header.
