# QuizFlow Project Specification

## Overview

QuizFlow is a classroom quiz platform for senior high school and college. It gives teachers one place to organize classes, enroll students, deliver quizzes, monitor integrity signals, and manage grades. It gives students a focused quiz experience that preserves their work through refreshes, unstable connections, and device interruptions.

The authoritative decisions and unresolved questions are maintained in [source-of-truth.md](./source-of-truth.md).

## Problem

Teachers often combine forms, spreadsheets, chat messages, and manual checking to run assessments. That creates duplicated enrollment work, inconsistent grading, weak recovery when a student's connection fails, and little context when suspicious behavior occurs. Students need a reliable flow that clearly communicates saving, timing, submission, and result status.

QuizFlow unifies that workflow while remaining simple enough for everyday classroom use.

## Product outcomes

- A teacher can create a class and make it ready for students in minutes.
- A student can join the correct class through a QR code without exposing private identifiers.
- A teacher can publish an automatically graded quiz without using a separate spreadsheet.
- A student's acknowledged answers survive refreshes, reconnects, and reopening the browser.
- A teacher can review a concise integrity timeline without treating browser events as proof of cheating.
- Both roles can use the core workflow on a phone or desktop in light or dark mode.

## Personas

### Teacher/Admin

A senior high school or college instructor who also administers the classes they own. They need fast roster management, clear quiz controls, trustworthy grading, and a reviewable record of unusual attempt activity. This combined role is represented by `TEACHER_ADMIN`.

Primary jobs:

- Set up classes and rosters.
- Prepare and schedule quizzes.
- Track participation and submissions.
- Review automatic grades and responses needing attention.
- Resolve grade exceptions with an audit trail.

### Student

An enrolled learner who often uses a phone or shared network. They need a clear list of assigned quizzes, confidence that answers are saved, fair timing, straightforward recovery, and understandable results.

Primary jobs:

- Join the intended class.
- Find available and upcoming quizzes.
- Complete a quiz without losing work.
- Resume an interrupted attempt.
- Confirm submission and view released results.

## Information architecture

### Shared pages

| Page | Purpose |
| --- | --- |
| Landing | Explain QuizFlow and direct users to sign in or create an account |
| Login | Authenticate teacher/admin and student users with email and password |
| Forgot password | Request a password-reset link without revealing whether the email exists |
| Reset password | Set a new password using a valid, single-use reset link |
| Profile and settings | Update profile, accessibility preferences, and theme |
| Join class | Resolve a QR invite and confirm registration |

### Teacher/Admin pages

| Page | Purpose |
| --- | --- |
| Dashboard | Show active classes, quizzes needing attention, and recent activity |
| Classes | List, create, filter, and archive classes |
| Class overview | Show roster, quizzes, and class activity |
| Roster | Add students manually and manage enrollment status |
| Class invite | Generate, display, download, or revoke the QR invite |
| Quiz builder | Edit quiz settings, questions, answers, points, and schedule |
| Word import review | Review parsed questions, warnings, and unrecognized content before adding them to a draft |
| Quiz preview | Verify the exact student-facing experience before publication |
| Quiz results | Review submissions, scores, and completion state |
| Attempt review | Inspect answers, integrity events, and grade history |

### Student pages

| Page | Purpose |
| --- | --- |
| Dashboard | Show current classes, due quizzes, and recent results |
| Class detail | Show assigned quizzes and class information |
| Quiz instructions | Explain availability, duration, attempts, and integrity monitoring |
| Quiz attempt | Answer questions, monitor save state, and submit |
| Recovery | Resume the latest valid attempt and reconcile queued changes |
| Result | Show status, score, and allowed answer review after release |

### Primary navigation

Each signed-in role has a fixed set of top-level tabs. Every tab opens a real page; detail pages such as class overview, quiz builder, attempt review, and result open from within these areas.

| Role | Tabs, in order |
| --- | --- |
| Teacher/Admin | Dashboard (`/teacher/dashboard`), Classes (`/teacher/classes`), Students (`/teacher/students`), Quizzes (`/teacher/quizzes`), Results (`/teacher/results`), Integrity (`/teacher/integrity`) |
| Student | Dashboard (`/student/dashboard`), Classes (`/student/classes`), Quizzes (`/student/quizzes`), Results (`/student/results`) |

