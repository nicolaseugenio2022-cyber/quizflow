import { FlaskConical } from "lucide-react";

/**
 * Restrained banner under the signed-in navigation. It stays on every
 * teacher/admin and student screen until the product milestones ship.
 */
export function PreviewNotice() {
  return (
    <div
      role="note"
      aria-label="Preview mode"
      className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-accent/50 px-3.5 py-2.5 text-sm sm:items-center"
    >
      <FlaskConical
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-primary sm:mt-0"
      />
      <p>
        <strong className="font-semibold">Preview mode</strong>
        <span className="text-foreground/80">
          {" "}
          QuizFlow’s interface and features are still being built.
        </span>
      </p>
    </div>
  );
}
