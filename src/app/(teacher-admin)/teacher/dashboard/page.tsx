import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Teacher dashboard" };

const PLANNED = [
  "Active classes with roster and quiz counts",
  "Quizzes and attempts that need your review",
  "Recent enrollments, submissions and grade changes",
] as const;

export default function TeacherDashboardPage() {
  return (
    <PreviewScreen
      item={getNavItem("TEACHER_ADMIN", "dashboard")}
      planned={PLANNED}
      milestone="Phases 2 to 5, as each area ships"
    />
  );
}