Teacher/admin Students gathers rosters, manual enrollment, and enrollment status; Quizzes gathers authoring, Word import, scheduling, and publication; Results gathers submissions, grading, overrides, and result release; Integrity gathers attempt-event summaries and review timelines. Student Quizzes lists upcoming, available, in-progress, and completed quizzes; student Results lists released grades and permitted answer review. A role never sees the other role's tabs.

Until a tab's delivery phase ships, its page shows a shared UI preview state that lists the planned capabilities without sample data, and every signed-in screen shows a preview-mode notice beneath the navigation. Remove the notice once the initial release is complete.

## Main user flows

### User logs in

1. User opens the login page and enters their email and password.
2. QuizFlow validates the credentials without revealing which field was incorrect.
3. On success, QuizFlow establishes the authenticated session.
4. QuizFlow returns the user to a safe local `returnTo` destination, such as a class invite, or to the role-appropriate dashboard.

### User resets a forgotten password

1. User selects **Forgot password?** on the login page.
2. User submits their email address.
3. QuizFlow always shows the same confirmation message to prevent account discovery.
4. If the account exists, QuizFlow emails a time-limited, single-use reset link.
5. User opens the link, enters and confirms a new password, and submits it.
6. QuizFlow consumes the token, updates the password, invalidates applicable existing sessions, and returns the user to login with a success message.
7. Invalid, expired, or used links show a clear state with an option to request another link.

### Teacher/admin creates a class and enrolls students

1. Teacher selects **New class**.
2. Teacher enters class name, subject, academic level, school year, and term.
3. QuizFlow creates the class and opens its overview.
4. Teacher either searches for an existing student to enroll manually or opens **Class invite**.
5. For QR registration, QuizFlow creates an expiring invite and renders its join URL as a QR code.
6. The roster updates after each successful enrollment.

### Student joins through QR

1. Student scans the QR code.
2. If necessary, QuizFlow asks the student to sign in and then returns to the invite.
3. QuizFlow displays the teacher, class, subject, and invite validity.
4. Student confirms registration.
5. QuizFlow creates or restores the active enrollment and opens the class.

### Teacher/admin publishes a quiz

1. Teacher creates a quiz within a class.
2. Teacher enters instructions and availability settings.
3. Teacher adds questions in the form-style editor or imports them from a `.docx` file.
4. Teacher reviews question types, possible answers, answer keys, points, and import warnings.
5. Teacher previews the quiz in the student layout.
6. QuizFlow validates that the quiz is complete and publishable.
7. Teacher publishes; QuizFlow creates the published version used by new attempts.

### Teacher/admin imports questions from Word

1. Teacher selects **Import Word document** from an editable quiz draft.
2. QuizFlow accepts a `.docx` file within the configured size limit and creates an import operation.
3. The server extracts text and supported structure, then proposes question types, prompts, choices, answer keys, and points.
4. QuizFlow opens an import review screen showing parsed questions, confidence, warnings, and unparsed sections.
5. Teacher edits, excludes, or reorders proposed questions and resolves required warnings.
6. Teacher confirms the import.
7. QuizFlow transactionally appends the confirmed questions to the draft and records the import result.
8. Teacher continues editing in the same form-style quiz builder before previewing or publishing.

### Student takes and submits a quiz

1. Student opens the quiz instructions and sees availability, time limit, attempt count, and monitoring notice.
2. Student starts or resumes the attempt.
3. Answer changes save automatically; the interface communicates pending, saved, and offline states.
4. QuizFlow records supported integrity events in the background.
5. Student reviews unanswered questions and submits.
6. QuizFlow confirms submission, grades objective responses, and shows the result state allowed by the teacher's release policy.

### Teacher/admin reviews an attempt

1. Teacher opens quiz results and filters by submission or review status.
2. Teacher selects an attempt.
3. QuizFlow shows responses, automatic scoring, a compact integrity summary, and the chronological event timeline.
4. Teacher reviews responses that need manual grading.
5. Any override requires a reason and creates an audit record.
6. Teacher releases or republishes the result according to policy.

## Functional requirements

### Accounts and access

