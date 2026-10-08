"use client";

import { Check, ChevronsUpDown, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { isActiveHref, type NavItem } from "@/navigation/app-nav";
import { NAV_ICONS } from "@/navigation/nav-icons";

/**
 * Role navigation. From `md` up every destination is an inline tab; below
 * that, a full-width switcher names the current page and opens a sheet that
 * lists every destination (no horizontally scrolling tabs to hide items).
 */
export function AppNav({
  items,
  workspaceLabel,
}: {
  items: readonly NavItem[];
  workspaceLabel: string;
}) {
  const pathname = usePathname();
  const current = items.find((item) => isActiveHref(pathname, item.href));

  return (
    <>
      <nav aria-label="Primary" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active = item === current;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground active:bg-accent",
                    active &&
                      "bg-accent font-semibold text-accent-foreground after:absolute after:inset-x-3 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-primary hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("size-4", active && "text-primary")}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="Primary" className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-11 w-full items-center gap-3 rounded-xl px-2 text-left transition-colors hover:bg-accent/60 active:bg-accent"
            >
              <CurrentIcon item={current} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                <span className="sr-only">Open navigation. Current page: </span>
                {current?.label ?? "Menu"}
              </span>
              <ChevronsUpDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            onOpenAutoFocus={focusCurrentLink}
            className="max-h-[85dvh] gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="px-5 pt-5 pb-3">
              <SheetTitle className="font-display text-lg">
                Go to a page
              </SheetTitle>
              <SheetDescription>{workspaceLabel}</SheetDescription>
            </SheetHeader>
            <ul className="grid gap-1 overflow-y-auto px-3">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                const active = item === current;
                return (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-14 items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-accent/60 active:bg-accent",
                          active && "bg-accent text-accent-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground",
                            active && "bg-primary text-primary-foreground",
                          )}
                        >
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-sm font-medium",
                              active && "font-semibold",
                            )}
                          >
                            {item.label}
                          </span>
                          <span
                            className={cn(
                              "block text-xs text-muted-foreground",
                              active && "text-accent-foreground/80",
                            )}
                          >
                            {item.description}
                          </span>
                        </span>
                        {active && (
                          <Check
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                          />
                        )}
                      </Link>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}

/** Start keyboard and screen-reader users on the page they are on. */
function focusCurrentLink(event: Event) {
  const current = (
    event.currentTarget as HTMLElement | null
  )?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!current) return;
  event.preventDefault();
  current.focus();
}

function CurrentIcon({ item }: { item: NavItem | undefined }) {
  const Icon = item ? NAV_ICONS[item.icon] : Menu;
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
      <Icon aria-hidden="true" className="size-4" />
    </span>
  );
}
