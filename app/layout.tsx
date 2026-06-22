import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galaticos — Generatore Squadre Calcetto',
  description: 'Generatore di squadre per calcetto amatoriale',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" data-theme="dark">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,600,700&f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
