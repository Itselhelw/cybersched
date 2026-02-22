import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CyberSched — Life OS',
  description: 'Your personal AI life optimization system. Body, Mind, Work — all tracked.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
