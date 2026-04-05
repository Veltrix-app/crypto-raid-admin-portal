import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto Raid Admin Portal",
  description: "Project and campaign management portal"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}