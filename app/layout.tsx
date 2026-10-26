import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Daily Digest | Your morning, made simple",
  description: "Your private morning priorities, local weather, and Linux and cloud updates.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
