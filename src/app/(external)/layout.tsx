import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/** Signed-out pages: login and password recovery. */
export default function ExternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="aura flex min-h-dvh flex-col">
      <header className="px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-1 sm:px-2">
          <Brand />
          <ThemeToggle />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 outline-none sm:items-center sm:pt-0"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
