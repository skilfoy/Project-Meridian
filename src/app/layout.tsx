import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'MERIDIAN — Geopolitical Threat Intelligence',
  description: 'Enterprise-grade geopolitical threat intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="h-full antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
