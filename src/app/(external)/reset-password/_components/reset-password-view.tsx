"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation/auth";

import { AuthPanel } from "../../_components/auth-panel";
import { FormStatus, UNAVAILABLE_COPY } from "../../_components/form-status";
import { PasswordInput } from "../../_components/password-input";
import { resetPasswordAction } from "../_actions/reset-password";

// The raw token arrives in the URL. It is read once in the browser, kept in
// memory, and removed from the address bar so it does not linger in history
// or leak through the Referer header. The page itself never renders it.
let capturedToken: string | null = null;

function readToken(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("token");
  if (fromUrl) capturedToken = fromUrl;
  return capturedToken;
}

const subscribe = () => () => {};

const requestNewLink = (
  <Link
    href="/forgot-password"
    className="font-medium text-primary underline-offset-4 hover:underline"
  >
    Request a new reset link
  </Link>
);

export function ResetPasswordView() {
  // `undefined` while rendering on the server and during hydration.
  const token = useSyncExternalStore<string | null | undefined>(
    subscribe,
    readToken,
    () => undefined,
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("token")) {
      url.searchParams.delete("token");
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  if (token === undefined) {
    return (
      <AuthPanel title="Choose a new password">
        <div className="grid gap-4" aria-hidden="true">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      </AuthPanel>
    );
  }

  if (!token) {
    return (
      <AuthPanel
        title="This reset link isn't valid"
        description="The link is missing its code, has expired, or was already used. Reset links work once and expire after a short time."
        footer={
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <Button asChild size="lg" className="h-11 w-full text-base">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Choose a new password"
      description="After you save it, sign in again on each of your devices."
      footer={requestNewLink}
    >
      <ResetPasswordForm token={token} />
    </AuthPanel>
  );
}

type Status =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "unavailable" }
  | { kind: "failed" };

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordInput) {
    startTransition(async () => {
      try {
        const result = await resetPasswordAction(values);
        if (result.status === "success") {
          router.replace(result.redirectTo ?? "/login");
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
            <FormStatus tone="error" title={status.message} />
          )}
          {status.kind === "unavailable" && (
            <FormStatus tone="info" title={UNAVAILABLE_COPY.recovery.title}>
              {UNAVAILABLE_COPY.recovery.body}
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
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>
                Use at least {PASSWORD_MIN_LENGTH} characters. A short phrase
                works well.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
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
          {pending ? "Saving password" : "Save new password"}
        </Button>
      </form>
    </Form>
  );
}
