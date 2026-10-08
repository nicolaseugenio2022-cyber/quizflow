"use server";

import { requestPasswordReset, type AuthFormResult } from "@/lib/auth";

export async function requestResetAction(input: {
  email: string;
}): Promise<AuthFormResult> {
  return requestPasswordReset(input);
}
