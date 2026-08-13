import type { ReactNode } from "react";
import DashboardGate from "@/components/DashboardGate";

export const dynamic = "force-dynamic";

/**
 * Sessions are token-based and the token lives client-side (sessionStorage),
 * so the server cannot authenticate page loads itself. The client gate
 * re-authenticates via the token before rendering the dashboard shell.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardGate>{children}</DashboardGate>;
}
