import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Quizzes" };

const PLANNED = [
  "Form-style editor with question cards, answer keys and points",
  "Word (.docx) import with a review step before anything is added",
  "Availability, duration, attempts and shuffling settings",
  "Student-view preview, validation and publication",
] as const;

export default function TeacherQuizzesPage() {
  return (
    <PreviewScreen
      item={getNavItem("TEACHER_ADMIN", "quizzes")}
      planned={PLANNED}
      milestone="Phase 3: Quiz authoring"
    />
  );
}
