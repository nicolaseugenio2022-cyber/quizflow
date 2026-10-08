# QuizFlow Source of Truth

Last updated: 2026-10-08

## Purpose

This document records the product and technical decisions that every QuizFlow implementation must follow. When documents disagree, use this precedence order:

1. `source-of-truth.md`
2. `project.md`
3. `api-route.md`
4. `api.md`
5. `diagrams.md`

Update this file whenever an accepted product decision changes. Do not silently change a requirement in code alone.

## Product definition

QuizFlow is a responsive quiz website for senior high school (SHS) and college teachers and students. Teachers create classes and quizzes, enroll students manually or through QR registration, monitor quiz integrity events, and review grades. Students join classes, take quizzes with automatic saving, recover interrupted attempts, submit answers, and view released results.

## Product principles

- Make common classroom work fast and understandable on both desktop and mobile.
- Protect student work from connection loss, refreshes, and accidental navigation.
- Treat integrity events as reviewable evidence. An event never proves misconduct by itself.
- Give teachers control over publishing, availability, attempts, grading, and result release.
- Keep the interface calm, accessible, and focused during quizzes.
- Collect only the data needed to run the classroom workflow.

## Users and permissions

QuizFlow has exactly two product roles in the initial release: `TEACHER_ADMIN` and `STUDENT`. The teacher/admin role combines teaching and administration for the classes the user owns; it is not a platform-wide super-admin role. References to a teacher elsewhere in these documents mean a user with `TEACHER_ADMIN`.

| Capability | Teacher/Admin | Student |
| --- | --- | --- |
| Create and manage a class | Yes | No |
| View a class | Own classes | Enrolled classes |
| Add a student manually | Yes | No |
| Create or revoke a class QR invite | Yes | No |
| Join through a valid QR invite | No | Yes |
| Create, edit, publish, or close a quiz | Yes | No |
| Start and resume an assigned quiz | No | Yes |
| View integrity events | Class teacher | Own attempt summary only if exposed |
| Review and override a grade | Yes | No |
| View results | Class teacher | Own released results |

A teacher/admin may access and administer only classes they own. A student may access only classes in which they have an active enrollment. Route checks must enforce these rules on the server even when the interface hides an action. QuizFlow has no separate administrator role in the initial release.

## Authentication and password recovery

- QuizFlow must provide a dedicated login page for teacher/admin and student users.
- Login uses email and password unless a later authentication decision adds another method.
- A successful login returns the user to a validated local `returnTo` destination when present; otherwise it opens the role-appropriate dashboard.
- The login form provides a visible **Forgot password?** link.
- The forgot-password page accepts an email address and always shows the same confirmation response, whether or not an account exists.
- When the account exists, QuizFlow sends a time-limited, single-use password-reset link through the configured email provider.
- The reset-password page validates the token, asks for a new password and confirmation, and clearly handles expired, invalid, and already-used links.
- Store only a hash of each reset token. Never log or persist the raw token after delivery.
- A successful password reset consumes the token and invalidates existing sessions according to the selected authentication provider's capabilities.
- Login and password-recovery endpoints must be rate-limited and must not reveal whether an email address is registered.
- Until an authentication provider is selected, development and CI builds may sign in with one teacher/admin and one student test account defined in environment variables (`TEACHER_USERNAME`/`TEACHER_PASSWORD`, `STUDENT_USERNAME`/`STUDENT_PASSWORD`). This development-only adapter is disabled when `NODE_ENV` is `production`, stores no credentials in the database, and does not select a provider. Production builds have no sign-in until the provider decision is recorded.

## Core workflows

### Class and enrollment

1. A teacher creates a class with a name, subject, academic level, school year, and term.
2. The teacher may enroll an existing student manually.
3. The teacher may generate a revocable, expiring registration invite and display it as a QR code.
4. A signed-in student scans the QR code, reviews the class identity, and confirms registration.
5. Registration creates one active enrollment. Reusing an invite must not create duplicates.

