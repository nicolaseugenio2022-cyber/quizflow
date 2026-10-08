import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Quizzes" };

const PLANNED = [
  "Quizzes grouped by status, with open and close times",
  "Instructions with time limit, attempts and monitoring notice",
  "Automatic saving and recovery if your connection drops",
] as const;

export default function StudentQuizzesPage() {
  return (
    <PreviewScreen
      item={getNavItem("STUDENT", "quizzes")}
      planned={PLANNED}
      milestone="Phase 4: Attempts"
    />
  );
}
