import { ClipboardCheck, History, WifiOff } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { BlurText } from "@/components/react-bits/blur-text";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

import { QuizSpecimen } from "./_components/quiz-specimen";

const POINTS = [
  {
    icon: ClipboardCheck,
    title: "Run classes without spreadsheets",
    body: "Create a class, add students by name or with a QR code, and publish quizzes that grade themselves.",
  },
  {
    icon: WifiOff,
    title: "Finish what you start",
    body: "Answers save as you go. If the connection drops, keep answering. QuizFlow syncs when you are back online.",
  },
  {
    icon: History,
    title: "Context, not accusations",
    body: "Teachers see a plain timeline of tab switches and disconnects. Events inform a review and never change a score.",
  },
];

export default function LandingPage() {
  return (
    <div className="aura flex min-h-dvh flex-col">
      <header className="px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-1 sm:px-2">
          <Brand className="mr-auto" />
          <nav aria-label="Primary">
            <ul className="flex items-center gap-1">
              <li>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden sm:inline-flex"
                >
                  <a href="#how-it-works">How it works</a>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <Link href="/login">Sign in</Link>
                </Button>
              </li>
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-20">
          <div className="max-w-xl">
            <BlurText
              as="h1"
              text="Quizzes that keep every answer."
              delay={90}
              stepDuration={0.3}
              className="font-display text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl"
            />
            <p className="mt-6 max-w-[34rem] text-lg text-muted-foreground">
              QuizFlow gives senior high school and college classes one calm
              place to join, take and grade quizzes. Work saves while students
              answer and survives refreshes, weak connections and closed tabs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/login">Sign in to QuizFlow</Link>
              </Button>
            </div>
          </div>
          <QuizSpecimen className="mx-auto w-full max-w-md lg:mr-0" />
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="border-t bg-card/60"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2
              id="how-it-works-heading"
              className="max-w-2xl text-3xl font-semibold sm:text-4xl"
            >
              Built for real classrooms, phones and shared Wi-Fi included.
            </h2>
            <ul className="mt-10 grid gap-10 md:grid-cols-3">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Icon aria-hidden="true" className="size-6 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>QuizFlow for SHS and college classes</span>
        </div>
      </footer>
    </div>
  );
}