The QR code contains an opaque invite URL or token. It must not contain a database ID, email address, or other sensitive data. Store only a hash of the token on the server.

### Quiz authoring and publication

1. A teacher creates a draft quiz inside a class.
2. The teacher adds questions, choices, correct answers, point values, instructions, availability, duration, and attempt settings.
3. The server validates the quiz before publication.
4. Publishing freezes the version used by new attempts. Changes that affect scoring require a new quiz version or an explicit regrade operation.
5. A closed quiz cannot accept new attempts. An in-progress attempt follows the teacher's configured deadline and grace policy.

Initial question types are:

- `MULTIPLE_CHOICE`: one correct option.
- `MULTIPLE_SELECT`: one or more correct options; exact-set matching by default.
- `TRUE_FALSE`: one Boolean answer.
- `SHORT_ANSWER`: normalized exact-match answers when answer keys exist; otherwise teacher review.

Rich essay, file upload, and mathematical-expression grading are outside the initial release.

### Question builder and Word import

- Teacher/admin users can build questions manually through a Google Forms-style editor with question cards, type selection, answer choices, answer keys, points, required state, duplication, deletion, and drag-and-drop reordering.
- Changes save to the quiz draft and never modify a published quiz version.
- The initial Word import supports `.docx` files. Legacy `.doc` files must be converted to `.docx` before upload.
- Word import converts document content into proposed quiz questions; it does not translate between human languages.
- The parser supports the initial question types and recognizes numbered questions, labeled choices, answer markers, point values, and type markers from a documented template.
- Imported questions first appear in an editable review screen with confidence, warnings, and unparsed content. Nothing enters the quiz draft until the teacher/admin confirms the import.
- Missing answer keys, ambiguous options, unsupported blocks, and invalid point values remain visibly flagged and block publication until corrected.
- Applying an import is idempotent and adds the confirmed questions to the selected draft in one transaction.
- Import never publishes a quiz, changes an existing published version, or silently overwrites manually authored questions.
- Uploaded documents are treated as untrusted input. Enforce file type and size limits, reject macros or active content, sanitize extracted text, and delete temporary files according to the retention policy.
- Tables, embedded images, equations, OCR, legacy `.doc`, and AI-assisted interpretation are deferred unless explicitly added later.

### Taking a quiz

1. The server checks enrollment, quiz availability, attempt limits, and any existing resumable attempt.
2. Starting creates an immutable attempt snapshot of quiz content and grading settings.
3. The client saves changed answers automatically and shows `Saving`, `Saved`, or `Offline` status.
4. The client records supported integrity events and sends them in batches.
5. Refreshing or reopening the quiz restores the latest server save. Locally queued changes are reconciled when the connection returns.
6. Submission is idempotent. The server grades objective answers, flags answers needing review, and records the authoritative submission time.
7. Students see results only after the teacher's release policy permits it.

## Quiz timing rules

- Store all timestamps in UTC and render them in the user's locale.
- The server clock is authoritative for availability, deadlines, and duration.
- An attempt's deadline is the earliest of the quiz closing time and `startedAt + timeLimit`, unless a teacher-granted extension exists.
- Autosave does not extend the deadline.
- When time expires, the client requests submission and the server may finalize the latest saved answers even if the client disconnects.
- Any grace period must be an explicit quiz or attempt setting, never an implicit client delay.

## Autosave and recovery contract

- Save after a short debounce when an answer changes and at a periodic fallback interval while changes remain unsaved.
- Each answer write includes the last known attempt version.
- A successful save increments the server version and returns the authoritative version and timestamp.
- A stale version returns `409 CONFLICT` with enough state for reconciliation; it must not overwrite newer work.
- Keep unsent changes locally until the server acknowledges them.
- Reopening an in-progress attempt restores saved answers and remaining time from the server.
- The final submit endpoint is idempotent and accepts an idempotency key.
- After submission, answer mutations are rejected unless a teacher explicitly reopens the attempt.

