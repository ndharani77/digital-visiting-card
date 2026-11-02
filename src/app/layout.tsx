import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Reader | Digital Visiting Cards",
  description: "Create digital visiting cards, share them with QR codes and save contacts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
