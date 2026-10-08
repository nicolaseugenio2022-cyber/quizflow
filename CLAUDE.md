# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

npm only (`package-lock.json`). Requires PostgreSQL running and `DATABASE_URL` in the root `.env`.

- `npm run dev`: `predev` runs Prisma generate, `db:check` and `prisma migrate deploy`, then starts Next.js at http://localhost:3000.
- `npm run lint` · `npm run typecheck` (runs `next typegen` first; plain `tsc` fails on `LayoutProps` without it) · `npm run format:check` · `npm run build`
- `npm test`: Vitest, `tests/unit`. One file: `npx vitest run tests/unit/roles.test.ts`.
- `npm run test:e2e`: Playwright, `tests/e2e`, desktop and mobile Chromium; starts `npm run dev` itself unless a server is already up. One test: `npx playwright test tests/e2e/theme.spec.ts --project=desktop-chromium -g "persist"`.
- Schema changes: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name <change>`. Never use `migrate reset` or `db push --force-reset`.

## Documentation is the spec

All requirements live in `docs/`. When documents disagree, this precedence wins:

1. `docs/source-of-truth.md`: accepted decisions, invariants, scope, **open decisions**
2. `docs/project.md`: product spec, pages, flows, source layout, acceptance scenarios, definition of done
3. `docs/api-route.md`: route inventory, access rules, status-code policy
4. `docs/api.md`: TypeScript request/response contracts, error codes, idempotency, concurrency
5. `docs/diagrams.md`: Mermaid diagrams (data model, sequences, attempt state machine)

- Never change a requirement in code alone. Update `source-of-truth.md` (and dependent docs) in the same change.
- Before touching an **Open decision** (auth/email provider, Supabase, invite defaults, autosave timings, release modes, late policy, retention, hosting), get an explicit decision from the user and record it.
- Vendor choices are unselected: isolate them behind small adapters. The installed `supabase` skill does not select Supabase.

## Architecture (spread across several files)

- **Layout:** colocation-first `src/` (docs/project.md "Source layout"). Route-only UI in `_components`, route-only server actions in `_actions`. Never import another route's private folder; promote shared code to `src/components` or `src/lib`. shadcn primitives live in `src/components/ui`.
- **Roles and routes:** exactly `TEACHER_ADMIN` and `STUDENT` (`src/lib/permissions/roles.ts`, mirrored by the Prisma `UserRole` enum and a unit test). Route groups cannot share a URL, so pages live under `/teacher/...` and `/student/...`. Each group layout calls `RoleLayout` (`src/components/layout/role-layout.tsx`), which runs `requireRole` inside `<Suspense>` and sets `instant = false`. `src/proxy.ts` only redirects visitors with no session cookie; it is not authorization.
- **Auth boundary:** `src/lib/auth/index.ts` picks the adapter. `dev-credentials-adapter.ts` (`.env` test accounts, signed cookie) runs only when `NODE_ENV !== "production"`. Otherwise `unconfigured-adapter.ts` applies. Add a real provider as another `AuthAdapter` and add its cookie to `session-cookie.ts`.
- **Cache Components is on** (`next.config.ts`). Anything reading cookies or the session must sit inside `<Suspense>`. `getCurrentUser()` calls `connection()`. Forms read `returnTo` and the reset `token` client-side so their pages stay static.
- **Database:** Prisma 7 with the `prisma-client` generator, output to `src/generated/prisma` (gitignored; import from `@/generated/prisma/client`). Use `getDb()` from `src/lib/db`, which is server-only and a global singleton. Scripts outside Next use `createPrismaClient` plus `parseServerEnv`, because `server-only` throws under plain Node. History-bearing relations use `onDelete: Restrict`.
- **API:** route handlers go in `src/app/api/v1/**/route.ts`. Keep them thin: authenticate, validate with Zod, call a `src/lib` service, then return `jsonData`, `jsonPage` or `jsonError` (`src/lib/api`). Never serialize Prisma models directly. Students never receive answer keys or unreleased grades.
- **Contracts to keep:** autosave uses `baseVersion` with `409 VERSION_CONFLICT`. Submit, reopen, publish and regrade take an `Idempotency-Key` (`IdempotencyRecord` model). The server clock decides deadlines. Integrity events are append-only and never change a score. Invite and reset tokens are stored only as hashes.

## Gotchas

- Next.js keeps the previous route mounted but hidden after client navigation. In Playwright, use the `field()` helper in `tests/e2e/fixtures.ts` or role locators, never a bare `getByLabel`.
- The dev server blocks dev assets for unknown hostnames. `127.0.0.1` is allowed in `allowedDevOrigins` for Playwright.
- Client components that branch on browser-only state (reduced motion, theme) must match server output on the first render. Use the `useSyncExternalStore` "hydrated" pattern, as in `blur-text.tsx` and `theme-toggle.tsx`.
- npm 12 blocks install scripts unless they are listed in `allowScripts` (package.json). Re-approve after bumping `prisma`, `@prisma/engines` or `esbuild`.
- Playwright is pinned to 1.63.0 until the 1.64 Chromium build is downloadable.
- Add React Bits components only through `npx shadcn@latest add @react-bits/<Name>-TS-TW`. Then move them to `src/components/react-bits/`, keep the license header, and add reduced-motion handling.

## UI direction

Minimalist pink glassmorphism on a neutral canvas. Tokens are in `src/app/globals.css`: `.glass` and `.glass-strong` for chrome, `.surface` for dense content, `.aura` for the background. Fonts are Bricolage Grotesque for display and Atkinson Hyperlegible Next for body. Meet WCAG 2.2 AA, support reduced motion and reduced transparency, and never use color as the only signal. Keep the quiz attempt view calm.

## Definition of done

See `docs/project.md`, "Definition of done": server-side permissions and validation; all loading, empty, error, offline and success states; both themes and responsive widths; keyboard and screen-reader checks; unit plus Playwright coverage; a migration with rollout notes; docs updated for any API or product decision.
