# QuizFlow Diagrams

These diagrams visualize the product and technical contracts defined in the other documents. Names are conceptual and may differ slightly from final Prisma model names, but their relationships and lifecycle rules must remain intact.

## System context

```mermaid
flowchart LR
    T[Teacher/Admin] -->|Administers owned classes, quizzes, and grades| WEB[QuizFlow web application]
    S[Student] -->|Joins classes and takes quizzes| WEB
    WEB -->|Server-rendered pages and JSON API| APP[Next.js application]
    APP -->|Queries and transactions through Prisma| DB[(PostgreSQL)]
    APP -.->|Adapter selected later| AUTH[Authentication provider]
    APP -.->|Structured, privacy-filtered events| OBS[Observability service]

    subgraph Browser
        WEB
        LOCAL[(Local pending-answer queue)]
        WEB <-->|Queue and recover unsent changes| LOCAL
    end
```

Dashed dependencies are intentionally vendor-neutral until the relevant provider is selected.

## Application boundaries

```mermaid
flowchart TB
    UI[Pages and components]
    RH[API route handlers]
    VAL[Validation schemas]
    PERM[Permission service]
    CLASS[Class and enrollment service]
    QUIZ[Quiz authoring and versioning service]
    IMPORT[Word import and parsing service]
    ATT[Attempt and recovery service]
    GRADE[Grading service]
    INT[Integrity-event service]
    AUDIT[Audit service]
    PRISMA[Prisma data access]
    PG[(PostgreSQL)]

    UI --> RH
    RH --> VAL
    RH --> PERM
    RH --> CLASS
    RH --> QUIZ
    RH --> IMPORT
    RH --> ATT
    RH --> GRADE
    RH --> INT
    CLASS --> AUDIT
    QUIZ --> AUDIT
    IMPORT --> AUDIT
    ATT --> AUDIT
    GRADE --> AUDIT
    CLASS --> PRISMA
    QUIZ --> PRISMA
    IMPORT --> PRISMA
    ATT --> PRISMA
    GRADE --> PRISMA
    INT --> PRISMA
    AUDIT --> PRISMA
    PERM --> PRISMA
    PRISMA --> PG
```

Route handlers authenticate, validate, authorize, call a domain service, and serialize an explicit response. Business rules do not live in React components or route handlers.

## Login and forgot-password sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as QuizFlow UI
    participant API as Authentication API
    participant DB as PostgreSQL
    participant Mail as Email adapter

    User->>UI: Submit email and password
    UI->>API: POST /auth/login
    API->>DB: Find account and verify credentials
    alt Credentials accepted
        API-->>UI: Set secure session and return safe redirect
        UI-->>User: Open returnTo path or dashboard
    else Credentials rejected
        API-->>UI: Generic invalid-credentials error
        UI-->>User: Show login error
    end

    User->>UI: Select Forgot password and submit email
    UI->>API: POST /auth/forgot-password
    API-->>UI: Generic 202 acknowledgement
    API->>DB: Create hashed, expiring token if account is eligible
    API->>Mail: Send single-use reset link if account is eligible
    UI-->>User: Show the same confirmation for every email

    User->>UI: Open reset link and enter new password
    UI->>API: POST /auth/reset-password with token
    API->>DB: Transaction: verify hash, update password, consume token
    API->>DB: Invalidate applicable existing sessions
    API-->>UI: Password reset succeeded
    UI-->>User: Return to login
