"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

import { FormStatus, UNAVAILABLE_COPY } from "../../_components/form-status";
import { PasswordInput } from "../../_components/password-input";
import { signInAction } from "../_actions/sign-in";

type Status =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "unavailable" }
  | { kind: "failed" };

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    // returnTo is read at submit time so the page itself stays static.
    const returnTo =
      new URLSearchParams(window.location.search).get("returnTo") ?? undefined;
    startTransition(async () => {
      try {
        const result = await signInAction({ ...values, returnTo });
        if (result.status === "success") {
          router.replace(result.redirectTo ?? "/");
          return;
        }
        setStatus(
          result.status === "invalid"
            ? { kind: "invalid", message: result.message }
            : { kind: "unavailable" },
        );
      } catch {
        setStatus({ kind: "failed" });
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
          {status.kind === "invalid" && (
            <FormStatus tone="error" title={status.message}>
              Check your email and password, then try again.
            </FormStatus>
          )}
          {status.kind === "unavailable" && (
            <FormStatus tone="info" title={UNAVAILABLE_COPY.signIn.title}>
              {UNAVAILABLE_COPY.signIn.body}
            </FormStatus>
          )}
          {status.kind === "failed" && (
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
                  autoComplete="username"
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-baseline justify-between gap-3">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
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
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
