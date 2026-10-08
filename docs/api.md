# QuizFlow API Contracts

This document defines the shared API shapes and behavior for the routes in [api-route.md](./api-route.md). The examples are implementation contracts, not a generated client. Runtime validation remains required at every boundary.

## Base types

```ts
type ID = string;
type ISODateTime = string;

type UserRole = "TEACHER_ADMIN" | "STUDENT";
type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";
type AcademicLevel = "SHS" | "COLLEGE";
type ClassStatus = "ACTIVE" | "ARCHIVED";
type EnrollmentStatus = "ACTIVE" | "INACTIVE";
type EnrollmentSource = "MANUAL" | "QR_INVITE";

interface CurrentUser {
  id: ID;
  email: string;
  displayName: string;
  role: UserRole;
  themePreference: ThemePreference;
}
```

All API `null` values are explicit. Optional properties represent fields omitted by policy, caller role, or endpoint projection.

## Common response shapes

### Single resource

```ts
interface DataResponse<T> {
  data: T;
  meta?: {
    requestId: string;
  };
}
```

### Cursor-paginated collection

```ts
interface PageResponse<T> {
  data: T[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  meta?: {
    requestId: string;
  };
}
```

### Error

```ts
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    details?: Record<string, unknown>;
    requestId: string;
  };
}
```

Example validation error:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields need attention.",
    "fieldErrors": {
      "availableUntil": ["Must be later than availableFrom."]
    },
    "requestId": "req_01K..."
  }
}
```

Messages are user-safe. Internal exceptions and stack traces never appear in the response.

## Authentication contracts

```ts
interface LoginRequest {
  email: string;
  password: string;
  returnTo?: string;
}

