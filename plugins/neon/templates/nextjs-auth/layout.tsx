/**
 * Root Layout with Neon Auth
 *
 * File: app/layout.tsx
 */

import type { Metadata } from 'next';
import '@neondatabase/neon-js/ui/css';
import './globals.css';
import { AuthProvider } from './providers';

export const metadata: Metadata = {
  title: 'My App',
  description: 'Powered by Neon Auth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
