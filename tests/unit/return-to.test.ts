import { describe, expect, it } from "vitest";

import { safeReturnTo } from "@/lib/auth/return-to";

describe("safeReturnTo", () => {
  it.each([
    ["/join/abc", "/join/abc"],
    ["/student/dashboard?tab=due", "/student/dashboard?tab=due"],
    ["/a/../b", "/b"],
  ])("keeps local path %s", (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });

  it.each([
    "https://evil.example/",
    "//evil.example/path",
    "/\\evil.example",
    "javascript:alert(1)",
    "/ok\nSet-Cookie:x",
    "relative/path",
    "",
  ])("rejects %j", (input) => {
    expect(safeReturnTo(input)).toBeNull();
  });

  it("rejects missing values", () => {
    expect(safeReturnTo(undefined)).toBeNull();
    expect(safeReturnTo(null)).toBeNull();
  });
});
