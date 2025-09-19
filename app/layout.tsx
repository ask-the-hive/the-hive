export const dynamic = 'force-dynamic';

import type { Metadata, Viewport } from 'next';

import { DM_Sans, DM_Mono } from 'next/font/google';

import './globals.css';
import Providers from './_contexts';
import '@/components/utils/suppress-console';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  weight: ['300', '400', '500'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'The Hive',
  description: 'A modular network of interoperable DeFi agents',
};

export const viewport: Viewport = {
  width: 'device-width',
  height: 'device-height',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${dmMono.variable} antialiased bg-white dark:bg-neutral-900`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
