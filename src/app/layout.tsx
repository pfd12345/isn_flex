import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelligent Scientific Notebook",
  description: "One notebook, one thread — from risk identification to regulatory readiness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white text-[#1A1D21] antialiased font-sans">{children}</body>
    </html>
  );
}