```

The forgot-password response does not wait on or reveal email delivery. Invalid, expired, and used reset links cannot change a password and lead to a clear request-another-link state.

## Core data model

```mermaid
erDiagram
    USER ||--o| TEACHER_ADMIN_PROFILE : has
    USER ||--o| STUDENT_PROFILE : has
    USER ||--o{ PASSWORD_RESET_TOKEN : requests
    USER ||--o{ CLASS : owns
    USER ||--o{ ENROLLMENT : receives
    CLASS ||--o{ ENROLLMENT : contains
    CLASS ||--o{ REGISTRATION_INVITE : issues
    CLASS ||--o{ QUIZ : contains
    QUIZ ||--o{ QUIZ_IMPORT : receives
    QUIZ ||--o{ QUIZ_VERSION : publishes
    QUIZ_VERSION ||--|{ QUESTION_SNAPSHOT : contains
    QUESTION_SNAPSHOT ||--o{ OPTION_SNAPSHOT : offers
    ENROLLMENT ||--o{ ATTEMPT : authorizes
    QUIZ_VERSION ||--o{ ATTEMPT : instantiates
    ATTEMPT ||--o{ RESPONSE : contains
    QUESTION_SNAPSHOT ||--o{ RESPONSE : answers
    ATTEMPT ||--o{ INTEGRITY_EVENT : records
    RESPONSE ||--o{ GRADE_REVISION : audits
    CLASS ||--o{ AUDIT_EVENT : records

    USER {
        string id PK
        string email UK
        string displayName
        enum role
        enum themePreference
    }

    PASSWORD_RESET_TOKEN {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }

    CLASS {
        string id PK
        string teacherAdminId FK
        string name
        string subject
        enum academicLevel
        string schoolYear
        string term
        enum status
    }

    ENROLLMENT {
        string id PK
        string classId FK
        string studentId FK
        enum status
        enum source
        datetime enrolledAt
    }

    REGISTRATION_INVITE {
        string id PK
        string classId FK
        string tokenHash UK
        datetime expiresAt
        int maxUses
        int useCount
        datetime revokedAt
    }

    QUIZ {
        string id PK
        string classId FK
        string title
        enum status
        json draftSettings
    }

    QUIZ_IMPORT {
        string id PK
        string quizId FK
        string originalFileName
        string checksumSha256
        enum status
        json proposals
        json issues
        datetime createdAt
        datetime appliedAt
    }

    QUIZ_VERSION {
        string id PK
        string quizId FK
        int versionNumber
        json settingsSnapshot
        decimal totalPoints
        datetime publishedAt
    }

    QUESTION_SNAPSHOT {
        string id PK
        string quizVersionId FK
        enum type
        string prompt
        decimal points
        int position
        json gradingRule
    }

    OPTION_SNAPSHOT {
        string id PK
        string questionSnapshotId FK
        string label
        boolean isCorrect
        int position
    }

    ATTEMPT {
        string id PK
        string enrollmentId FK
        string quizVersionId FK
        int attemptNumber
        enum status
        int version
        datetime startedAt
        datetime deadlineAt
        datetime submittedAt
        decimal earnedPoints
    }

    RESPONSE {
        string id PK
        string attemptId FK
        string questionSnapshotId FK
        json answerValue
        enum gradingState
        decimal earnedPoints
        datetime updatedAt
    }

    INTEGRITY_EVENT {
        string id PK
        string attemptId FK
        string clientEventId
        enum type
        enum severity
        datetime occurredAt
        datetime receivedAt
        json metadata
    }

    GRADE_REVISION {
        string id PK
        string responseId FK
        string teacherAdminId FK
        decimal previousPoints
        decimal newPoints
        string reason
        datetime createdAt
    }

    AUDIT_EVENT {
        string id PK
        string classId FK
        string actorId FK
        string action
        string targetType
        string targetId
        datetime createdAt
    }
```

Recommended uniqueness rules:

- `USER.normalizedEmail` is unique.
- `PASSWORD_RESET_TOKEN.tokenHash` is unique and raw tokens are never stored.
- `(ENROLLMENT.classId, ENROLLMENT.studentId)` is unique.
- `REGISTRATION_INVITE.tokenHash` is unique.
- `(QUIZ_VERSION.quizId, QUIZ_VERSION.versionNumber)` is unique.
- `(ATTEMPT.enrollmentId, ATTEMPT.quizVersionId, ATTEMPT.attemptNumber)` is unique.
- `(RESPONSE.attemptId, RESPONSE.questionSnapshotId)` is unique.
- `(INTEGRITY_EVENT.attemptId, INTEGRITY_EVENT.clientEventId)` is unique.

## Class registration sequence

```mermaid
sequenceDiagram
    autonumber
    actor TeacherAdmin as Teacher/Admin
    participant UI as QuizFlow UI
    participant API as Next.js API
    participant DB as PostgreSQL
    actor Student

    TeacherAdmin->>UI: Create registration invite
    UI->>API: POST /classes/{classId}/invites
    API->>API: Authorize class owner
    API->>DB: Store hash, expiry, and usage limit
    DB-->>API: Invite record
    API-->>UI: Raw token and join URL once
    UI-->>TeacherAdmin: Display QR code

    Student->>UI: Scan /join/{token}
    UI->>API: GET /registration-invites/{token}
    API->>DB: Resolve token hash and state
    DB-->>API: Safe class preview
    API-->>UI: Class and teacher identity
    Student->>UI: Confirm registration
    UI->>API: POST /registration-invites/{token}/redeem
    API->>DB: Transaction: validate invite, upsert enrollment, increment use count
    DB-->>API: Enrollment
    API-->>UI: Enrollment and created flag
    UI-->>Student: Open class
```

The redemption transaction locks or atomically updates the invite so concurrent scans cannot exceed its usage limit.

## Word-to-quiz import sequence

```mermaid
sequenceDiagram
    autonumber
    actor TeacherAdmin as Teacher/Admin
    participant UI as Quiz builder
    participant API as Import API
    participant Parser as DOCX parser
    participant DB as PostgreSQL

    TeacherAdmin->>UI: Select Import Word document
    UI->>API: POST .docx as multipart/form-data
    API->>API: Authorize class owner and validate editable draft
    API->>API: Verify type, size, archive safety, and checksum
    API->>DB: Create import operation
    API->>Parser: Extract and sanitize supported document content
    Parser-->>API: Question proposals, warnings, and unparsed blocks
    API->>DB: Store review representation and status
    API-->>UI: Return REVIEW_READY import
    UI-->>TeacherAdmin: Show editable proposals and warnings
    TeacherAdmin->>UI: Correct, exclude, and reorder proposals
    UI->>API: PATCH reviewed proposals
    API->>DB: Save review state
    TeacherAdmin->>UI: Confirm import
    UI->>API: POST /apply with Idempotency-Key
    API->>DB: Transaction: validate, append questions, mark applied, audit
    DB-->>API: Created question IDs
    API-->>UI: Applied result
    UI-->>TeacherAdmin: Return to editable quiz draft
```

Upload and parsing never publish the quiz. Repeating the same apply request returns the original result and does not duplicate questions.

## Quiz publication and attempt snapshot

```mermaid
flowchart LR
    D[Editable quiz draft] --> V{Publication validation}
    V -->|Issues| D
    V -->|Valid| P[Immutable quiz version]
    P --> A1[Student attempt snapshot A]
    P --> A2[Student attempt snapshot B]
    D2[Later draft revision] --> V2{Publication validation}
    V2 --> P2[New immutable version]
    P2 --> A3[New student attempts]

    A1 -. stays on .-> P
    A2 -. stays on .-> P
```

Publishing a later version does not mutate attempts already tied to an earlier version.

## Student attempt and autosave sequence

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as Attempt UI
    participant Queue as Local pending queue
    participant API as Attempt API
    participant DB as PostgreSQL
    participant Grade as Grading service

    Student->>UI: Start quiz
    UI->>API: POST /quizzes/{quizId}/attempts
    API->>DB: Check enrollment, availability, limit, resumable attempt
    API->>DB: Create attempt and immutable snapshot if needed
    DB-->>API: Attempt, deadline, version
    API-->>UI: Student-safe attempt snapshot

    Student->>UI: Change answer
    UI->>Queue: Persist pending mutation
    UI->>API: PATCH /attempts/{id}/answers with baseVersion
    API->>DB: Compare version and upsert response in transaction
    DB-->>API: Incremented version and savedAt
    API-->>UI: Save acknowledgement
    UI->>Queue: Remove acknowledged mutation

    alt Connection unavailable
        UI->>Queue: Keep later mutations locally
        UI-->>Student: Show Offline, changes queued
    else Stale base version
        API-->>UI: 409 VERSION_CONFLICT and authoritative answers
        UI->>Queue: Reconcile pending changes
        UI-->>Student: Surface ambiguity if both copies changed
    end

    Student->>UI: Submit
    UI->>API: POST /attempts/{id}/submit with Idempotency-Key
    API->>DB: Apply allowed final delta and finalize
    API->>Grade: Grade snapshot responses
    Grade->>DB: Store scores and review status
    DB-->>API: Final attempt result
    API-->>UI: Idempotent submission response
    UI-->>Student: Show confirmation or released result
```

## Attempt state machine

```mermaid
stateDiagram-v2
    [*] --> IN_PROGRESS: Start attempt
    IN_PROGRESS --> IN_PROGRESS: Autosave answers and events
    IN_PROGRESS --> SUBMITTED: Submit with ungraded manual responses
    IN_PROGRESS --> GRADED: Submit and all responses auto-grade
    SUBMITTED --> NEEDS_REVIEW: Grading identifies manual review
    SUBMITTED --> GRADED: Grading completes automatically
    NEEDS_REVIEW --> GRADED: Teacher/admin completes review
    GRADED --> REOPENED: Teacher/admin reopens with reason and deadline
    NEEDS_REVIEW --> REOPENED: Teacher/admin reopens with reason and deadline
    REOPENED --> REOPENED: Autosave resumed answers
    REOPENED --> NEEDS_REVIEW: Resubmit with review required
    REOPENED --> GRADED: Resubmit and grade complete
```

`SUBMITTED` may be short-lived during synchronous grading or longer-lived if grading is moved to a background job. Student result visibility is a separate release policy, not an attempt lifecycle state.

## Deadline calculation

```mermaid
flowchart TD
    START[Attempt starts] --> TL{Quiz has time limit?}
    TL -->|Yes| DUR[Candidate: startedAt + timeLimit]
    TL -->|No| NODUR[No duration candidate]
    DUR --> CLOSE{Quiz has availableUntil?}
    NODUR --> CLOSE
    CLOSE -->|Yes| END[Candidate: availableUntil]
    CLOSE -->|No| NOEND[No closing candidate]
    END --> EXT{Attempt has teacher/admin extension?}
    NOEND --> EXT
    EXT -->|Yes| POLICY[Apply explicit extension policy]
    EXT -->|No| MIN[Use earliest applicable candidate]
    POLICY --> DEADLINE[Persist authoritative deadlineAt]
    MIN --> DEADLINE
    DEADLINE --> CLIENT[Client renders remaining time from serverNow]
```

The server persists the authoritative `deadlineAt` on the attempt. The client timer is presentational and periodically corrects itself from server time.

## Integrity-event pipeline

```mermaid
flowchart LR
    B[Approved browser signals] --> N[Normalize and allowlist metadata]
    N --> Q[Client event buffer]
    Q -->|Batch with stable event IDs| API[Event ingestion API]
    API --> AUTH[Verify attempt ownership and active state]
    AUTH --> DEDUPE[Deduplicate by attempt and event ID]
    DEDUPE --> DB[(Append-only event store)]
    DB --> SUM[Integrity summary]
    DB --> TL[Chronological teacher/admin timeline]
    SUM --> REVIEW[Teacher/admin review]
    TL --> REVIEW

    REVIEW -. no automatic score change .-> SCORE[Grade]
```

The event pipeline excludes clipboard contents, keystrokes, screenshots, audio, video, and unrelated browsing data.

## Theme resolution

```mermaid
flowchart TD
    LOAD[Application load] --> SAVED{Saved preference?}
    SAVED -->|LIGHT| LIGHT[Apply light theme]
    SAVED -->|DARK| DARK[Apply dark theme]
    SAVED -->|SYSTEM or none| MEDIA{System prefers dark?}
    MEDIA -->|Yes| DARK
    MEDIA -->|No| LIGHT
    CHANGE[User changes preference] --> PERSIST[Persist preference]
    PERSIST --> APPLY[Apply before next paint where possible]
    APPLY --> WATCH{Preference is SYSTEM?}
    WATCH -->|Yes| LISTEN[Follow system changes]
    WATCH -->|No| FIXED[Keep selected theme]
```

## Authorization decision path

```mermaid
flowchart TD
    REQ[Request] --> SESSION{Valid session?}
    SESSION -->|No| E401[401 Authentication required]
    SESSION -->|Yes| ROLE{Role permits action?}
    ROLE -->|No| E403[403 Role not allowed]
    ROLE -->|Yes| RESOURCE{Resource exists in caller scope?}
    RESOURCE -->|No or hidden| E404[404 Resource not found]
    RESOURCE -->|Yes| REL{Required ownership or enrollment active?}
    REL -->|No| DENY[403 or privacy-preserving 404]
    REL -->|Yes| STATE{Resource state permits action?}
    STATE -->|No| E409[409 State conflict]
    STATE -->|Yes| VALID{Input and domain rules valid?}
    VALID -->|No| E422[422 Validation failed]
    VALID -->|Yes| ACTION[Perform transactional action]
```

## Documentation relationships

```mermaid
flowchart TD
    SOT[source-of-truth.md] --> PROJECT[project.md]
    SOT --> ROUTES[api-route.md]
    PROJECT --> ROUTES
    ROUTES --> API[api.md]
    SOT --> API
    SOT --> DIAGRAMS[diagrams.md]
    PROJECT --> DIAGRAMS
    ROUTES --> DIAGRAMS
    API --> DIAGRAMS
```

When a diagram conflicts with a written contract, update the diagram to match the higher-precedence document rather than treating the diagram as a separate decision source.
