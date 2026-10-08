# QuizFlow API Route Inventory

## Conventions

- Application endpoints live under `/api/v1`.
- Routes use Next.js App Router Route Handlers.
- Request and response bodies use JSON unless a future endpoint explicitly documents another media type.
- Resource IDs are opaque strings. Clients must not infer meaning from them.
- Timestamps use ISO 8601 UTC strings.
- Authentication is required unless a route is marked public.
- Authorization is checked for the target resource on every request.
- State-changing routes validate `Content-Type: application/json` and the application's CSRF strategy.
- Collection routes use cursor pagination: `?cursor=<opaque>&limit=<1..100>`.
- Responses that must reflect current quiz state use `Cache-Control: no-store`.
- Error bodies follow the envelope in [api.md](./api.md).
- Authentication-provider callbacks may live outside `/api/v1`; their exact paths will be selected with the provider.

## Access shorthand

| Label | Meaning |
| --- | --- |
| Public | No authenticated session required |
| User | Any authenticated user |
| Teacher/admin | Authenticated user with the `TEACHER_ADMIN` role |
| Class teacher | Teacher/admin who owns and administers the target class |
| Enrolled student | Student with an active enrollment in the target class |
| Attempt student | Student who owns the target attempt |

## Authentication and password recovery

Product pages:

```text
/login
/forgot-password
/reset-password?token={rawToken}
```

The reset page must remove the raw token from the visible URL after safely reading it and must prevent referrer leakage. If the selected authentication provider uses hosted pages or different callback paths, its adapter must preserve the same QuizFlow flow and security guarantees.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Public | Validate email and password and establish a session |
| `POST` | `/api/v1/auth/logout` | User | End the current session |
| `POST` | `/api/v1/auth/forgot-password` | Public | Accept an email and return a generic acknowledgement |
| `POST` | `/api/v1/auth/reset-password` | Public | Consume a reset token and set a new password |
| `POST` | `/api/v1/auth/change-password` | User | Change the current password after verifying the existing password |

Login returns one generic invalid-credentials response for an unknown email, wrong password, or otherwise unusable account. Forgot-password always returns `202 Accepted` with the same public representation. Reset tokens are random, stored only as hashes, expire, and are consumed once in the same transaction that updates the password. Authentication and email providers may implement the underlying work, but these public semantics remain stable.

## Session and profile

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/me` | User | Return the current user, role, and profile summary |
| `PATCH` | `/api/v1/me` | User | Update permitted profile and preference fields |
| `GET` | `/api/v1/me/dashboard` | User | Return a role-specific dashboard summary |

Authentication-provider callbacks and verification endpoints depend on the selected adapter. Login must preserve the `returnTo` destination for class invites and quizzes after validating that it is a safe local path.

## Classes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/classes` | User | List owned or enrolled classes based on role |
| `POST` | `/api/v1/classes` | Teacher/admin | Create a class |
| `GET` | `/api/v1/classes/{classId}` | Class teacher or enrolled student | Get class details appropriate to the caller |
| `PATCH` | `/api/v1/classes/{classId}` | Class teacher | Update class metadata or archive state |
| `GET` | `/api/v1/classes/{classId}/members` | Class teacher | List class enrollments and student summaries |
| `POST` | `/api/v1/classes/{classId}/members` | Class teacher | Manually enroll an existing student |
| `PATCH` | `/api/v1/classes/{classId}/members/{enrollmentId}` | Class teacher | Activate or deactivate an enrollment |
| `DELETE` | `/api/v1/classes/{classId}/members/{enrollmentId}` | Class teacher | Remove a never-participated enrollment when policy permits |

`DELETE` must return `409 CONFLICT` when the enrollment has attempt history. In that case, the teacher deactivates it with `PATCH` so historical records remain intact.