## Automatic grading

- Calculate scores on the server from the attempt snapshot, never from client-supplied correctness.
- Preserve both earned points and possible points for every response.
- Objective questions grade automatically at submission.
- `MULTIPLE_SELECT` uses exact-set scoring in the initial release; partial credit is a future configurable option.
- `SHORT_ANSWER` comparison trims surrounding whitespace and applies Unicode normalization and case folding. Each question may opt into case-sensitive matching.
- Answers without an automatic rule receive `NEEDS_REVIEW`.
- A teacher override stores the previous score, new score, reason, teacher, and timestamp.
- Regrading is an explicit, audited action and never silently changes released results.

## Integrity-event monitoring

The browser may record the following events while an attempt is active:

- Page or tab hidden and visible again.
- Window focus lost and regained.
- Fullscreen exited when fullscreen is required.
- Copy, cut, paste, or context-menu activity within the quiz surface.
- Network disconnect and reconnect.
- Attempt opened in another active session when detectable by the server.
- Repeated save conflicts or abnormal submission retries.

Every event includes its type, client occurrence time, server receipt time, attempt ID, and small structured metadata. Events are append-only.

QuizFlow does not access a webcam, microphone, screen recording, browsing history, or unrelated device data in the initial release. Integrity events do not automatically reduce a score or invalidate an attempt. Teachers see a timeline and summary and make the final decision under their institution's policy.

## Data model invariants

- Email addresses are unique after normalization.
- A user has one initial product role.
- A class has one owning teacher/admin.
- A student has at most one active enrollment per class.
- An invite token is hashed, expiring, revocable, and optionally usage-limited.
- A quiz belongs to one class and has at least one version once published.
- An attempt belongs to one student, quiz version, and class enrollment.
- A student cannot exceed the quiz's allowed attempt count.
- Question order, option order, point values, and correct-answer rules are snapshotted per attempt.
- A Word import has a file checksum and can be applied to a quiz draft at most once for a given import operation.
- A submitted attempt is immutable except through an audited teacher action.
- Integrity events are append-only and never accepted for an attempt the caller cannot access.

## Technical baseline

| Area | Decision |
| --- | --- |
| Application | Next.js with the App Router |
| Language | TypeScript with strict type checking |
| Database | PostgreSQL |
| ORM | Prisma |
| UI components | shadcn/ui, New York style |
| Visual accents | React Bits components added individually through the official `@react-bits` shadcn registry or an official configured MCP, using TypeScript + Tailwind variants |
| Validation | Shared server-side schemas; Zod is the preferred implementation |
| API style | Versioned JSON endpoints under `/api/v1` |
| Rendering | Server Components by default; Client Components only for interaction |
| Source organization | `src/` layout with colocation-first App Router features and private route folders such as `_components` |
| Theme | Light, dark, and system preference |
| Primary implementation direction | Claude serves as the primary implementer and UI/UX designer; repository documents remain authoritative across tools or agents |

The authentication provider, email service, hosting platform, object storage, analytics service, and background-job provider are not yet selected. Code must isolate these behind small adapters instead of assuming a vendor.

## Claude implementation toolchain

Claude is the primary implementation and UI/UX agent for QuizFlow.

Approved Claude plugins:

- `superpower`: structured planning, implementation discipline, debugging, and verification workflows.
- `frontend-design`: distinctive frontend composition and visual-quality guidance.
- `playwright`: browser automation and end-to-end validation of critical user journeys.
- `obsidian`: navigation and maintenance of the project's Markdown knowledge base.

Approved Claude skills include:

- `ui-ux-pro-max`: interface design, responsive behavior, accessibility, interaction, typography, color, and design-system guidance.
- `supabase`: Supabase-specific implementation and troubleshooting when the project actually uses a Supabase product.
- Other installed skills may be used when they are relevant to the current task and compatible with this source of truth.

