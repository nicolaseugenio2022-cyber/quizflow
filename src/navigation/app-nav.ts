import type { UserRole } from "@/lib/permissions/roles";

import type { NavIconName } from "./nav-icons";

export interface NavItem {
  key: string;
  href: string;
  label: string;
  /** One line shown in the mobile menu and as the page description. */
  description: string;
  icon: NavIconName;
}

/**
 * Primary navigation per role, in display order. Every entry has a real page;
 * unfinished pages render the shared UI preview state.
 */
export const APP_NAV = {
  TEACHER_ADMIN: [
    {
      key: "dashboard",
      href: "/teacher/dashboard",
      label: "Dashboard",
      description: "Workspace overview",
      icon: "dashboard",
    },
    {
      key: "classes",
      href: "/teacher/classes",
      label: "Classes",
      description: "Class creation and management",
      icon: "classes",
    },
    {
      key: "students",
      href: "/teacher/students",
      label: "Students",
      description: "Rosters, manual enrollment, and student status",
      icon: "students",
    },
    {
      key: "quizzes",
      href: "/teacher/quizzes",
      label: "Quizzes",
      description:
        "Form-style authoring, Word import, scheduling, and publication",
      icon: "quizzes",
    },
    {
      key: "results",
      href: "/teacher/results",
      label: "Results",
      description: "Submissions, grading, overrides, and result release",
      icon: "results",
    },
    {
      key: "integrity",
      href: "/teacher/integrity",
      label: "Integrity",
      description: "Attempt-event summaries and review timelines",
      icon: "integrity",
    },
  ],
  STUDENT: [
    {
      key: "dashboard",
      href: "/student/dashboard",
      label: "Dashboard",
      description: "Assignments and recent activity",
      icon: "dashboard",
    },
    {
      key: "classes",
      href: "/student/classes",
      label: "Classes",
      description: "Enrolled classes and QR registration",
      icon: "classes",
    },
    {
      key: "quizzes",
      href: "/student/quizzes",
      label: "Quizzes",
      description: "Upcoming, available, in-progress, and completed quizzes",
      icon: "quizzes",
    },
    {
      key: "results",
      href: "/student/results",
      label: "Results",
      description: "Released grades and permitted answer review",
      icon: "results",
    },
  ],
} as const satisfies Record<UserRole, readonly NavItem[]>;

export type NavKey<R extends UserRole> = (typeof APP_NAV)[R][number]["key"];

/** Looks up one role's nav entry so a page shares its label and description. */
export function getNavItem<R extends UserRole>(
  role: R,
  key: NavKey<R>,
): NavItem {
  const item = (APP_NAV[role] as readonly NavItem[]).find(
    (entry) => entry.key === key,
  );
  if (!item) throw new Error(`Unknown nav item: ${role}/${key}`);
  return item;
}

export function isActiveHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
