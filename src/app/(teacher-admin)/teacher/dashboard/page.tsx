import { Activity, ClipboardList, Users } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader, Panel } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Teacher dashboard" };

export default function TeacherDashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Dashboard"
        description="Your classes, quizzes that need you, and what changed recently."
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Active classes">
          <EmptyState icon={Users} title="No classes yet">
            Classes you create appear here with their rosters and quizzes.
          </EmptyState>
        </Panel>
        <Panel title="Needs your attention">
          <EmptyState icon={ClipboardList} title="Nothing to review">
            Submissions that need manual grading will wait here.
          </EmptyState>
        </Panel>
      </div>
      <Panel title="Recent activity">
        <EmptyState icon={Activity} title="No activity yet">
          Enrollments, submissions and grade changes will show up as they
          happen.
        </EmptyState>
      </Panel>
    </div>
  );
}
