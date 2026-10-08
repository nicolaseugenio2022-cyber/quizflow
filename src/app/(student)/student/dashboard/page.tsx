import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Student dashboard" };

const PLANNED = [
  "Quizzes due soon in your classes",
  "Attempts you can resume",
  "Your latest released results",
] as const;

export default function StudentDashboardPage() {
  return (
    <PreviewScreen
      item={getNavItem("STUDENT", "dashboard")}
      planned={PLANNED}
      milestone="Phases 2 to 5, as each area ships"
    />
  );
}
