import { ZodError } from "zod";

import { toFieldErrors } from "@/lib/validation/common";

import { ApiError } from "./errors";
import type { ApiErrorResponse, DataResponse, PageResponse } from "./types";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function createRequestId(): string {
  return `req_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function jsonData<T>(
  data: T,
  init: { status?: number; requestId?: string } = {},
): Response {
  const body: DataResponse<T> = init.requestId
    ? { data, meta: { requestId: init.requestId } }
    : { data };
  return Response.json(body, { status: init.status ?? 200, headers: NO_STORE });
}

export function jsonPage<T>(
  data: T[],
  page: PageResponse<T>["page"],
  init: { requestId?: string } = {},
): Response {
  const body: PageResponse<T> = init.requestId
    ? { data, page, meta: { requestId: init.requestId } }
    : { data, page };
  return Response.json(body, { headers: NO_STORE });
}

/**
 * Converts any thrown value into the documented error envelope. Unexpected
 * errors become INTERNAL_ERROR with a generic message; internals never leak.
 */
export function jsonError(error: unknown, requestId: string): Response {
  let apiError: ApiError;
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = new ApiError(
      "VALIDATION_FAILED",
      "Some fields need attention.",
      {
        fieldErrors: toFieldErrors(error),
      },
    );
  } else {
    apiError = new ApiError(
      "INTERNAL_ERROR",
      "Something went wrong on our side. Try again in a moment.",
    );
  }

  const body: ApiErrorResponse = {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.fieldErrors && { fieldErrors: apiError.fieldErrors }),
      ...(apiError.details && { details: apiError.details }),
      requestId,
    },
  };
  return Response.json(body, { status: apiError.status, headers: NO_STORE });
}
