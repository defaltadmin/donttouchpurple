import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Don't Touch Purple",
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
  },
  twitter: {
    card: 'summary_large_image',
    title: "Don't Touch Purple",
    description: 'Tap every color. Avoid purple. Survive the boss.',
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
