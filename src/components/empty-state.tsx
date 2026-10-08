import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Quiet placeholder for a section with nothing to show yet. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-dashed bg-background/60 p-6",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        {children && (
          <p className="mt-1 text-sm text-muted-foreground">{children}</p>
        )}
      </div>
    </div>
  );
}
