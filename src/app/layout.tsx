import type { Metadata } from "next";
import WorkspaceLayout from "@/layout/WorkspaceLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Reader | Digital Visiting Cards",
  description: "Create digital visiting cards, share them with QR codes and save contacts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><WorkspaceLayout>{children}</WorkspaceLayout></body></html>;
}
