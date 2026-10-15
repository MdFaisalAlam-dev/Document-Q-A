import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document QnA",
  description:
    "AI-powered document intelligence and question answering system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}