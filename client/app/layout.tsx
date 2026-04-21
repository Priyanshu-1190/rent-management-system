import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rent Management System",
  description: "Day 1 full-stack skeleton for the rent management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
