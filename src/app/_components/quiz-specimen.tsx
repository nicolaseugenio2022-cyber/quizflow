import { Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

const OPTIONS = ["1.5 N", "5 N", "6 N", "9 N"];
const SELECTED = 2;

/**
 * Static illustration of the attempt screen for the landing page: one
 * question, a selected answer, the save state and a calm timer.
 */
export function QuizSpecimen({ className }: { className?: string }) {
  return (
    <figure
      className={cn("relative", className)}
      aria-labelledby="specimen-caption"
    >
      <div className="glass-strong rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>General Physics 2</span>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Clock aria-hidden="true" className="size-4" />
            18:42 left
          </span>
        </div>

        <p className="mt-5 text-sm font-medium text-primary">
          Question 4 of 12
        </p>
        <p className="mt-1.5 font-display text-xl leading-snug font-semibold">
          A 2&nbsp;kg cart accelerates at 3&nbsp;m/s². What net force acts on
          it?
        </p>

        <ul className="mt-5 grid gap-2" aria-hidden="true">
          {OPTIONS.map((option, index) => {
            const selected = index === SELECTED;
            return (
              <li
                key={option}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-base",
                  selected && "border-primary bg-accent text-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border-2 border-input",
                    selected && "border-primary bg-primary",
                  )}
                >
                  {selected && (
                    <span className="size-2 rounded-full bg-primary-foreground" />
                  )}
                </span>
                {option}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <Check aria-hidden="true" className="size-4" />
            Saved
          </span>
          <span className="text-muted-foreground">8 of 12 answered</span>
        </div>
      </div>
      <figcaption
        id="specimen-caption"
        className="mt-3 text-center text-sm text-muted-foreground"
      >
        Every change saves on its own. The save state stays in view.
      </figcaption>
    </figure>
  );
}
