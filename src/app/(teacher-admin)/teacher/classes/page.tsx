import { Users } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader, Panel } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Classes" };

export default function TeacherClassesPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Classes"
        description="Create classes, manage rosters and share QR invites."
      />
      <Panel title="Your classes">
        <EmptyState icon={Users} title="No classes yet">
          Each class you create will list its subject, term and student count.
        </EmptyState>
      </Panel>
    </div>
  );
}
