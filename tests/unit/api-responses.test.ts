import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { jsonData, jsonError } from "@/lib/api/responses";
import type { ApiErrorResponse } from "@/lib/api/types";

describe("API envelopes", () => {
  it("wraps data and disables caching", async () => {
    const response = jsonData(
      { ok: true },
      { status: 201, requestId: "req_1" },
    );
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      data: { ok: true },
      meta: { requestId: "req_1" },
    });
  });

  it("maps ApiError to its documented status", async () => {
    const response = jsonError(
      new ApiError("VERSION_CONFLICT", "This attempt has newer saved answers."),
      "req_2",
    );
    expect(response.status).toBe(409);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toMatchObject({
      code: "VERSION_CONFLICT",
      requestId: "req_2",
    });
  });

  it("turns Zod errors into VALIDATION_FAILED with field errors", async () => {
    const result = z.object({ name: z.string() }).safeParse({});
    const response = jsonError(result.error, "req_3");
    expect(response.status).toBe(422);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.fieldErrors).toHaveProperty("name");
  });

  it("hides internal error details", async () => {
    const response = jsonError(
      new Error("connect ECONNREFUSED db.internal:5432"),
      "req_4",
    );
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).toContain("INTERNAL_ERROR");
  });
});
