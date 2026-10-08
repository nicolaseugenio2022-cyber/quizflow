import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Students" };

const PLANNED = [
  "Rosters for each class you own",
  "Enroll an existing student manually, without duplicates",
  "Active and inactive enrollment status",
  "Deactivate an enrollment while keeping attempt history",
] as const;

export default function TeacherStudentsPage() {
  return (
    <PreviewScreen
      item={getNavItem("TEACHER_ADMIN", "students")}
      planned={PLANNED}
      milestone="Phase 2: Classes"
    />
  );
}
