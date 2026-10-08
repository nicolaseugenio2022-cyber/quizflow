import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env/schema";

describe("parseServerEnv", () => {
  it("accepts a PostgreSQL URL", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://user:pw@localhost:5432/quizflow",
    });
    expect(env.NODE_ENV).toBe("development");
  });

  it("names the invalid variable without echoing its value", () => {
    const secret = "mysql://root:super-secret@db/quizflow";
    let message = "";
    try {
      parseServerEnv({ DATABASE_URL: secret });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("DATABASE_URL");
    expect(message).not.toContain("super-secret");
  });

  it("requires DATABASE_URL", () => {
    expect(() => parseServerEnv({})).toThrow(/DATABASE_URL/);
  });
});
