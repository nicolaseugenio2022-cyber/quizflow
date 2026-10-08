import {
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  School,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons for navigation entries. Config stays serializable (names only) so the
 * server shell can pass it to the client nav; both sides resolve icons here.
 */
export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  classes: School,
  students: Users,
  quizzes: ClipboardList,
  results: ChartColumn,
  integrity: ShieldCheck,
} as const satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICONS;
