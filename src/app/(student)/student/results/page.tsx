import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Results" };

const PLANNED = [
  "Released scores with earned and possible points",
  "Answer review when your teacher allows it",
  "Submitted quizzes still waiting for release",
] as const;

export default function StudentResultsPage() {
  return (
    <PreviewScreen
      item={getNavItem("STUDENT", "results")}
      planned={PLANNED}
      milestone="Phase 5: Grading and integrity"
    />
  );
}
