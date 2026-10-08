import type { ReactNode } from "react";

/** Glass panel shared by the signed-out pages. */
export function AuthPanel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="auth-title"
      className="glass rounded-2xl p-6 sm:p-8"
    >
      <h1 id="auth-title" className="text-3xl font-semibold">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
      <div className="mt-6">{children}</div>
      {footer && (
        <div className="mt-6 border-t pt-5 text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </section>
  );
}
