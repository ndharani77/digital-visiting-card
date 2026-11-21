"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import WorkspaceHeader from "@/layout/WorkspaceHeader";
import { WorkspaceLayoutContext } from "@/layout/WorkspaceLayoutContext";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publicCardRoute = /^\/card\/[^/]+\/?$/.test(pathname);
  const showWorkspace = pathname !== "/login" && !publicCardRoute;

  if (!showWorkspace) return children;

  return (
    <WorkspaceLayoutContext.Provider value={true}>
      <div className="min-h-screen md:flex">
        <Sidebar persistent />
        <div className="min-w-0 flex-1">
          <WorkspaceHeader showDashboardLink={pathname !== "/"} />
          <div className="workspace-route-content">{children}</div>
        </div>
      </div>
    </WorkspaceLayoutContext.Provider>
  );
}
