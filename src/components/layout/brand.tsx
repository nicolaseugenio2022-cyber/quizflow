import Link from "next/link";

import { cn } from "@/lib/utils";

/** QuizFlow mark: a rounded tile holding a check that flows into a tail. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 16.5l4.5 4.5L23 11.5"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <path
        d="M19.5 22.5c2 0 3.5-.6 4.5-1.6"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-primary-foreground/60"
      />
    </svg>
  );
}

export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg font-display text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <BrandMark />
      <span>QuizFlow</span>
    </Link>
  );
}
