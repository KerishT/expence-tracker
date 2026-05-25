import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/shared/ui/sonner';
import { cn } from '@/shared/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Track your expenses easily',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
