import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Results" };

const PLANNED = [
  "Submissions and completion state for each quiz",
  "Automatic grading with a queue for answers that need review",
  "Score overrides with a required reason and grade history",
  "Result release to students",
] as const;

export default function TeacherResultsPage() {
  return (
    <PreviewScreen
      item={getNavItem("TEACHER_ADMIN", "results")}
      planned={PLANNED}
      milestone="Phase 5: Grading and integrity"
    />
  );
}