interface LoginResult {
  user: CurrentUser;
  redirectTo: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordAccepted {
  accepted: true;
  message: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface ResetPasswordResult {
  reset: true;
  redirectTo: "/login";
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

Example login request:

```json
{
  "email": "student@example.edu",
  "password": "user-supplied-password",
  "returnTo": "/join/invite-token"
}
```

A successful login sets the secure session cookie and returns the user plus a validated local redirect. The API never returns the password or a reusable session secret in the JSON body. Unknown email, wrong password, and an unusable local-password account all return the same `INVALID_CREDENTIALS` response.

Example forgot-password request:

```json
{
  "email": "student@example.edu"
}
```

Every syntactically valid forgot-password request returns `202 Accepted` with the same representation:

```json
{
  "data": {
    "accepted": true,
    "message": "If an account matches that email, a password-reset link will be sent."
  }
}
```

The response, status, and practical response timing must not disclose whether the account exists. When an eligible account exists, the server creates a cryptographically random token, stores only its hash and expiry, and asks the configured email adapter to send the raw token in a reset link.

Example reset request:

```json
{
  "token": "raw-token-from-reset-link",
  "newPassword": "user-supplied-new-password"
}
```

Reset behavior:

- Validate the password with the shared server-side password policy.
- Find the reset request by token hash and verify that it is unexpired and unused.
- Update the password and mark the token used in one transaction.
- Invalidate existing sessions according to provider capabilities.
- Never log either password or the raw reset token.
- A token cannot be used successfully more than once, including under concurrent requests.

If a hosted authentication provider owns password handling, its adapter must provide equivalent behavior and map its results to these product states without exposing provider-specific secrets.

## Class contracts

```ts
interface ClassSummary {
  id: ID;
  name: string;
  subject: string;
  academicLevel: AcademicLevel;
  schoolYear: string;
  term: string;
  status: ClassStatus;
  teacher: {
    id: ID;
    displayName: string;
  };
  activeStudentCount?: number;
  enrollmentStatus?: EnrollmentStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface CreateClassRequest {
  name: string;
  subject: string;
  academicLevel: AcademicLevel;
  schoolYear: string;
  term: string;
}

interface UpdateClassRequest {
  name?: string;
  subject?: string;
  academicLevel?: AcademicLevel;
  schoolYear?: string;
  term?: string;
  status?: ClassStatus;
}

interface Enrollment {
  id: ID;
  classId: ID;
  student: {
    id: ID;
    displayName: string;
    email: string;
  };
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolledAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface ManualEnrollmentRequest {
  studentId: ID;
}
```

Example class creation:

```json
{
  "name": "STEM 12 - Newton",
  "subject": "General Physics 2",
  "academicLevel": "SHS",
  "schoolYear": "2026-2027",
  "term": "First Semester"
}
```

Manual enrollment returns `201 Created` for a new enrollment and `200 OK` with the existing enrollment when the same active student is added again.

## Registration-invite contracts

```ts
interface CreateRegistrationInviteRequest {
  expiresAt: ISODateTime;
  maxUses: number | null;
}

interface RegistrationInviteCreated {
  id: ID;
  classId: ID;
  token: string;
  joinUrl: string;
  expiresAt: ISODateTime;
  maxUses: number | null;
  useCount: number;
  createdAt: ISODateTime;
}

interface RegistrationInviteSummary {
  id: ID;
  classId: ID;
  expiresAt: ISODateTime;
  maxUses: number | null;
  useCount: number;
  revokedAt: ISODateTime | null;
  createdAt: ISODateTime;
}

interface RegistrationInvitePreview {
  class: {
    id: ID;
    name: string;
    subject: string;
    academicLevel: AcademicLevel;
    schoolYear: string;
    term: string;
  };
  teacher: {
    displayName: string;
  };
  expiresAt: ISODateTime;
  canRedeem: boolean;
  state: "ACTIVE" | "EXPIRED" | "REVOKED" | "LIMIT_REACHED";
}

interface RedeemRegistrationInviteResult {
  enrollment: Enrollment;
  created: boolean;
}
```

The raw invite `token` and `joinUrl` appear only in the successful creation response. List endpoints return `RegistrationInviteSummary` and never reconstruct the secret.

## Quiz contracts

```ts
type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
type ResultReleaseMode = "MANUAL" | "AFTER_SUBMISSION" | "AFTER_QUIZ_CLOSES";
type QuestionType =
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_SELECT"
  | "TRUE_FALSE"
  | "SHORT_ANSWER";

interface QuizSettings {
  availableFrom: ISODateTime | null;
  availableUntil: ISODateTime | null;
  timeLimitMinutes: number | null;
  allowedAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  requireFullscreen: boolean;
  resultReleaseMode: ResultReleaseMode;
  showCorrectAnswers: boolean;
}

interface QuizSummary {
  id: ID;
  classId: ID;
  title: string;
  status: QuizStatus;
  settings: QuizSettings;
  totalPoints?: number;
  questionCount?: number;
  latestPublishedVersion?: number | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface CreateQuizRequest {
  title: string;
  instructions: string;
  settings: QuizSettings;
}

interface UpdateQuizRequest {
  title?: string;
  instructions?: string;
  settings?: Partial<QuizSettings>;
}
```

### Teacher/admin question shapes

```ts
interface TeacherAdminQuestionOption {
  id: ID;
  label: string;
  isCorrect: boolean;
  position: number;
}

interface ShortAnswerRule {
  acceptedAnswers: string[];
  caseSensitive: boolean;
  requiresManualReview: boolean;
}

interface TeacherAdminQuestion {
  id: ID;
  type: QuestionType;
  prompt: string;
  points: number;
  required: boolean;
  position: number;
  options: TeacherAdminQuestionOption[];
  trueFalseAnswer: boolean | null;
  shortAnswerRule: ShortAnswerRule | null;
}

interface UpsertQuestionRequest {
  type: QuestionType;
  prompt: string;
  points: number;
  required: boolean;
  options?: Array<{
    id?: ID;
    label: string;
    isCorrect: boolean;
    position: number;
  }>;
  trueFalseAnswer?: boolean;
  shortAnswerRule?: ShortAnswerRule;
}
```

Validation requirements:

- `points` is greater than zero.
- `MULTIPLE_CHOICE` has at least two options and exactly one correct option.
- `MULTIPLE_SELECT` has at least two options and at least one correct option.
- `TRUE_FALSE` has a Boolean answer key.
- `SHORT_ANSWER` either has at least one accepted answer or sets `requiresManualReview: true`.
- Option labels are non-empty after trimming.

### Word import contracts

The upload request uses `multipart/form-data` with one field named `file`. The server accepts `.docx` only in the initial release.

```ts
type QuizImportStatus =
  | "UPLOADED"
  | "PARSING"
  | "REVIEW_READY"
  | "FAILED"
  | "APPLIED"
  | "DISCARDED";

type ImportIssueSeverity = "WARNING" | "BLOCKING";

interface ImportIssue {
  code: string;
  severity: ImportIssueSeverity;
  message: string;
  sourceParagraph?: number;
  proposalId?: ID;
}

interface WordQuestionProposal {
  id: ID;
  included: boolean;
  position: number;
  confidence: number;
  sourceText: string;
  question: UpsertQuestionRequest;
  issues: ImportIssue[];
}

interface WordQuizImport {
  id: ID;
  quizId: ID;
  originalFileName: string;
  sizeBytes: number;
  checksumSha256: string;
  status: QuizImportStatus;
  proposals: WordQuestionProposal[];
  unparsedContent: Array<{
    sourceParagraph: number;
    text: string;
    reason: string;
  }>;
  issues: ImportIssue[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  appliedAt: ISODateTime | null;
}

interface UpdateWordQuizImportRequest {
  proposals: Array<{
    id: ID;
    included: boolean;
    position: number;
    question: UpsertQuestionRequest;
  }>;
}

interface ApplyWordQuizImportResult {
  importId: ID;
  quizId: ID;
  createdQuestionIds: ID[];
  appliedAt: ISODateTime;
}
```

`confidence` ranges from `0` to `1` and is a review hint only. It never bypasses validation. The API exposes the checksum for diagnostics but never exposes a temporary storage path or executable document content.

A recommended deterministic Word template is:

```text
[TYPE: MULTIPLE_CHOICE] [POINTS: 2] [REQUIRED: YES]
1. Which planet is known as the Red Planet?
A. Earth
B. Mars
C. Venus
D. Jupiter
Answer: B

[TYPE: SHORT_ANSWER] [POINTS: 1]
2. What is the chemical symbol for water?
Answer: H2O
```

The parser may recognize conventional numbering and answer labels without markers, but ambiguous inference produces a warning and remains subject to teacher/admin review. Language translation, question generation, OCR, image extraction, and equation interpretation are outside this contract.

### Student-safe question shape

```ts
interface AttemptQuestion {
  id: ID;
  type: QuestionType;
  prompt: string;
  points: number;
  required: boolean;
  position: number;
  options: Array<{
    id: ID;
    label: string;
    position: number;
  }>;
}
```

Student payloads omit correctness and grading-rule fields.

### Publication validation

```ts
interface QuizValidationIssue {
  code: string;
  message: string;
  path: string;
  questionId?: ID;
}

interface QuizValidationResult {
  valid: boolean;
  issues: QuizValidationIssue[];
}

interface PublishQuizResult {
  quizId: ID;
  versionId: ID;
  versionNumber: number;
  publishedAt: ISODateTime;
  totalPoints: number;
  questionCount: number;
}
```

Publishing is rejected with `422 QUIZ_NOT_PUBLISHABLE` and the same issue list when validation fails.

## Attempt contracts

```ts
type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "NEEDS_REVIEW"
  | "GRADED"
  | "REOPENED";

type SaveState = "SAVED" | "CONFLICT";

interface AttemptEligibility {
  eligible: boolean;
  reasonCode:
    | "ELIGIBLE"
    | "NOT_YET_AVAILABLE"
    | "CLOSED"
    | "NOT_ENROLLED"
    | "ATTEMPT_LIMIT_REACHED";
  serverNow: ISODateTime;
  availableFrom: ISODateTime | null;
  availableUntil: ISODateTime | null;
  allowedAttempts: number;
  usedAttempts: number;
  resumableAttemptId: ID | null;
}

interface StartAttemptRequest {
  clientInstanceId: string;
}

interface AttemptSnapshot {
  id: ID;
  quizId: ID;
  quizVersionId: ID;
  attemptNumber: number;
  status: AttemptStatus;
  title: string;
  instructions: string;
  questions: AttemptQuestion[];
  answers: AttemptAnswer[];
  startedAt: ISODateTime;
  deadlineAt: ISODateTime | null;
  submittedAt: ISODateTime | null;
  serverNow: ISODateTime;
  version: number;
  monitoring: {
    enabled: boolean;
    requireFullscreen: boolean;
    eventTypes: IntegrityEventType[];
  };
}
```

Starting a quiz returns `200 OK` with the existing resumable attempt when one exists, or `201 Created` with a new attempt.

## Answer and autosave contracts

```ts
type AnswerValue =
  | { kind: "OPTION_IDS"; optionIds: ID[] }
  | { kind: "BOOLEAN"; value: boolean }
  | { kind: "TEXT"; value: string }
  | { kind: "EMPTY" };

interface AttemptAnswer {
  questionId: ID;
  value: AnswerValue;
  updatedAt: ISODateTime;
}

interface SaveAnswersRequest {
  baseVersion: number;
  clientMutationId: string;
  answers: Array<{
    questionId: ID;
    value: AnswerValue;
  }>;
}

interface SaveAnswersResult {
  attemptId: ID;
  state: SaveState;
  version: number;
  savedAt: ISODateTime;
  acceptedQuestionIds: ID[];
}

interface VersionConflictDetails {
  attemptId: ID;
  currentVersion: number;
  currentAnswers: AttemptAnswer[];
  serverNow: ISODateTime;
}
```

Example autosave request:

```json
{
  "baseVersion": 7,
  "clientMutationId": "3d492e9d-6d21-4e6e-89cc-a76f2804a878",
  "answers": [
    {
      "questionId": "q_01K...",
      "value": {
        "kind": "OPTION_IDS",
        "optionIds": ["opt_01K..."]
      }
    }
  ]
}
```

Example successful save:

```json
{
  "data": {
    "attemptId": "att_01K...",
    "state": "SAVED",
    "version": 8,
    "savedAt": "2026-10-08T07:45:18.123Z",
    "acceptedQuestionIds": ["q_01K..."]
  }
}
```

Example version conflict:

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "This attempt has newer saved answers.",
    "details": {
      "attemptId": "att_01K...",
      "currentVersion": 9,
      "currentAnswers": [],
      "serverNow": "2026-10-08T07:45:21.000Z"
    },
    "requestId": "req_01K..."
  }
}
```

The server deduplicates `clientMutationId` within an attempt. Clients keep unacknowledged mutations locally and remove them only after success or completed reconciliation.

## Submission and grading contracts

```ts
interface SubmitAttemptRequest {
  baseVersion: number;
  finalAnswers?: SaveAnswersRequest["answers"];
  reason: "STUDENT_SUBMIT" | "TIME_EXPIRED";
}

type GradingStatus = "GRADED" | "NEEDS_REVIEW";

interface AttemptSubmissionResult {
  attemptId: ID;
  status: "SUBMITTED" | "NEEDS_REVIEW" | "GRADED";
  submittedAt: ISODateTime;
  gradingStatus: GradingStatus;
  earnedPoints?: number;
  possiblePoints?: number;
  percentage?: number;
  resultReleased: boolean;
}

type ResponseGradingState =
  | "CORRECT"
  | "INCORRECT"
  | "NEEDS_REVIEW"
  | "OVERRIDDEN";

interface GradedResponse {
  id: ID;
  questionId: ID;
  answer: AnswerValue;
  gradingState: ResponseGradingState;
  earnedPoints: number | null;
  possiblePoints: number;
  feedback: string | null;
}
```

The `earnedPoints`, `possiblePoints`, and `percentage` fields are omitted from a student submission response when the release policy does not allow them. Teacher/admin review responses always include grading data.

### Scoring rules

- `MULTIPLE_CHOICE`: full points only when the selected option is the snapshotted correct option.
- `MULTIPLE_SELECT`: full points only when selected option IDs exactly equal the correct set; otherwise zero in the initial release.
- `TRUE_FALSE`: full points only for the snapshotted Boolean answer.
- `SHORT_ANSWER`: normalize the response and accepted answers using Unicode normalization and surrounding-whitespace trimming; apply case folding unless the snapshot is case-sensitive.
- Blank answers receive zero unless the question is awaiting manual review by policy.
- Total earned points equal the sum of response points after overrides.
- Percentage equals `earnedPoints / possiblePoints * 100`, rounded only for display. Store exact point values.

## Integrity-event contracts

```ts
type IntegrityEventType =
  | "PAGE_HIDDEN"
  | "PAGE_VISIBLE"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "FULLSCREEN_EXIT"
  | "COPY"
  | "CUT"
  | "PASTE"
  | "CONTEXT_MENU"
  | "NETWORK_OFFLINE"
  | "NETWORK_ONLINE"
  | "CONCURRENT_SESSION"
  | "SAVE_CONFLICT"
  | "SUBMIT_RETRY";

interface IntegrityEventInput {
  eventId: string;
  type: IntegrityEventType;
  occurredAt: ISODateTime;
  sequence: number;
  metadata?: {
    hiddenDurationMs?: number;
    offlineDurationMs?: number;
    questionId?: ID;
    clientInstanceId?: string;
  };
}

interface IntegrityEventBatchRequest {
  events: IntegrityEventInput[];
}

interface IntegrityEventBatchResult {
  acceptedEventIds: string[];
  duplicateEventIds: string[];
  serverReceivedAt: ISODateTime;
}

interface IntegrityEventRecord extends IntegrityEventInput {
  id: ID;
  attemptId: ID;
  receivedAt: ISODateTime;
  severity: "INFO" | "NOTICE" | "REVIEW";
}
```

Event metadata uses an allowlist per event type. Arbitrary browser data, page content, clipboard content, keystrokes, webcam data, microphone data, and screenshots are rejected and not stored.

Event batches are idempotent by `(attemptId, eventId)`. The server assigns severity for presentation; severity has no scoring effect.

## Teacher/admin review contracts

```ts
interface IntegritySummary {
  totalEvents: number;
  countsByType: Partial<Record<IntegrityEventType, number>>;
  reviewEventCount: number;
  firstEventAt: ISODateTime | null;
  lastEventAt: ISODateTime | null;
}

interface GradeRevision {
  id: ID;
  responseId: ID;
  previousPoints: number | null;
  newPoints: number;
  reason: string;
  changedBy: {
    id: ID;
    displayName: string;
  };
  createdAt: ISODateTime;
}

interface AttemptReview {
  attemptId: ID;
  student: {
    id: ID;
    displayName: string;
    email: string;
  };
  quiz: {
    id: ID;
    title: string;
    versionNumber: number;
  };
  status: AttemptStatus;
  startedAt: ISODateTime;
  submittedAt: ISODateTime | null;
  earnedPoints: number | null;
  possiblePoints: number;
  responses: GradedResponse[];
  integritySummary: IntegritySummary;
  gradeHistory: GradeRevision[];
}

interface OverrideResponseScoreRequest {
  points: number;
  reason: string;
}
```

Override validation requires `0 <= points <= possiblePoints` and a non-empty reason. The operation recalculates attempt totals in the same transaction and records the actor and previous value.

## Result contracts

```ts
type StudentResultStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "NEEDS_REVIEW"
  | "RELEASED";

interface StudentAttemptResult {
  attemptId: ID;
  quizId: ID;
  status: StudentResultStatus;
  attemptNumber: number;
  submittedAt: ISODateTime | null;
  releasedAt: ISODateTime | null;
  earnedPoints?: number;
  possiblePoints?: number;
  percentage?: number;
  responses?: Array<{
    questionId: ID;
    prompt: string;
    answer: AnswerValue;
    earnedPoints: number;
    possiblePoints: number;
    correctAnswer?: AnswerValue;
    feedback: string | null;
  }>;
}
```

The API omits score fields before release. After release, `responses` and `correctAnswer` still depend on the quiz's review settings.

## Heartbeat contract

```ts
interface AttemptHeartbeatRequest {
  clientInstanceId: string;
  lastKnownVersion: number;
}

interface AttemptHeartbeatResult {
  serverNow: ISODateTime;
  deadlineAt: ISODateTime | null;
  attemptStatus: AttemptStatus;
  currentVersion: number;
  anotherSessionDetected: boolean;
  nextHeartbeatAfterSeconds: number;
}
```

The heartbeat supports presence and deadline correction. It is not required to save an answer, and losing heartbeat connectivity must not discard locally queued work.

## Idempotency

Use an `Idempotency-Key` header for operations that must create one durable result despite retries:

- Attempt submission.
- Attempt reopening.
- Quiz publication when the client may retry after a timeout.
- Applying a reviewed Word import.
- Explicit regrade requests.
- Other future bulk or external-effect operations.

Store the key with the authenticated actor, operation scope, request fingerprint, response status, and response body for a bounded retention period. Replaying the same request returns the stored result. Reusing the key with different input returns `409 IDEMPOTENCY_CONFLICT`.

Autosave and event ingestion use their own client-generated mutation or event IDs in addition to optimistic versioning.

## Optimistic concurrency

- Attempt answer writes use integer `baseVersion` and return the incremented version.
- Draft quiz writes should use `updatedAt` or an explicit revision field to prevent one teacher/admin tab from silently overwriting another.
- A version conflict returns the authoritative state or a safe endpoint from which it can be fetched.
- Clients reconcile by field or answer and explicitly surface ambiguity. They never silently choose a stale client value over newer server data.

## Error codes

Stable error codes include:

| Code | Meaning |
| --- | --- |
| `AUTHENTICATION_REQUIRED` | No valid session |
| `INVALID_CREDENTIALS` | Login credentials were not accepted |
| `RESET_TOKEN_INVALID` | Password-reset token is not recognized |
| `RESET_TOKEN_EXPIRED` | Password-reset token has expired |
| `RESET_TOKEN_USED` | Password-reset token has already been consumed |
| `PASSWORD_POLICY_FAILED` | New password does not meet the configured policy |
| `ROLE_NOT_ALLOWED` | User role cannot perform the action |
| `RESOURCE_NOT_FOUND` | Resource is absent or hidden |
| `VALIDATION_FAILED` | One or more fields are invalid |
| `ENROLLMENT_REQUIRED` | Student is not actively enrolled |
| `ALREADY_ENROLLED` | Enrollment exists when a duplicate is not treated idempotently |
| `INVITE_EXPIRED` | Registration invite has expired |
| `INVITE_REVOKED` | Registration invite was revoked |
| `INVITE_LIMIT_REACHED` | Registration invite has no remaining uses |
| `QUIZ_NOT_EDITABLE` | Quiz state does not permit draft mutation |
| `QUIZ_NOT_PUBLISHABLE` | Publication validation failed |
| `IMPORT_FILE_UNSUPPORTED` | Uploaded file is not a supported `.docx` document |
| `IMPORT_FILE_TOO_LARGE` | Uploaded document exceeds the configured limit |
| `IMPORT_PARSE_FAILED` | Document could not be parsed safely |
| `IMPORT_NOT_READY` | Import is still parsing or is not available for review |
| `IMPORT_HAS_BLOCKING_ISSUES` | Included proposals require correction before apply |
| `IMPORT_ALREADY_APPLIED` | Import has already been applied to the draft |
| `QUIZ_NOT_AVAILABLE` | Quiz is early, closed, or otherwise unavailable |
| `ATTEMPT_LIMIT_REACHED` | Student has no remaining attempt |
| `ATTEMPT_FINALIZED` | Submitted attempt cannot be edited |
| `ATTEMPT_EXPIRED` | Deadline passed and the attempt is finalized |
| `VERSION_CONFLICT` | Client attempted to write from a stale version |
| `IDEMPOTENCY_CONFLICT` | Idempotency key was reused with different input |
| `RESULT_NOT_RELEASED` | Requested result data is not yet visible |
| `RATE_LIMITED` | Request exceeded an applicable limit |

Clients switch on `code`, use `message` as display text, and may map `fieldErrors` to form controls. They must not parse the human-readable message to determine behavior.

## Contract safety rules

- Never serialize Prisma models directly to API responses.
- Use explicit response projections for teacher/admin and student views.
- Never include password material, session secrets, raw invite-token hashes, internal audit metadata, or unpublished answer keys.
- Treat HTML or rich-text fields as untrusted and sanitize at render time according to the chosen content format.
- Keep numeric point fields finite and within server-defined limits.
- Set maximum lengths for names, prompts, answer text, instructions, reasons, and event batches in validation schemas.
- Reject unknown integrity metadata keys instead of storing arbitrary data.
- Log error codes, request IDs, actor IDs, and resource IDs where permitted; do not log raw answers or registration tokens.