Tool availability does not make an architecture decision. In particular, the `supabase` skill does not replace the required Prisma/PostgreSQL baseline or select Supabase as the authentication, database-hosting, storage, or realtime provider. Any such selection must be recorded as an explicit project decision.

The repository documents and accepted user decisions take precedence over plugin or skill defaults. Obsidian may organize these files but must not maintain a competing source of truth outside the repository.

## Visual direction

QuizFlow uses minimalist pink glassmorphism:

- A restrained neutral canvas with pink as the accent, status, and focus color.
- Translucent surfaces with subtle borders and blur only where the underlying background supports the effect.
- High text contrast in light and dark themes.
- Clear spacing, typography, and hierarchy; avoid decorative clutter during quizzes.
- Consistent semantic colors for success, warning, error, and information that remain distinguishable without relying on color alone.
- Reduced-transparency and reduced-motion fallbacks.
- Keyboard-visible focus, labeled controls, and WCAG 2.2 AA contrast targets.

Use React Bits for purposeful motion or visual emphasis, such as the landing experience, empty states, or success feedback. Do not use animated effects in ways that distract from answering a quiz or obscure essential content.

## Security and privacy baseline

- Authenticate every non-public API request and authorize the target resource on the server.
- Validate all input and use Prisma parameterization.
- Hash invite tokens and expire or revoke them server-side.
- Hash password-reset tokens, make them single-use, and expire them server-side.
- Rate-limit authentication, invite redemption, attempt creation, autosave, and event ingestion appropriately.
- Do not return answer keys to a student before result release; even after release, follow the quiz review policy.
- Use secure, HTTP-only session cookies when cookie sessions are selected.
- Protect state-changing browser requests against cross-site request forgery.
- Escape or sanitize teacher-authored rich text before rendering.
- Keep audit records for publication, grade overrides, attempt reopening, and other sensitive teacher actions.
- Define retention and deletion rules for integrity events before production use.

## Initial-release scope

Included:

- Teacher/admin and student accounts with role-aware dashboards.
- Login, logout, forgot-password request, and password-reset completion.
- Class creation and student roster management.
- Manual enrollment and QR-based class registration.
- Google Forms-style quiz authoring, `.docx` question import with review, scheduling, publishing, taking, and closing.
- Automatic grading for supported question types.
- Teacher review and grade override.
- Autosave, offline queueing, and attempt recovery.
- Integrity-event collection and teacher review.
- Responsive light, dark, and system themes.

Deferred:

- Platform-wide super-admin console.
- LMS/SIS integrations.
- Live video proctoring or device lockdown.
- Native mobile applications.
- Collaborative quiz authoring.
- AI-generated questions or AI grading.
- Legacy `.doc`, OCR, image-based questions, equation extraction, and AI-assisted interpretation during Word import.
- Advanced item analysis and psychometrics.
- Paid plans and billing.

## Open decisions

These items require an explicit product or architecture decision before implementation reaches the affected area:

- Authentication and transactional-email providers; the login and password-recovery product flow above remains required regardless of vendor.
- Whether Supabase will provide any managed PostgreSQL, authentication, storage, realtime, or background-service capability.
- Whether a person may hold both teacher and student roles.
- Institution or tenant model for multi-school deployment.
- Email or in-app notification requirements.
- Quiz-result release modes and whether answer keys may be shown.
- Default invitation expiry and usage limit.
- Default autosave debounce and fallback interval.
- Maximum `.docx` upload size, temporary-file retention, and the selected safe parsing library or service.
- Late-submission and teacher-extension policies.
- Retention period and export policy for integrity events.
- Deployment, observability, and background-job providers.

## Related documents

- [Project specification](./project.md)
- [API route inventory](./api-route.md)
- [API contracts](./api.md)
- [System diagrams](./diagrams.md)
