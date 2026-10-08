import { describe, expect, it } from "vitest";

import { APP_NAV, getNavItem, isActiveHref } from "@/navigation/app-nav";
import { NAV_ICONS } from "@/navigation/nav-icons";

describe("role navigation", () => {
  it("lists the teacher/admin tabs in order", () => {
    expect(APP_NAV.TEACHER_ADMIN.map((item) => item.label)).toEqual([
      "Dashboard",
      "Classes",
      "Students",
      "Quizzes",
      "Results",
      "Integrity",
    ]);
  });

  it("lists the student tabs in order", () => {
    expect(APP_NAV.STUDENT.map((item) => item.label)).toEqual([
      "Dashboard",
      "Classes",
      "Quizzes",
      "Results",
    ]);
  });

  it("keeps each role's links inside its own area", () => {
    for (const item of APP_NAV.TEACHER_ADMIN) {
      expect(item.href).toBe(`/teacher/${item.key}`);
    }
    for (const item of APP_NAV.STUDENT) {
      expect(item.href).toBe(`/student/${item.key}`);
    }
  });

  it("resolves an icon for every entry", () => {
    for (const item of [...APP_NAV.TEACHER_ADMIN, ...APP_NAV.STUDENT]) {
      expect(NAV_ICONS[item.icon]).toBeDefined();
    }
  });

  it("looks up an entry by key", () => {
    expect(getNavItem("TEACHER_ADMIN", "integrity").href).toBe(
      "/teacher/integrity",
    );
    expect(getNavItem("STUDENT", "results").label).toBe("Results");
  });

  it("matches the active entry for nested paths only", () => {
    expect(isActiveHref("/teacher/quizzes", "/teacher/quizzes")).toBe(true);
    expect(isActiveHref("/teacher/quizzes/abc", "/teacher/quizzes")).toBe(true);
    expect(isActiveHref("/teacher/quizzes-old", "/teacher/quizzes")).toBe(
      false,
    );
  });
});
