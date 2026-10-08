import type { UserRole } from "@/lib/permissions/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: "dashboard" | "classes";
}

/** Primary navigation per role. Icons are resolved in the client nav. */
export const APP_NAV: Record<UserRole, NavItem[]> = {
  TEACHER_ADMIN: [
    { href: "/teacher/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/teacher/classes", label: "Classes", icon: "classes" },
  ],
  STUDENT: [
    { href: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/student/classes", label: "Classes", icon: "classes" },
  ],
};
