import type { Metadata } from "next";

import { PreviewScreen } from "@/components/preview/preview-screen";
import { getNavItem } from "@/navigation/app-nav";

export const metadata: Metadata = { title: "Integrity" };

const PLANNED = [
  "Event counts and severity cues for each attempt",
  "Chronological event timeline for review",
  "Events shown as context for your judgment, never as proof of misconduct",
] as const;

export default function TeacherIntegrityPage() {
  return (
    <PreviewScreen
      item={getNavItem("TEACHER_ADMIN", "integrity")}
      planned={PLANNED}
      milestone="Phase 5: Grading and integrity"
    />
  );
}
