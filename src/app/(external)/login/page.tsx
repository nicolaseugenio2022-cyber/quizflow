import type { Metadata } from "next";

import { AuthPanel } from "../_components/auth-panel";

import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthPanel
      title="Sign in"
      description="Use the email and password your school registered for QuizFlow."
      footer="Teachers and students sign in here. Your role decides which dashboard opens."
    >
      <LoginForm />
    </AuthPanel>
  );
}
