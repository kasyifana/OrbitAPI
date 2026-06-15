import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit API - Advanced API Client & Snapshot System",
  description: "Test your API endpoints, save versioned response snapshots, visual diff response changes over time, auto-generate schemas, and share interactive API documentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
