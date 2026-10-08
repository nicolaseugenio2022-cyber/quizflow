import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Classes" };

const PLANNED = [
  "Create a class with subject, academic level, school year and term",
  "List, filter and archive your classes",
  "Class overview with roster, quizzes and activity",
  "QR invites you can display, download, replace or revoke",
] as const;

export default function TeacherClassesPage() {
  return (
    <PreviewScreen
      item={getNavItem("TEACHER_ADMIN", "classes")}
      planned={PLANNED}
      milestone="Phase 2: Classes"
    />
  );
}
