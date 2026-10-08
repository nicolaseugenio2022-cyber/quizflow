"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validation/auth";

import { FormStatus, UNAVAILABLE_COPY } from "../../_components/form-status";
import { requestResetAction } from "../_actions/request-reset";

type Status = "idle" | "sent" | "unavailable" | "failed";

/** Same confirmation for every valid email, so no account is revealed. */
const SENT_MESSAGE =
  "If an account matches that email, a password-reset link will be sent.";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    startTransition(async () => {
      try {
        const result = await requestResetAction(values);
        setStatus(result.status === "unavailable" ? "unavailable" : "sent");
      } catch {
        setStatus("failed");
      }
    });
  }

  return (
    <Form {...form}>
      <form
        noValidate
        method="post"
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-5"
      >
        <div aria-live="polite" aria-atomic="true" className="empty:hidden">
          {status === "sent" && (
            <FormStatus tone="success" title="Check your email">
              {SENT_MESSAGE} The link expires, so use it soon.
            </FormStatus>
          )}
          {status === "unavailable" && (
            <FormStatus tone="info" title={UNAVAILABLE_COPY.recovery.title}>
              {UNAVAILABLE_COPY.recovery.body}
            </FormStatus>
          )}
          {status === "failed" && (
            <FormStatus tone="error" title="We couldn't reach QuizFlow">
              Check your connection and try again.
            </FormStatus>
          )}
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  className="h-11 text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="h-11 text-base"
          disabled={pending}
        >
          {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
          {pending ? "Sending link" : "Send reset link"}
        </Button>
      </form>
    </Form>
  );
}
