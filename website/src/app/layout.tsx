import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Don't Touch Purple — Reflex Grid-Tapping Game",
  description:
    "A fast-paced reflex game where you tap every color except purple. Boss events, 15 animated backgrounds, 37 achievements, and daily challenges. Free to play, no ads.",
  keywords: [
    "reflex game",
    "reaction time",
    "grid tapping",
    "boss events",
    "daily challenge",
    "achievements",
    "free game",
  ],
  openGraph: {
    title: "Don't Touch Purple",
    description:
      "Tap every color. Avoid purple. Survive boss events. How long can you last?",
    url: "https://donttouchpurple.com",
    siteName: "Don't Touch Purple",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Don't Touch Purple",
    description:
      "Tap every color. Avoid purple. Survive boss events. How long can you last?",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
