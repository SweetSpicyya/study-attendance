import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "스터디 출근체크",
  description: "Study attendance tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