## Class registration invites

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/classes/{classId}/invites` | Class teacher | List active and recent invites without exposing token values |
| `POST` | `/api/v1/classes/{classId}/invites` | Class teacher | Create an expiring registration invite and return its token once |
| `DELETE` | `/api/v1/classes/{classId}/invites/{inviteId}` | Class teacher | Revoke an invite |
| `GET` | `/api/v1/registration-invites/{token}` | Public | Resolve safe class and teacher preview data for a token |
| `POST` | `/api/v1/registration-invites/{token}/redeem` | Student | Confirm registration and create or restore enrollment |

The token route accepts the raw token because it is the possession credential delivered in the join URL. Logs must redact it. The database stores only its hash. Invite redemption is transactional and idempotent for a student/class pair.

Recommended public join page:

```text
/join/{token}
```

The page resolves the invite, asks the student to authenticate when needed, shows class identity, and calls the redemption endpoint only after confirmation.

## Quizzes and versions

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/classes/{classId}/quizzes` | Class teacher or enrolled student | List quizzes visible to the caller |
| `POST` | `/api/v1/classes/{classId}/quizzes` | Class teacher | Create a draft quiz |
| `GET` | `/api/v1/quizzes/{quizId}` | Class teacher or enrolled student | Return teacher draft detail or student-safe quiz summary |
| `PATCH` | `/api/v1/quizzes/{quizId}` | Class teacher | Update draft metadata and settings |
| `DELETE` | `/api/v1/quizzes/{quizId}` | Class teacher | Delete a draft with no attempts |
| `POST` | `/api/v1/quizzes/{quizId}/validate` | Class teacher | Return publication validation results |
| `POST` | `/api/v1/quizzes/{quizId}/publish` | Class teacher | Publish an immutable quiz version |
| `POST` | `/api/v1/quizzes/{quizId}/close` | Class teacher | Prevent new attempts and apply configured close policy |
| `POST` | `/api/v1/quizzes/{quizId}/reopen` | Class teacher | Make a closed quiz available under explicit settings |
| `GET` | `/api/v1/quizzes/{quizId}/versions` | Class teacher | List publication versions |
| `GET` | `/api/v1/quizzes/{quizId}/versions/{versionId}` | Class teacher | Inspect one immutable version |

Student responses from `GET /quizzes/{quizId}` must never include answer keys, correctness flags, grading rules, unpublished content, or another student's attempt data.

## Quiz questions

Question routes operate on the editable draft. Once published, that version is immutable.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/quizzes/{quizId}/questions` | Class teacher | Add a draft question |
| `PATCH` | `/api/v1/quizzes/{quizId}/questions/{questionId}` | Class teacher | Update a draft question and its answer rule |
| `DELETE` | `/api/v1/quizzes/{quizId}/questions/{questionId}` | Class teacher | Remove a draft question |
| `PUT` | `/api/v1/quizzes/{quizId}/questions/order` | Class teacher | Replace the draft question order |
| `POST` | `/api/v1/quizzes/{quizId}/questions/{questionId}/duplicate` | Class teacher | Duplicate a draft question |

Question writes reject published-only versions with `409 QUIZ_NOT_EDITABLE`. A teacher may create a new draft revision from the latest published version when post-publication editing is supported.

## Word question imports

Word imports operate only on an editable quiz draft. The upload endpoint is the documented exception to the JSON-only request convention and accepts `multipart/form-data` with one `.docx` file.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/quizzes/{quizId}/imports/word` | Class teacher | Upload a `.docx` and create a parsing operation |
| `GET` | `/api/v1/quizzes/{quizId}/imports/{importId}` | Class teacher | Return parsing status, proposed questions, warnings, and unparsed content |
| `PATCH` | `/api/v1/quizzes/{quizId}/imports/{importId}` | Class teacher | Save teacher corrections, exclusions, and proposal order during review |
| `POST` | `/api/v1/quizzes/{quizId}/imports/{importId}/apply` | Class teacher | Idempotently append confirmed proposals to the quiz draft |
| `DELETE` | `/api/v1/quizzes/{quizId}/imports/{importId}` | Class teacher | Discard an unapplied import and its temporary file |

