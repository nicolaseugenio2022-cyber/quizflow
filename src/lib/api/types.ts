/** Response envelopes and error codes from docs/api.md. */

export type ID = string;
export type ISODateTime = string;

export interface ResponseMeta {
  requestId: string;
}

export interface DataResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface PageResponse<T> {
  data: T[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  meta?: ResponseMeta;
}

/**
 * Stable codes from docs/api.md "Error codes". INTERNAL_ERROR covers the
 * documented `500` with a request ID.
 */
export const API_ERROR_CODES = [
  "AUTHENTICATION_REQUIRED",
  "INVALID_CREDENTIALS",
  "RESET_TOKEN_INVALID",
  "RESET_TOKEN_EXPIRED",
  "RESET_TOKEN_USED",
  "PASSWORD_POLICY_FAILED",
  "ROLE_NOT_ALLOWED",
  "RESOURCE_NOT_FOUND",
  "VALIDATION_FAILED",
  "ENROLLMENT_REQUIRED",
  "ALREADY_ENROLLED",
  "INVITE_EXPIRED",
  "INVITE_REVOKED",
  "INVITE_LIMIT_REACHED",
  "QUIZ_NOT_EDITABLE",
  "QUIZ_NOT_PUBLISHABLE",
  "QUIZ_NOT_AVAILABLE",
  "ATTEMPT_LIMIT_REACHED",
  "ATTEMPT_FINALIZED",
  "ATTEMPT_EXPIRED",
  "VERSION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "RESULT_NOT_RELEASED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  details?: Record<string, unknown>;
  requestId: string;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}
