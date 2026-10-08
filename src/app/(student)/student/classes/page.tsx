import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Classes" };

const PLANNED = [
  "Classes you are enrolled in",
  "Join a class by scanning your teacher’s QR code",
  "Class details and assigned quizzes",
] as const;

export default function StudentClassesPage() {
  return (
    <PreviewScreen
      item={getNavItem("STUDENT", "classes")}
      planned={PLANNED}
      milestone="Phase 2: Classes"
    />
  );
}