- The system must authenticate every teacher/admin and student.
- The system must provide dedicated login, forgot-password, and reset-password pages.
- The login page must include email, password, show-or-hide password, **Forgot password?**, and submit controls with accessible labels.
- Failed login must use a generic credential error and must not reveal whether the email exists.
- A forgot-password submission must always return the same user-facing confirmation.
- Reset links must be time-limited, single-use, stored as hashes, and invalidated after a successful reset.
- The reset form must validate password policy and matching confirmation while keeping the new password out of logs and URLs.
- The system must enforce role and resource ownership on the server.
- A student must not access answer keys, other students' attempts, or unreleased grades.
- A teacher/admin must not access a class owned by another teacher/admin.
- The interface must return users to their intended invite or quiz after sign-in when safe.

### Classes and enrollment

- Teachers can create, edit, list, and archive classes.
- Teachers can view active and inactive enrollments.
- Teachers can enroll an existing student manually without creating duplicates.
- Teachers can remove or deactivate an enrollment without deleting historical attempts.
- Teachers can create, revoke, and replace QR registration invites.
- Invites can expire and optionally enforce a usage limit.
- Students can inspect class identity before confirming registration.

### Quiz authoring

- Teachers can save a quiz as a draft.
- Teachers can add, edit, reorder, duplicate, and remove question cards in a Google Forms-style editor.
- Questions support text prompts, choices where applicable, points, required state, and answer rules.
- Teachers can upload a `.docx` file and review its proposed conversion into supported QuizFlow questions.
- The import review supports editing, excluding, and reordering proposals before applying them.
- Import warnings identify missing answers, ambiguous structures, unsupported content, and invalid values.
- Applying an import does not publish the quiz or replace existing draft questions.
- Quiz settings include availability, duration, allowed attempts, question and option shuffling, and result-release policy.
- Publication validation reports actionable errors at the affected field or question.
- A preview uses the same presentation rules as the student attempt.

### Attempt experience

- The attempt view shows quiz title, question navigation, answered state, remaining time, save state, and submit action.
- Autosave preserves each change and retries temporary failures.
- Students can continue editing while temporarily offline, subject to the authoritative deadline.
- Recovery restores the latest server state and reconciles locally queued changes.
- Submission warns about unanswered required questions without trapping the student.
- Repeated submission requests return the same final attempt state.
- After submission, the interface becomes read-only.

### Grading and results

- The server automatically grades supported objective answers.
- Attempts with review-required responses are clearly separated from fully graded attempts.
- Teachers can adjust a response score or total through an audited override.
- Score displays include earned points, possible points, and percentage when possible points are greater than zero.
- Students see only results currently released to them.
- Regrading requires an explicit action and preserves prior grade history.

### Integrity monitoring

- Students receive a plain-language notice before starting a monitored attempt.
- The client records only the approved browser and connection events.
- Events are buffered and submitted in small batches without interrupting answer entry.
- Teachers see event counts, severity cues, and a chronological timeline.
- The UI explains that events require context and are not automatic misconduct findings.

### Themes and accessibility

- Support `light`, `dark`, and `system` theme settings.
- The first visit uses the system preference until the user chooses a mode.
- Persist the user's choice and avoid a theme flash during page load.
- Core workflows must be keyboard operable.
- Inputs, errors, dialogs, timers, save states, and toasts must have accessible names and announcements.
- Do not use color as the sole indicator of correctness, save state, urgency, or integrity severity.
- Respect reduced-motion and reduced-transparency preferences.

## Visual and interaction direction

The product uses minimalist pink glassmorphism. The look should feel polished and academic rather than playful or clinical.

### Foundation

- Use neutral page backgrounds with subtle pink atmospheric accents.
- Use glass surfaces for navigation, summary panels, modals, and selected cards where transparency improves hierarchy.
- Keep dense content such as rosters, question editors, and result tables on more opaque surfaces for readability.
- Use one primary pink scale with semantic success, warning, and error colors.
- Prefer generous whitespace, concise labels, and clear type scale over ornamental decoration.
- Use rounded geometry consistently, following shadcn/ui New York proportions.

### Quiz attempt guardrails

- Keep the prompt and answer controls visually dominant.
- Keep the timer visible but calm until urgency thresholds are reached.
- Make save status persistent and compact.
- Avoid looping background effects and large animated decorations.
- Confirm submission in a dialog that summarizes unanswered questions.
- When offline, explain that changes remain on the device and will sync when possible.

