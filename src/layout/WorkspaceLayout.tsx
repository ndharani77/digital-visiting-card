"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import WorkspaceHeader from "@/layout/WorkspaceHeader";
import { WorkspaceLayoutContext } from "@/layout/WorkspaceLayoutContext";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publicCardRoute = /^\/card\/[^/]+\/?$/.test(pathname);
  const [authenticatedCardPath, setAuthenticatedCardPath] = useState<string | null>(null);
  const [canvasCardForm, setCanvasCardForm] = useState(false);

  useEffect(() => {
    setCanvasCardForm(
      pathname === "/create-card" &&
      new URLSearchParams(window.location.search).get("canvas") === "1"
    );
  }, [pathname]);

  useEffect(() => {
    if (!publicCardRoute) return;
    let cancelled = false;

    async function checkCardPreviewSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.status === 401) return;
        if (!response.ok) throw new Error("Unable to verify workspace access for this card preview.");
        if (!cancelled) setAuthenticatedCardPath(pathname);
      } catch (error) {
        if (!cancelled) console.error("Unable to verify workspace access for this card preview.", error);
      }
    }

    void checkCardPreviewSession();
    return () => {
      cancelled = true;
    };
  }, [pathname, publicCardRoute]);

  const showWorkspace = pathname !== "/login" &&
    (!publicCardRoute || authenticatedCardPath === pathname);

  if (!showWorkspace) return children;

  return (
    <WorkspaceLayoutContext.Provider value={true}>
      <div className="min-h-screen md:flex">
        <div className="hidden w-[264px] shrink-0 md:block">
          <Sidebar persistent />
        </div>
        <div className="min-w-0 flex-1">
          {!publicCardRoute && <WorkspaceHeader showDashboardLink={pathname !== "/"} />}
          <div className="workspace-route-content" style={canvasCardForm ? { paddingTop: 0 } : undefined}>{children}</div>
        </div>
      </div>
    </WorkspaceLayoutContext.Provider>
  );
}
