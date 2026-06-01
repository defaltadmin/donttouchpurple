import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: "Don't Touch Purple - Free Reflex Game",
  description:
    'Tap every color. Avoid purple. Survive the boss. A free reflex game with boss events, 12 special cell types, and daily challenges.',
  keywords: [
    'reflex game',
    'reaction time',
    'grid tapping',
    'boss events',
    'daily challenge',
    'free game',
    'browser game',
  ],
  openGraph: {
    title: "Don't Touch Purple",
    description: 'Tap every color. Avoid purple. Survive the boss.',
    url: 'https://game.mscarabia.com',
    siteName: "Don't Touch Purple",
    type: 'website',
    images: [{ url: 'https://game.mscarabia.com/og.png', width: 1200, height: 630, alt: "Don't Touch Purple" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Don't Touch Purple",
    description: 'Tap every color. Avoid purple. Survive the boss.',
    images: ['https://game.mscarabia.com/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