Upload behavior:

- Validate the authenticated class owner and editable quiz state before processing the file.
- Accept only a real `.docx` Open XML document within the configured size limit; do not trust the extension or client MIME type alone.
- Reject encrypted, macro-enabled, corrupted, or archive-bomb-like files.
- Compute a checksum, sanitize extracted text, and never execute embedded content or external relationships.
- Return `202 Accepted` when parsing continues asynchronously or `201 Created` when parsing completes within the request.
- Do not add questions during upload.

Apply behavior:

- Requires an `Idempotency-Key` header.
- Rejects imports with unresolved blocking warnings.
- Appends only included, validated proposals and preserves their reviewed order.
- Runs in one transaction, records an audit event, marks the import applied, and returns the created question IDs.
- Repeating the same apply request returns the original result without duplicating questions.

## Student attempts

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/quizzes/{quizId}/attempt-eligibility` | Enrolled student | Return availability, attempt count, deadline preview, and resumable attempt |
| `POST` | `/api/v1/quizzes/{quizId}/attempts` | Enrolled student | Start a new attempt or return the existing resumable attempt |
| `GET` | `/api/v1/attempts/{attemptId}` | Attempt student | Restore the student-safe attempt snapshot and saved answers |
| `PATCH` | `/api/v1/attempts/{attemptId}/answers` | Attempt student | Autosave one or more changed answers using optimistic concurrency |
| `POST` | `/api/v1/attempts/{attemptId}/events` | Attempt student | Append a batch of integrity events |
| `POST` | `/api/v1/attempts/{attemptId}/heartbeat` | Attempt student | Refresh presence and detect another active session |
| `POST` | `/api/v1/attempts/{attemptId}/submit` | Attempt student | Idempotently finalize and grade the attempt |

Attempt creation is transactional. It checks active enrollment, availability, attempt limits, and an existing in-progress attempt before allocating the attempt number and snapshot.

### Autosave route rules

`PATCH /attempts/{attemptId}/answers`:

- Accepts a batch of only the answers changed since the last acknowledgement.
- Requires `baseVersion` from the client's most recent server state.
- Returns the new version and authoritative save time.
- Returns `409 VERSION_CONFLICT` with current answer state when the version is stale.
- Returns `409 ATTEMPT_FINALIZED` after submission.
- Returns `410 ATTEMPT_EXPIRED` when the deadline has passed and finalization is complete.

### Submit route rules

`POST /attempts/{attemptId}/submit`:

- Requires an `Idempotency-Key` header.
- May include the final known client version and a final answer delta.
- Uses the server clock and transactionally applies an allowed final delta, finalizes the attempt, grades supported answers, and records the result.
- Returns the same final representation for repeated requests with the same key.
- Rejects a conflicting repeated key with `409 IDEMPOTENCY_CONFLICT`.

## Teacher/admin results and review

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/quizzes/{quizId}/results` | Class teacher | List attempts, completion state, score, and review status |
| `GET` | `/api/v1/attempts/{attemptId}/review` | Class teacher | Return answers, scoring, grade history, and integrity summary |
| `GET` | `/api/v1/attempts/{attemptId}/events` | Class teacher | Return the paginated integrity timeline |
| `PATCH` | `/api/v1/attempts/{attemptId}/responses/{responseId}/score` | Class teacher | Override a response score with a reason |
| `POST` | `/api/v1/attempts/{attemptId}/reopen` | Class teacher | Reopen an attempt under an explicit new deadline |
| `POST` | `/api/v1/quizzes/{quizId}/regrade` | Class teacher | Start or perform an explicit audited regrade operation |
| `POST` | `/api/v1/quizzes/{quizId}/release-results` | Class teacher | Release eligible results to students |
| `POST` | `/api/v1/quizzes/{quizId}/hide-results` | Class teacher | Hide results from students without deleting grades |

