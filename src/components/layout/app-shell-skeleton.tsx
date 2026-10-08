import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the session is read for a signed-in route group. */
export function AppShellSkeleton() {
  return (
    <div className="aura min-h-dvh" aria-busy="true">
      <span className="sr-only" role="status">
        Loading your workspace
      </span>
      <div className="px-3 pt-3 sm:px-4">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-2xl px-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="ml-auto size-10 rounded-full" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pt-8 sm:px-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
