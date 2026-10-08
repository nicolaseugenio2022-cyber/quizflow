import { RoleLayout } from "@/components/layout/role-layout";

// Signed-in areas wait for the session check on the server instead of
// streaming an instant shell; anonymous visitors are redirected to /login.
export const instant = false;

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="STUDENT">{children}</RoleLayout>;
}