An attempt reopen must require a reason, new deadline, and idempotency key. It creates an audit event and does not delete the original submission or integrity events.

## Student results

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/quizzes/{quizId}/my-attempts` | Enrolled student | List the student's attempts and public result states |
| `GET` | `/api/v1/attempts/{attemptId}/result` | Attempt student | Return the released result and allowed answer review |

Before release, the result endpoint returns a status representation such as `SUBMITTED` or `NEEDS_REVIEW`, without score or answer-key fields that policy keeps hidden.

## Audit records

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/classes/{classId}/audit-log` | Class teacher | List sensitive class and quiz actions |

The audit log includes publication, closing and reopening, result release, grade overrides, attempt reopen, invite lifecycle changes, and other policy-sensitive actions. It must not include raw tokens or secret values.

## Next.js route layout

Representative mapping:

```text
app/api/v1/
  auth/login/route.ts
  auth/logout/route.ts
  auth/forgot-password/route.ts
  auth/reset-password/route.ts
  auth/change-password/route.ts
  me/route.ts
  me/dashboard/route.ts
  classes/route.ts
  classes/[classId]/route.ts
  classes/[classId]/members/route.ts
  classes/[classId]/members/[enrollmentId]/route.ts
  classes/[classId]/invites/route.ts
  classes/[classId]/invites/[inviteId]/route.ts
  classes/[classId]/quizzes/route.ts
  registration-invites/[token]/route.ts
  registration-invites/[token]/redeem/route.ts
  quizzes/[quizId]/route.ts
  quizzes/[quizId]/validate/route.ts
  quizzes/[quizId]/publish/route.ts
  quizzes/[quizId]/questions/route.ts
  quizzes/[quizId]/questions/[questionId]/route.ts
  quizzes/[quizId]/imports/word/route.ts
  quizzes/[quizId]/imports/[importId]/route.ts
  quizzes/[quizId]/imports/[importId]/apply/route.ts
  quizzes/[quizId]/attempt-eligibility/route.ts
  quizzes/[quizId]/attempts/route.ts
  quizzes/[quizId]/results/route.ts
  attempts/[attemptId]/route.ts
  attempts/[attemptId]/answers/route.ts
  attempts/[attemptId]/events/route.ts
  attempts/[attemptId]/heartbeat/route.ts
  attempts/[attemptId]/submit/route.ts
  attempts/[attemptId]/review/route.ts
  attempts/[attemptId]/result/route.ts
```

Route handlers should stay thin: authenticate, validate, call a domain service, and serialize the result. Grading, permission, invite, and attempt-lifecycle logic belongs in shared server-only modules.

## Status-code policy

| Status | Use |
| --- | --- |
| `200 OK` | Successful read or idempotent mutation returning an existing resource |
| `201 Created` | Resource created |
| `204 No Content` | Successful mutation with no response body |
| `400 Bad Request` | Malformed JSON or invalid query syntax |
| `401 Unauthorized` | No valid authenticated session |
| `403 Forbidden` | Authenticated caller lacks permission |
| `404 Not Found` | Resource absent or intentionally hidden from the caller |
| `409 Conflict` | Version, state, duplicate, or idempotency conflict |
| `410 Gone` | Expired invite or finalized/expired operation that cannot continue |
| `422 Unprocessable Entity` | Structurally valid request fails field or domain validation |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server failure with a request ID |

Prefer `404` instead of revealing that another user's private resource exists. Use `403` when the resource is already known safely, such as an authenticated role restriction on a visible class.

## Rate-limit groups

Exact thresholds depend on deployment capacity and classroom load. Keep separate policies for:

- Authentication and account recovery.
- Public invite resolution and redemption.
- Attempt creation and submission.
- Autosave writes.
- Integrity-event batches and heartbeat traffic.
- Teacher/admin bulk operations and exports.

Rate limiting must allow normal autosave bursts during large classroom sessions and return a retry hint without dropping locally queued answers.
