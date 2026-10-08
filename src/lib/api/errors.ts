import type { ApiErrorCode } from "./types";

/** Default HTTP status for each error code (docs/api-route.md status policy). */
export const ERROR_STATUS: Record<ApiErrorCode, number> = {
  AUTHENTICATION_REQUIRED: 401,
  INVALID_CREDENTIALS: 401,
  RESET_TOKEN_INVALID: 422,
  RESET_TOKEN_EXPIRED: 410,
  RESET_TOKEN_USED: 410,
  PASSWORD_POLICY_FAILED: 422,
  ROLE_NOT_ALLOWED: 403,
  RESOURCE_NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  ENROLLMENT_REQUIRED: 403,
  ALREADY_ENROLLED: 409,
  INVITE_EXPIRED: 410,
  INVITE_REVOKED: 410,
  INVITE_LIMIT_REACHED: 410,
  QUIZ_NOT_EDITABLE: 409,
  QUIZ_NOT_PUBLISHABLE: 422,
  QUIZ_NOT_AVAILABLE: 409,
  ATTEMPT_LIMIT_REACHED: 409,
  ATTEMPT_FINALIZED: 409,
  ATTEMPT_EXPIRED: 410,
  VERSION_CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  RESULT_NOT_RELEASED: 403,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

/**
 * Expected domain failure. Services throw it; route handlers convert it to the
 * error envelope. `message` must be safe to show to the user.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: {
      status?: number;
      fieldErrors?: Record<string, string[]>;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? ERROR_STATUS[code];
    this.fieldErrors = options.fieldErrors;
    this.details = options.details;
  }
}
