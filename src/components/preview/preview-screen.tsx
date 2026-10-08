import { CircleDashed } from "lucide-react";
import { useId } from "react";

import { PageHeader } from "@/components/layout/page-header";
import type { NavItem } from "@/navigation/app-nav";
import { NAV_ICONS } from "@/navigation/nav-icons";

/**
 * Honest placeholder for a screen whose milestone has not shipped. It lists
 * what the screen will hold, never sample data.
 */
export function PreviewScreen({
  item,
  planned,
  milestone,
}: {
  item: NavItem;
  /** Capabilities this screen will offer, in plain language. */
  planned: readonly string[];
  /** Delivery phase from docs/project.md, for example "Phase 2: Classes". */
  milestone: string;
}) {
  const Icon = NAV_ICONS[item.icon];
  // Unique per render: Next.js can keep the previous page mounted but hidden.
  const titleId = useId();

  return (
    <div className="grid gap-8">
      <PageHeader title={item.label} description={item.description} />

      <section
        aria-labelledby={titleId}
        className="surface overflow-hidden rounded-2xl"
      >
        <div className="flex items-start gap-4 p-5 sm:gap-5 sm:p-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground sm:size-11">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="max-w-xl">
            <h2 id={titleId} className="text-lg font-semibold">
              UI preview
            </h2>
            <p className="mt-1 text-muted-foreground">
              This screen isn’t finished yet. Its workflows and data will be
              connected in an upcoming milestone.
            </p>
          </div>
        </div>

        <div className="border-t bg-muted/40 p-5 sm:p-6">
          <h3 className="text-sm font-semibold">Planned for this screen</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {planned.map((entry) => (
              <li
                key={entry}
                className="flex items-start gap-2.5 rounded-lg border border-dashed border-foreground/20 bg-card/70 px-3 py-2.5 text-sm"
              >
                <CircleDashed
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <span>{entry}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Milestone: {milestone}
          </p>
        </div>
      </section>
    </div>
  );
}