### Component sources

- Use shadcn/ui with the New York style for accessible primitives and product controls.
- Add React Bits components individually through the official `@react-bits` shadcn registry or an official configured MCP. Use the TypeScript + Tailwind (`TS-TW`) variant and select components from their official documentation.
- Adapt all imported components to the QuizFlow tokens, accessibility requirements, and reduced-motion behavior.
- Do not let a third-party component dictate data access, authorization, or business logic.

React Bits installation convention:

```powershell
npx shadcn@latest add @react-bits/BlurText-TS-TW
```

`BlurText` is an example. Replace it with the exact component name selected from [React Bits](https://reactbits.dev/). Do not install an npm package named `react-bits`; add only the official registry components the interface actually uses and retain their required attribution.

### Claude implementation workflow

Claude is the primary implementer and UI/UX designer. Its approved plugins are `superpower`, `frontend-design`, `playwright`, and `obsidian`. Its approved skills include `ui-ux-pro-max`, `supabase`, and other installed skills that are relevant to a specific task.

- Use `superpower` to support planning, debugging, implementation, and verification discipline.
- Use `frontend-design` together with `ui-ux-pro-max` for the visual system, page composition, responsive states, accessibility, and interaction details.
- Use `playwright` to exercise critical browser journeys, including login, password reset, QR registration, quiz autosave and recovery, submission, grading, and theme behavior.
- Use `obsidian` to navigate and maintain the Markdown documentation without creating a second source of truth.
- Use the `supabase` skill only for work that actually involves Supabase. Its availability does not select Supabase or override the Prisma/PostgreSQL architecture.
- Adapt plugin and skill output to the QuizFlow requirements rather than accepting generated defaults unchanged.

## Technical architecture

### Application

- Next.js App Router and TypeScript.
- Server Components for data-oriented screens by default.
- Client Components for quiz interaction, autosave, QR scanning or display, theme controls, and other browser APIs.
- Route Handlers for the versioned JSON API.
- Shared validation schemas at the API boundary.

### Data

- PostgreSQL as the source of durable application state.
- Prisma for schema, migrations, and database access.
- Transactions for enrollment, attempt creation, submission, grading, and audited overrides.
- Immutable snapshots for published quiz versions and started attempts.

### Source layout

QuizFlow uses a colocation-first App Router structure inspired by [`arhamkhnz/next-colocation-template`](https://github.com/arhamkhnz/next-colocation-template). Route-specific components and logic live with the route that owns them. Top-level folders contain only code shared across route boundaries.

```text
src/
  app/
    (external)/
      login/
        _components/
        page.tsx
      forgot-password/
        _components/
        page.tsx
      reset-password/
        _components/
        page.tsx
      layout.tsx
    (teacher-admin)/
      teacher/
        dashboard/
          _components/
          page.tsx
        classes/
        students/
        quizzes/
        results/
        integrity/
      layout.tsx
    (student)/
      student/
        dashboard/
          _components/
          page.tsx
        classes/
        quizzes/
        results/
      layout.tsx
    api/
      v1/
    layout.tsx
    page.tsx
  components/
    ui/
    layout/
    preview/
    theme/
  config/
  hooks/
  lib/
    auth/
    db/
    permissions/
    validation/
    grading/
    autosave/
    integrity/
  navigation/
prisma/
  schema.prisma
tests/
docs/
```

Route groups do not add a URL segment, so two groups cannot both own `dashboard/` (both would resolve to `/dashboard`). Each role group therefore nests its pages under a role segment: teacher/admin pages live at `/teacher/...` and student pages at `/student/...`. The group layout is the role's authorization boundary.

Colocation rules:

- Put page-specific UI in that route's `_components` folder.
- Put UI shared by several routes in the nearest common route group's `_components` folder.
- Route-specific schemas, server actions, and helpers may use private `_schemas`, `_actions`, or `_lib` folders beside the route.
- Promote code to top-level `src/components`, `src/hooks`, `src/config`, or `src/lib` only when it is genuinely shared across route boundaries.
- Keep shadcn/ui primitives in `src/components/ui`.
- Do not import from another route's private folder. Promote shared code to the nearest valid common scope.
- Keep core grading, authorization, enrollment, attempt, autosave, and integrity rules in server-only modules under `src/lib`; pages and route handlers remain thin.
- Add `"use client"` only at the interactive leaf component that needs browser state or APIs. Server Components remain the default.

## Non-functional requirements

### Reliability

- A server-acknowledged answer must not be lost during normal recovery.
- Critical mutations must be transaction-safe and retry-safe.
- Quiz submission and invite redemption must be idempotent.
- The UI must distinguish recoverable connection trouble from a rejected action.

### Performance

- Optimize the dashboard and class pages for common mobile connections.
- Avoid sending answer keys or unrelated roster data to the client.
- Batch integrity events and debounce answer writes.
- Use pagination for rosters, quiz results, audit logs, and long event timelines.
- Keep animation outside the critical path for quiz rendering and input.

### Security and privacy

- Apply server-side authentication, authorization, input validation, rate limiting, and audit logging as defined in the source of truth.
- Minimize integrity metadata and set a documented retention period before production.
- Never log raw invite tokens, session secrets, answer content, or sensitive request bodies.
- Use environment variables for secrets and validate required configuration at startup.

### Observability

- Record structured errors with a request ID.
- Track autosave failure rate, save latency, submission failures, invite redemption failures, and grading failures.
- Exclude answer content and sensitive student data from telemetry.
- Provide enough context to trace an attempt lifecycle without exposing secrets.

## Delivery phases

### Phase 1: Foundation

- Application shell, theme system, navigation, login, logout, forgot-password and reset-password flows, authentication adapter, role checks, Prisma setup, and base design tokens.

### Phase 2: Classes

- Teacher/admin class management, rosters, manual enrollment, QR invites, and student class registration.

### Phase 3: Quiz authoring

- Drafts, Google Forms-style question editor, `.docx` import and review, settings, preview, validation, publication, and immutable quiz versions.

### Phase 4: Attempts

- Student instructions, attempt creation, timer, navigation, autosave, offline queue, recovery, and idempotent submission.

### Phase 5: Grading and integrity

- Automatic grading, manual review, grade overrides, result release, event ingestion, and attempt timeline.

### Phase 6: Hardening

- Accessibility audit, responsive QA, security review, load testing of autosave/event traffic, recovery testing, observability, and production runbooks.

## Acceptance scenarios

The initial release is complete when all of these scenarios work:

1. A teacher/admin and a student can log in and reach their respective dashboards.
2. A user can request a reset without exposing whether the email exists, use a valid reset link once, and log in with the new password.
3. A teacher creates a class, manually enrolls one student, and sees exactly one active roster entry.
4. A teacher displays a QR invite; a signed-in student joins; scanning it again does not duplicate enrollment.
5. A teacher builds and publishes a quiz with each supported question type using the form-style editor.
6. A teacher imports a valid `.docx`, reviews and corrects its proposals, applies it once, and sees the questions in the draft without automatic publication.
7. A malformed or ambiguous Word document produces actionable warnings without corrupting the quiz draft.
8. A student starts the quiz, answers questions, refreshes, and recovers every acknowledged answer.
9. A student loses connection, continues answering, reconnects, and receives a clear reconciliation result.
10. The timer uses the server deadline and the latest saved work is finalized when time expires.
11. Submitting the same attempt twice produces one final submission and grade.
12. Objective answers are graded correctly and review-required answers appear in the teacher queue.
13. Focus and visibility changes appear in the teacher's attempt timeline without changing the score.
14. A teacher overrides a score with a reason and the grade history preserves both values.
15. A student cannot view an unreleased result or another student's data.
16. Teacher/admin and student flows remain usable with keyboard navigation and in light, dark, and system themes on phone and desktop layouts.

## Definition of done

A feature is done when:

- Its server-side permissions and validation are implemented.
- Loading, empty, error, offline, and success states are handled where applicable.
- It works in light and dark themes and at supported responsive widths.
- Keyboard and screen-reader behavior has been checked for the changed flow.
- Meaningful domain behavior has automated coverage at the appropriate layer.
- Critical user journeys affected by the change have Playwright coverage or a documented browser-verification result.
- Database changes include a migration and safe rollout notes.
- API or product decisions are reflected in these documents.
- No secrets, answer keys, or unnecessary student data reach logs or unauthorized clients.
