import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const TONES = {
  error: {
    icon: CircleAlert,
    className: "border-destructive/40 text-destructive",
  },
  info: { icon: Info, className: "border-info/40" },
  success: { icon: CircleCheck, className: "border-success/40" },
} as const;

/** Form-level message. Rendered inside a live region by the caller. */
export function FormStatus({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TONES;
  title: string;
  children?: ReactNode;
}) {
  const { icon: Icon, className } = TONES[tone];
  return (
    <Alert className={cn("bg-card", className)}>
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      {children && (
        <AlertDescription className="text-muted-foreground">
          {children}
        </AlertDescription>
      )}
    </Alert>
  );
}

/** Copy shown while no authentication provider is connected. */
export const UNAVAILABLE_COPY = {
  signIn: {
    title: "Sign-in isn't available yet",
    body: "QuizFlow accounts are not open. Your school will share sign-in details when they are.",
  },
  recovery: {
    title: "Password reset isn't available yet",
    body: "QuizFlow accounts are not open. Your school will share sign-in details when they are.",
  },
} as const;
