import type { Metadata } from "next";

import { ResetPasswordView } from "./_components/reset-password-view";

export const metadata: Metadata = {
  title: "Choose a new password",
  // The reset token is in this page's URL; never send it to another origin.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
