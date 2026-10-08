import { QrCode } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader, Panel } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Classes" };

export default function StudentClassesPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Classes"
        description="Classes you are enrolled in and their quizzes."
      />
      <Panel title="Your classes">
        <EmptyState icon={QrCode} title="Not in a class yet">
          Scan the QR code your teacher shows to join their class.
        </EmptyState>
      </Panel>
    </div>
  );
}
