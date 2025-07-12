import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/theme-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SilentParcel - Privacy-Focused File Sharing & Anonymous Chat',
  description: 'Share files securely and chat anonymously with ephemeral rooms. No registration required.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="dark"
          storageKey="silentparcel-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}