import type { Metadata } from "next";
import Link from "next/link";

import { AuthPanel } from "../_components/auth-panel";

import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title="Reset your password"
      description="Enter the email you use for QuizFlow. We'll send a link to choose a new password."
      footer={
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthPanel>
  );
}
