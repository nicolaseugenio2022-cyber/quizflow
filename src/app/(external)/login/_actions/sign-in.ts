"use server";

import { signIn, type AuthFormResult } from "@/lib/auth";

export async function signInAction(input: {
  email: string;
  password: string;
  returnTo?: string;
}): Promise<AuthFormResult> {
  return signIn(input);
}
