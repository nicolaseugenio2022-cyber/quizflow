"use server";

import { resetPassword, type AuthFormResult } from "@/lib/auth";

export async function resetPasswordAction(input: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthFormResult> {
  return resetPassword(input);
}
