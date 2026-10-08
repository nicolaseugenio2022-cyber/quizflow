import { CalendarClock, GraduationCap, QrCode } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader, Panel } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Student dashboard" };

export default function StudentDashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Dashboard"
        description="Quizzes that are open or coming up, and your latest results."
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Due quizzes">
          <EmptyState icon={CalendarClock} title="No quizzes due">
            When a teacher opens a quiz for your class, it appears here with its
            deadline.
          </EmptyState>
        </Panel>
        <Panel title="Your classes">
          <EmptyState icon={QrCode} title="Not in a class yet">
            Scan the QR code your teacher shows to join their class.
          </EmptyState>
        </Panel>
      </div>
      <Panel title="Recent results">
        <EmptyState icon={GraduationCap} title="No results yet">
          Results appear after your teacher releases them.
        </EmptyState>
      </Panel>
    </div>
  );
}
